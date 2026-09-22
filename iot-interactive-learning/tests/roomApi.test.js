import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import { once } from 'node:events';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CHAPTER_FLOW, CONTENT_SIGNATURE, ROOM_ARCHIVE_DAYS } from '../shared/roomState.js';
import { createRoomApi } from '../server/roomApi.js';

const ROLES_STEP = CHAPTER_FLOW[1].findIndex(({ id }) => id === 'roles');
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Boots the real middleware over a real socket, so the checks under test are the ones a
// browser actually meets: headers, status codes and the broadcast snapshot.
async function withRoom(run, options) {
  const api = createRoomApi(options);
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

  const rooms = () => fetch(`${base}/api/room/rooms`).then(response => response.json()).then(data => data.rooms);

  try {
    await run({ post, snapshot, rooms, base });
  } finally {
    api.close();
    server.closeAllConnections();
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

test('a reopened tab keeps its seat without disturbing anything', () => withRoom(async ({ post, snapshot }) => {
  const { pin } = (await snapshot()).state;
  const first = await (await post('join', { pin, name: 'Ann' })).json();
  await post('changeStep', { step: ROLES_STEP });

  const again = await post('join', { pin, name: 'ann' }, { 'x-student-token': first.studentToken });
  assert.equal(again.status, 200);
  const back = await again.json();
  assert.equal(back.studentName, 'Ann');
  assert.equal(back.studentToken, first.studentToken, 'the same device keeps the token it had');
  assert.equal(back.studentId, first.studentId, 'and the seat is left exactly as it was');
  assert.equal((await snapshot()).state.students.length, 1);
}));

test('a learner whose device lost its session takes their own name back', () => withRoom(async ({ post, snapshot }) => {
  const { pin } = (await snapshot()).state;
  const first = await (await post('join', { pin, name: 'Ann' })).json();
  await openRoles(post);
  await post('choiceVote', { activityId: 'roles', option: 'controller' }, { 'x-student-token': first.studentToken });
  const scored = (await snapshot()).state.chapterScores[1].Ann;
  assert.ok(scored > 0);

  // Same name, no token — a phone that was wiped, or a different device entirely. The door
  // is shut by now, and that must not stand in the way of somebody reclaiming their seat.
  const retaken = await post('join', { pin, name: 'Ann' });
  assert.equal(retaken.status, 200);
  const seat = await retaken.json();
  assert.notEqual(seat.studentToken, first.studentToken);
  assert.notEqual(seat.studentId, first.studentId, 'a new seat id is what tells the old screen it was replaced');

  const room = (await snapshot()).state;
  assert.equal(room.students.length, 1, 'taking the name back must not create a second seat');
  assert.equal(room.chapterScores[1].Ann, scored, 'their score comes back with them');

  // The screen that used to hold the seat can no longer act as Ann.
  assert.equal((await post('emoji', { emoji: '🔥' }, { 'x-student-token': first.studentToken })).status, 401);
  assert.equal((await post('emoji', { emoji: '🔥' }, { 'x-student-token': seat.studentToken })).status, 200);
}));

test('the teacher can remove a learner without leaving the lesson', () => withRoom(async ({ post, snapshot }) => {
  const { pin } = (await snapshot()).state;
  const ann = await (await post('join', { pin, name: 'Ann' })).json();
  await post('join', { pin, name: 'Bee' });
  await openRoles(post);
  await post('choiceVote', { activityId: 'roles', option: 'controller' }, { 'x-student-token': ann.studentToken });
  const scored = (await snapshot()).state.chapterScores[1].Ann;

  // Removing happens from wherever the teacher is; the class is not sent back to the lobby.
  assert.equal((await post('removeStudent', { name: 'Ann' })).status, 200);
  const room = (await snapshot()).state;
  assert.deepEqual(room.students.map(({ name }) => name), ['Bee']);
  assert.equal(room.step, ROLES_STEP, 'the lesson stays where it was');
  assert.equal(room.chapterScores[1].Ann, scored, 'their score is kept in case they come back');

  // Their screen can no longer act, and the closed door keeps them out until the teacher says so.
  assert.equal((await post('emoji', { emoji: '🔥' }, { 'x-student-token': ann.studentToken })).status, 401);
  assert.equal((await post('join', { pin, name: 'Ann' })).status, 400);

  await post('setJoinOpen', { open: true });
  const readmitted = await post('join', { pin, name: 'Ann' });
  assert.equal(readmitted.status, 200);
  const back = (await snapshot()).state;
  assert.equal(back.students.length, 2);
  assert.equal(back.chapterScores[1].Ann, scored, 'and it is still theirs when they return');
  assert.equal(back.choiceVotes.roles.Ann, 'controller', 'a removal must not let them answer again');
}));

test('the teacher screen drives the room without signing in', () => withRoom(async ({ post, snapshot }) => {
  assert.equal((await post('changeStep', { step: ROLES_STEP })).status, 200);
  assert.equal((await snapshot()).state.step, ROLES_STEP);
}));

// Copying a build onto the server without restarting it leaves the page and the server
// disagreeing about how many slides a lesson has, which showed up only as a bare 400.
test('every snapshot names the lesson content the server is running', () => withRoom(async ({ post, snapshot }) => {
  assert.equal((await snapshot()).content, CONTENT_SIGNATURE);
  assert.equal((await (await post('changeStep', { step: ROLES_STEP })).json()).content, CONTENT_SIGNATURE);
}));

test('a restart in the middle of a lesson does not end the lesson', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'room-'));
  const persistPath = join(dir, 'room.json');
  const carried = {};

  try {
    await withRoom(async ({ post, snapshot }) => {
      const { pin } = (await snapshot()).state;
      const joined = await (await post('join', { pin, name: 'Ann' })).json();
      Object.assign(carried, { pin, token: joined.studentToken, instance: joined.instance });
      await openRoles(post);
      await post('choiceVote', { activityId: 'roles', option: 'controller' }, { 'x-student-token': joined.studentToken });
      carried.score = (await snapshot()).state.chapterScores[1].Ann;
      assert.ok(carried.score > 0);
    }, { persistPath });

    // The process is gone; everything the room knew has to come back off disk.
    await withRoom(async ({ post, snapshot }) => {
      const back = await snapshot();
      assert.equal(back.state.pin, carried.pin, 'the PIN on the board must still work');
      assert.deepEqual(back.state.students.map(({ name }) => name), ['Ann']);
      assert.equal(back.state.chapterScores[1].Ann, carried.score, 'scores must survive');
      // Same instance id, so the browsers still in the room neither reload nor lose their seat.
      assert.equal(back.instance, carried.instance);

      // The learner's saved token still identifies them, and their answer still stands.
      const rejoin = await post('join', { pin: carried.pin, name: 'Ann' }, { 'x-student-token': carried.token });
      assert.equal(rejoin.status, 200);
      await openRoles(post);
      await post('choiceVote', { activityId: 'roles', option: 'sensor' }, { 'x-student-token': carried.token });
      const after = await snapshot();
      assert.equal(after.state.choiceVotes.roles.Ann, 'controller', 'a restart must not reopen an answered question');
      assert.equal(after.state.chapterScores[1].Ann, carried.score);
    }, { persistPath });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('finishing a lesson files the room away instead of destroying it', () => withRoom(async ({ post, snapshot, rooms }) => {
  const { pin: firstPin } = (await snapshot()).state;
  const ann = await (await post('join', { pin: firstPin, name: 'Ann' })).json();
  await openRoles(post);
  await post('choiceVote', { activityId: 'roles', option: 'controller' }, { 'x-student-token': ann.studentToken });
  const scored = (await snapshot()).state.chapterScores[1].Ann;

  await post('reset');
  const fresh = (await snapshot()).state;
  assert.notEqual(fresh.pin, firstPin);
  assert.deepEqual(fresh.students, [], 'the new room starts empty');

  const filed = await rooms();
  assert.equal(filed.length, 1, 'the class that just finished is still there');
  assert.equal(filed[0].pin, firstPin);
  assert.equal(filed[0].students, 1);

  // Going back picks the room up whole: same PIN, same register, same scores.
  assert.equal((await post('restoreRoom', { roomId: filed[0].id })).status, 200);
  const back = (await snapshot()).state;
  assert.equal(back.pin, firstPin);
  assert.deepEqual(back.students.map(({ name }) => name), ['Ann']);
  assert.equal(back.chapterScores[1].Ann, scored);

  // Ann's device never had to do anything: the token it still holds is valid again.
  assert.equal((await post('emoji', { emoji: '🔥' }, { 'x-student-token': ann.studentToken })).status, 200);
}));

test('the room being put down is kept too, so the teacher can go either way', () => withRoom(async ({ post, snapshot, rooms }) => {
  const first = (await snapshot()).state.pin;
  await post('join', { pin: first, name: 'Ann' });
  await post('reset');

  const second = (await snapshot()).state.pin;
  await post('join', { pin: second, name: 'Bee' });

  const [older] = await rooms();
  await post('restoreRoom', { roomId: older.id });
  assert.equal((await snapshot()).state.pin, first);

  const filedNow = await rooms();
  assert.deepEqual(filedNow.map(room => room.pin), [second], 'the room we just left is waiting');
  await post('restoreRoom', { roomId: filedNow[0].id });
  assert.equal((await snapshot()).state.pin, second, 'and can be picked back up');
}));

test('a room that is gone says so rather than silently doing nothing', () => withRoom(async ({ post }) => {
  const missing = await post('restoreRoom', { roomId: 'ไม่มีอยู่จริง' });
  assert.equal(missing.status, 404);
  assert.match((await missing.json()).error, /ไม่พบห้องเรียนนี้/);
}));

test('an empty room is not worth filing away', () => withRoom(async ({ post, rooms }) => {
  await post('reset');
  assert.deepEqual(await rooms(), []);
}));

async function withSaveFile(run) {
  const dir = mkdtempSync(join(tmpdir(), 'room-'));
  try {
    await run(join(dir, 'room.json'), dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Rewinds what is on disk, so the next boot sees every room as having been left that long ago.
function ageSavedRooms(persistPath, ms) {
  const saved = JSON.parse(readFileSync(persistPath, 'utf8'));
  for (const entry of [saved.current, ...saved.archive]) if (entry) entry.savedAt -= ms;
  writeFileSync(persistPath, JSON.stringify(saved));
}

test('a class from earlier today can still be picked back up', () => withSaveFile(async persistPath => {
  let pin;
  await withRoom(async ({ post, snapshot }) => {
    ({ pin } = (await snapshot()).state);
    await post('join', { pin, name: 'Ann' });
    await post('reset');
  }, { persistPath });
  ageSavedRooms(persistPath, 20 * HOUR);

  await withRoom(async ({ post, snapshot, rooms }) => {
    const [filed] = await rooms();
    assert.equal(filed?.pin, pin);
    assert.equal((await post('restoreRoom', { roomId: filed.id })).status, 200);
    assert.equal((await snapshot()).state.pin, pin);
  }, { persistPath });
}));

test('a lesson left overnight is filed away on restart instead of thrown out', () => withSaveFile(async persistPath => {
  let pin;
  await withRoom(async ({ post, snapshot }) => {
    ({ pin } = (await snapshot()).state);
    await post('join', { pin, name: 'Ann' });
  }, { persistPath });
  ageSavedRooms(persistPath, DAY + HOUR);

  await withRoom(async ({ snapshot, rooms }) => {
    const fresh = (await snapshot()).state;
    assert.notEqual(fresh.pin, pin, 'the next day starts with a new PIN');
    assert.deepEqual(fresh.students, []);
    const [filed] = await rooms();
    assert.equal(filed?.pin, pin, "and yesterday's class is waiting in the list");
    assert.ok(Date.now() - filed.savedAt < HOUR, 'its day of keeping starts when it was put down, not when it was taught');
  }, { persistPath });
}));

test('rooms past the keeping period are gone, and health does not count them', () => withSaveFile(async persistPath => {
  await withRoom(async ({ post, snapshot }) => {
    await post('join', { pin: (await snapshot()).state.pin, name: 'Ann' });
    await post('reset');
  }, { persistPath });
  ageSavedRooms(persistPath, (ROOM_ARCHIVE_DAYS + 1) * DAY);

  await withRoom(async ({ rooms, base }) => {
    assert.deepEqual(await rooms(), []);
    assert.equal((await (await fetch(`${base}/api/room/health`)).json()).archivedRooms, 0);
  }, { persistPath });
}));

test('a save file the server cannot read is set aside, not written over', () => withSaveFile(async (persistPath, dir) => {
  const truncated = '{"version":2,"current":';
  writeFileSync(persistPath, truncated);
  await withRoom(async () => {}, { persistPath });

  const aside = readdirSync(dir).find(name => name.startsWith('room.json.unreadable'));
  assert.ok(aside, 'it may be the only copy of a register, so it is kept for recovery by hand');
  assert.equal(readFileSync(join(dir, aside), 'utf8'), truncated);
}));

// A request that throws used to become an unhandled rejection, and Node ends the process
// for those — one malformed header dropped every learner in the room at once.
test('a malformed request cannot take the room down with it', async () => {
  const api = createRoomApi();
  const server = createServer((req, res) => api.middleware(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  const raw = request => new Promise(resolve => {
    const socket = connect(port, '127.0.0.1');
    let received = '';
    socket.on('error', () => resolve(''));
    socket.on('data', chunk => { received += chunk; });
    socket.on('close', () => resolve(received.split('\r\n')[0]));
    socket.write(request);
    setTimeout(() => socket.destroy(), 300);
  });

  try {
    assert.match(await raw('GET /api/room/info HTTP/1.1\r\nHost: a b c\r\n\r\n'), /200/, 'a broken Host is answered, not fatal');
    assert.match(await raw('GET /api/room/info HTTP/1.0\r\n\r\n'), /200/, 'and so is no Host at all');
    // Still serving afterwards is the part that matters.
    assert.match(await raw('GET /api/room/info HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n'), /200/);
  } finally {
    api.close();
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
});

test('a phone that vanishes mid-broadcast does not cut the others off', () => withRoom(async ({ post, snapshot, base }) => {
  const dropped = [];
  for (let i = 0; i < 5; i++) {
    const socket = connect(new URL(base).port, '127.0.0.1');
    socket.on('error', () => {});
    socket.write('GET /api/room/events HTTP/1.1\r\nHost: x\r\n\r\n');
    dropped.push(socket);
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  for (const socket of dropped) socket.destroy(); // walked out of wi-fi, no goodbye

  for (let i = 0; i < 6; i++) assert.equal((await post('changeStep', { step: i % 3 })).status, 200);
  assert.equal((await snapshot()).state.step, 2, 'the room is still broadcasting');
}));
