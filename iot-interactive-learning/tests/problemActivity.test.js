import test from 'node:test';
import assert from 'node:assert/strict';
import { problemActivity } from '../src/content/problemActivity.js';
import { createRoomState, applyRoomAction } from '../shared/roomState.js';

test('problem scoring awards points only for the plan that measures light', () => {
  for (const option of problemActivity.options) {
    const state = { ...createRoomState(), chapter: 1, step: 2 };
    const next = applyRoomAction(state, { type: 'problemVote', payload: { name: 'Learner', option: option.id } });
    assert.equal(next.problemVotes.Learner, option.id);
    assert.equal((next.chapterScores[1].Learner || 0) > 0, option.id === problemActivity.correctId);
  }
});

test('duplicate or changed answers cannot replace a submitted plan or earn points twice', () => {
  const action = { type: 'problemVote', payload: { name: 'Learner', option: problemActivity.correctId } };
  const submitted = applyRoomAction(createRoomState(), action);
  assert.equal(applyRoomAction(submitted, action), submitted);
  assert.equal(applyRoomAction(submitted, { ...action, payload: { name: 'Learner', option: 'motion_plan' } }), submitted);
});

test('the retired generic Sensor answer is rejected', () => {
  assert.throws(() => applyRoomAction(createRoomState(), { type: 'problemVote', payload: { name: 'Learner', option: 'sensor' } }));
});
