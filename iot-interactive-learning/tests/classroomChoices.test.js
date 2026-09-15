import test from 'node:test';
import assert from 'node:assert/strict';
import { classroomChoiceActivities } from '../src/content/classroomChoiceActivities.js';
import { applyRoomAction, createRoomState } from '../shared/roomState.js';

test('new classroom activities are multiple choice with one valid answer', () => {
  for (const activity of Object.values(classroomChoiceActivities)) {
    assert.ok(activity.options.length >= 3);
    assert.equal(activity.options.filter(({ id }) => id === activity.correctId).length, 1);
  }
});

test('classroom choice scoring accepts one answer and rewards only the correct option', () => {
  for (const [activityId, activity] of Object.entries(classroomChoiceActivities)) {
    for (const option of activity.options) {
      const state = createRoomState();
      const submitted = applyRoomAction(state, {
        type: 'choiceVote',
        payload: { activityId, option: option.id, name: 'Learner' },
      });
      assert.equal(submitted.choiceVotes[activityId].Learner, option.id);
      assert.equal((submitted.chapterScores[1].Learner || 0) > 0, option.id === activity.correctId);
      assert.equal(applyRoomAction(submitted, {
        type: 'choiceVote',
        payload: { activityId, option: activity.correctId, name: 'Learner' },
      }), submitted);
    }
  }
});

