import test from 'node:test';
import assert from 'node:assert/strict';
import { classroomChoiceActivities } from '../src/content/classroomChoiceActivities.js';
import { act, openActivity } from './roomHarness.js';

test('new classroom activities are multiple choice with one valid answer', () => {
  for (const activity of Object.values(classroomChoiceActivities)) {
    assert.ok(activity.options.length >= 3);
    assert.equal(activity.options.filter(({ id }) => id === activity.correctId).length, 1);
  }
});

test('classroom choice scoring accepts one answer and rewards only the correct option', () => {
  for (const [activityId, activity] of Object.entries(classroomChoiceActivities)) {
    for (const option of activity.options) {
      const state = openActivity(activityId);
      const submitted = act(state, 'choiceVote', { activityId, option: option.id, name: 'Learner' });
      assert.equal(submitted.choiceVotes[activityId].Learner, option.id);
      assert.equal((submitted.chapterScores[state.chapter].Learner || 0) > 0, option.id === activity.correctId);
      assert.equal(act(submitted, 'choiceVote', { activityId, option: activity.correctId, name: 'Learner' }), submitted);
    }
  }
});

