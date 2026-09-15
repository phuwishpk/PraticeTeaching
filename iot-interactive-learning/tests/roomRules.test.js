import test from 'node:test';
import assert from 'node:assert/strict';
import { STUDENT_ACTIONS, answerProgress, createRoomState, rankStudents } from '../shared/roomState.js';
import { act, age, joinAll, openActivity } from './roomHarness.js';
import { problemActivity } from '../src/content/problemActivity.js';
import { classroomChoiceActivities } from '../src/content/classroomChoiceActivities.js';

const ROLES = { activityId: 'roles', option: 'controller' };

test('the podium separates equal scores by how fast they were earned, not by who joined first', () => {
  // Both answers land past the ten second floor, so both are worth the same points.
  let state = openActivity('roles', ['Bee', 'Ann']);
  state = act(age(state, 12000), 'choiceVote', { ...ROLES, name: 'Ann' });
  state = act(age(state, 8000), 'choiceVote', { ...ROLES, name: 'Bee' });

  const [first, second] = rankStudents(state);
  assert.equal(first.score, second.score);
  assert.ok(first.totalTimeMs < second.totalTimeMs);
  assert.equal(first.name, 'Ann');
  // The running total the learners' own screens read must agree with the ranking.
  assert.equal(first.score, state.chapterScores[state.chapter].Ann);
});

test('a name the room does not know cannot answer or score', () => {
  const state = openActivity('roles', ['Ann']);
  assert.throws(() => act(state, 'choiceVote', { ...ROLES, name: 'ผู้มาเยือน' }), /ยังไม่ได้เข้าห้องเรียน/);
  assert.deepEqual(state.chapterScores[state.chapter], {});
});

test('an activity that sets its own pace is judged on that clock, not a flat thirty seconds', () => {
  const problem = openActivity('problem', ['Ann']);
  assert.equal(problem.questionDurationMs, problemActivity.durationSeconds * 1000);
  const answer = { name: 'Ann', option: problemActivity.correctId };
  // Forty five seconds is well inside this activity's own minute, and a flat limit would have refused it.
  assert.ok(act(age(problem, 45000), 'problemVote', answer).chapterScores[1].Ann > 0);
  assert.throws(() => act(age(problem, 70000), 'problemVote', answer), /หมดเวลา/);

  assert.equal(openActivity('roles', ['Ann']).questionDurationMs, classroomChoiceActivities.roles.durationSeconds * 1000);
});

test('an answer that arrives after the countdown is refused', () => {
  const expired = age(openActivity('roles', ['Ann']), 40000);
  assert.throws(() => act(expired, 'choiceVote', { ...ROLES, name: 'Ann' }), /หมดเวลา/);
});

test('an answer is final once submitted, in every activity', () => {
  const rounds = [
    ['digital', 'digitalVote', { option: 'infinite' }, { option: '2_states' }],
    ['analog', 'analogVote', { option: 'binary' }, { option: 'continuous' }],
    ['logic', 'logicVote', { option: 'dark' }, { option: 'dry' }],
    ['sensors', 'catalogVote', { option: 'pir' }, { option: 'ldr' }],
    ['architecture', 'architectureVote', { item: 'esp32', layer: 'service' }, { item: 'esp32', layer: 'device' }],
  ];
  for (const [activityId, type, wrong, right] of rounds) {
    const submitted = act(openActivity(activityId, ['Ann']), type, { ...wrong, name: 'Ann' });
    assert.equal(act(submitted, type, { ...right, name: 'Ann' }), submitted, `${activityId} accepted a second answer`);
    assert.equal(submitted.chapterScores[submitted.chapter].Ann, 0, `${activityId} scored a wrong answer`);
  }
});

test('reopening the activity tab keeps the countdown that was already running', () => {
  let state = age(openActivity('roles', ['Ann']), 25000);
  const { questionStartTime, chapter, step } = state;
  state = act(state, 'presentation', { chapter, step, mode: 'lesson' });
  state = act(state, 'presentation', { chapter, step, mode: 'activity' });
  assert.equal(state.questionStartTime, questionStartTime);
  assert.throws(() => act(age(state, 10000), 'choiceVote', { ...ROLES, name: 'Ann' }), /หมดเวลา/);
});

test('leaving the lobby closes the door, but a learner coming back keeps their seat', () => {
  let state = joinAll(createRoomState(), ['Ann']);
  assert.equal(state.joinOpen, true);

  state = act(state, 'changeStep', { step: 1 });
  assert.equal(state.joinOpen, false);
  assert.throws(() => act(state, 'join', { pin: state.pin, name: 'Late' }), /ปิดรับ/);
  assert.equal(act(state, 'join', { pin: state.pin, name: 'Ann' }), state);

  state = act(act(state, 'setJoinOpen', { open: true }), 'join', { pin: state.pin, name: 'Late', id: 'late' });
  assert.deepEqual(state.students.map(({ name }) => name), ['Ann', 'Late']);
});

test('a learner arriving mid-question does not pull the class back out of the answer', () => {
  let state = openActivity('roles', ['Ann']);
  state = act(state, 'choiceVote', { ...ROLES, name: 'Ann' });
  assert.equal(answerProgress(state, state.choiceVotes.roles).allAnswered, true);

  state = act(act(state, 'setJoinOpen', { open: true }), 'join', { pin: state.pin, name: 'Late', id: 'late' });
  assert.equal(answerProgress(state, state.choiceVotes.roles).allAnswered, true);
});

test('every action a learner can send is attributed by token', () => {
  // Anything missing here would be trusted to name its own sender.
  assert.deepEqual([...STUDENT_ACTIONS].sort(), [
    'analogVote', 'architectureVote', 'catalogVote', 'choiceVote', 'digitalVote',
    'emoji', 'logicVote', 'problemVote', 'quizVote', 'sense',
  ]);
});

test('one learner spelling their name differently is still one seat', () => {
  const state = joinAll(createRoomState(), ['Ann Lee']);
  for (const variant of ['ann lee', 'ANN LEE', ' Ann Lee ', 'Ann  Lee']) {
    assert.equal(act(state, 'join', { pin: state.pin, name: variant }), state, `${variant} opened a second seat`);
  }
  // A different name is still a different name — only case and spacing are forgiven.
  assert.equal(act(state, 'join', { pin: state.pin, name: 'Anna Lee', id: 'anna' }).students.length, 2);
  const answered = act(openActivity('roles', ['Ann Lee']), 'choiceVote', { ...ROLES, name: 'ann  lee' });
  assert.equal(answered.choiceVotes.roles['Ann Lee'], ROLES.option);
});

test('the teacher can hand a name back to a learner who lost their device', () => {
  let state = act(joinAll(createRoomState(), ['Ann']), 'changeStep', { step: 1 });
  state = act(state, 'removeStudent', { name: 'ANN' });
  assert.deepEqual(state.students, []);
  state = act(act(state, 'setJoinOpen', { open: true }), 'join', { pin: state.pin, name: 'Ann', id: 'again' });
  assert.deepEqual(state.students.map(({ name }) => name), ['Ann']);
});
