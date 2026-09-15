import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { CHAPTER_FLOW } from '../shared/roomState.js';
import { createRoomApi } from '../server/roomApi.js';

const ROLES_STEP = CHAPTER_FLOW[1].findIndex(({ id }) => id === 'roles');

// Boots the real middleware over a real socket, so the checks under test are the ones a
// browser actually meets: headers, status codes and the broadcast snapshot.
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
    await run({ post, snapshot });
  } finally {
    api.close();
    server.close();
    await once(server, 'close');
  }
}

// Opens the roles activity the way the teacher's screen does.
async function openRoles(post) {
  await post('changeStep', { step: ROLES_STEP });
  await post('presentation', { chapter: 1, step: ROLES_STEP, mode: 'activity' });
}

test('an answer is filed under whoever holds the token, not the name in the request', () => withRoom(async ({ post, snapshot }) => {
  const { pin } = (await snapshot()).state;
  const { studentToken, studentName } = await (await post('join', { pin, name: 'Ann' })).json();
  assert.equal(studentName, 'Ann');

  await openRoles(post);

  const vote = { activityId: 'roles', option: 'controller', name: 'Bee' };
  assert.equal((await post('choiceVote', vote)).status, 401);
  assert.equal((await post('choiceVote', vote, { 'x-student-token': studentToken })).status, 200);

  assert.deepEqual((await snapshot()).state.choiceVotes.roles, { Ann: 'controller' });
}));

test('a reopened tab reclaims its seat, a stranger typing the same name does not', () => withRoom(async ({ post, snapshot }) => {
  const { pin } = (await snapshot()).state;
  const { studentToken } = await (await post('join', { pin, name: 'Ann' })).json();

  await post('changeStep', { step: ROLES_STEP });
  assert.equal((await post('join', { pin, name: 'Bee' })).status, 400); // door closed behind the lesson
  assert.equal((await post('join', { pin, name: 'ann' })).status, 409); // same name, no proof

  const back = await post('join', { pin, name: 'ann' }, { 'x-student-token': studentToken });
  assert.equal(back.status, 200);
  assert.equal((await back.json()).studentName, 'Ann');
  assert.equal((await snapshot()).state.students.length, 1);
}));

test('the teacher screen drives the room without signing in', () => withRoom(async ({ post, snapshot }) => {
  assert.equal((await post('changeStep', { step: ROLES_STEP })).status, 200);
  assert.equal((await snapshot()).state.step, ROLES_STEP);
}));
