import test from 'node:test';
import assert from 'node:assert/strict';
import { problemActivity } from '../src/content/problemActivity.js';
import { act, openActivity } from './roomHarness.js';

test('problem scoring awards points only for the plan that measures light', () => {
  for (const option of problemActivity.options) {
    const next = act(openActivity('problem'), 'problemVote', { name: 'Learner', option: option.id });
    assert.equal(next.problemVotes.Learner, option.id);
    assert.equal((next.chapterScores[1].Learner || 0) > 0, option.id === problemActivity.correctId);
  }
});

test('duplicate or changed answers cannot replace a submitted plan or earn points twice', () => {
  const submitted = act(openActivity('problem'), 'problemVote', { name: 'Learner', option: problemActivity.correctId });
  assert.equal(act(submitted, 'problemVote', { name: 'Learner', option: problemActivity.correctId }), submitted);
  assert.equal(act(submitted, 'problemVote', { name: 'Learner', option: 'motion_plan' }), submitted);
});

test('the retired generic Sensor answer is rejected', () => {
  assert.throws(() => act(openActivity('problem'), 'problemVote', { name: 'Learner', option: 'sensor' }));
});
