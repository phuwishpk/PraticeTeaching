import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { CHAPTER_FLOW, QUESTION_DURATION_MS } from '../shared/roomState.js';
import { createRoomApi } from '../server/roomApi.js';
import { act, age, openActivity } from './roomHarness.js';

const ROLES_STEP = CHAPTER_FLOW[1].findIndex(({ id }) => id === 'roles');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function withRoom(run) {
  const api = createRoomApi();
  const server = createServer((req, res) => api.middleware(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (type, payload, headers = {}) => fetch(`${base}/api/room/actions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ type, payload }),
  });
  const snapshot = async () => {
    const controller = new AbortController();
    const response = await fetch(`${base}/api/room/events`, { signal: controller.signal });
    const { value } = await response.body.getReader().read();
    controller.abort();
    return JSON.parse(new TextDecoder().decode(value).split('data: ')[1]);
  };
  try {
    await run({ post, snapshot, base, api });
  } finally {
    api.close();
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
}

async function seatOneLearner(post, snapshot) {
  const { pin } = (await snapshot()).state;
  const learner = await (await post('join', { pin, name: 'Ann' })).json();
  await post('changeStep', { step: ROLES_STEP });
  await post('presentation', { chapter: 1, step: ROLES_STEP, mode: 'activity' });
  return learner;
}

const ROLES = { activityId: 'roles', option: 'controller' };

test('a tap made in time is not refused because the network was slow', () => {
  // Tapped with a second to spare, then four seconds crawling over school wi-fi.
  const nearlyOver = age(openActivity('roles', ['Ann']), QUESTION_DURATION_MS - 1000 + 4000);
  const landed = act(nearlyOver, 'choiceVote', { ...ROLES, name: 'Ann' });
  assert.equal(landed.choiceVotes.roles.Ann, ROLES.option);
  assert.ok(landed.chapterScores[1].Ann > 0, 'and it is still worth the floor score');
});

test('an answer that is simply far too late is still refused', () => {
  const longGone = age(openActivity('roles', ['Ann']), QUESTION_DURATION_MS + 20000);
  assert.throws(() => act(longGone, 'choiceVote', { ...ROLES, name: 'Ann' }), /หมดเวลา/);
});

test('a retry after a lost response does not score twice', () => withRoom(async ({ post, snapshot }) => {
  const ann = await seatOneLearner(post, snapshot);
  const vote = () => post('choiceVote', { activityId: 'roles', option: 'controller' }, { 'x-student-token': ann.studentToken });
  await vote();
  const scored = (await snapshot()).state.chapterScores[1].Ann;
  // The learner saw a spinner, gave up and tapped again — twice.
  await vote();
  await vote();
  assert.equal((await snapshot()).state.chapterScores[1].Ann, scored);
}));

test('a flaky connection reconnecting over and over does not pile up streams', () => withRoom(async ({ snapshot, api }) => {
  for (let i = 0; i < 25; i++) await snapshot(); // each one opens and abandons a stream
  await sleep(300);
  assert.ok(api.stats().streams <= 2, `streams left open: ${api.stats().streams}`);
}));

test('a forged proxy header cannot buy a fresh rate-limit budget', () => withRoom(async ({ post }) => {
  // TRUST_PROXY is off, so x-forwarded-for is decoration; every one of these is the same
  // caller and has to share one budget. Believing the header would hand any learner an
  // unlimited supply of them.
  const replies = [];
  for (let i = 0; i < 1040; i++) {
    replies.push(await post('verifyPin', { pin: '0000' }, { 'x-forwarded-for': `10.0.0.${i % 250}` }));
  }
  const refused = replies.filter(reply => reply.status === 429).length;
  assert.ok(refused > 0, 'forging the header must not lift the limit');
}));

test('the health endpoint reports whether the room is actually being saved', () => withRoom(async ({ base }) => {
  const health = await fetch(`${base}/api/room/health`).then(response => response.json());
  assert.equal(health.ok, true);
  assert.equal(typeof health.students, 'number');
  assert.equal(typeof health.streams, 'number');
  // Saving is off in these tests, and the endpoint has to say so rather than imply all is well.
  assert.equal(health.persist.enabled, false);
  assert.equal(health.pin, undefined, 'an open endpoint must not hand out the PIN');
}));
