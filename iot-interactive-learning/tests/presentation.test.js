import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/content/lessons.js';
import { CHAPTER_FLOW, applyRoomAction, createRoomState } from '../shared/roomState.js';

test('each chapter step accepts valid navigation and rejects out-of-range slides', () => {
  let state = createRoomState();
  for (const [chapterKey, steps] of Object.entries(CHAPTER_FLOW)) {
    const chapter = Number(chapterKey);
    state = applyRoomAction(state, { type: 'changeChapter', payload: { chapter } });
    for (let step = 0; step < steps.length; step++) {
      state = applyRoomAction(state, { type: 'changeStep', payload: { step } });
      const last = lessons[steps[step].lessonId].sections.length + 2;
      for (let slide = 0; slide <= last; slide++) {
        state = applyRoomAction(state, { type: 'presentation', payload: { chapter, step, slide } });
        assert.equal(state.presentation.slide, slide);
      }
      for (const slide of [-1, last + 1]) {
        assert.throws(() => applyRoomAction(state, { type: 'presentation', payload: { chapter, step, slide } }));
      }
    }
  }
});

test('changing steps resets navigation and ignores delayed actions from the previous step or chapter', () => {
  let state = applyRoomAction(createRoomState(), { type: 'changeStep', payload: { step: 3 } });
  state = applyRoomAction(state, { type: 'presentation', payload: { chapter: 1, step: 3, slide: 4 } });
  state = applyRoomAction(state, { type: 'changeStep', payload: { step: 4 } });
  assert.equal(state.presentation.slide, 0);
  assert.equal(state.presentation.mode, 'lesson');
  assert.equal(applyRoomAction(state, { type: 'presentation', payload: { chapter: 1, step: 3, slide: 2 } }), state);
  state = applyRoomAction(state, { type: 'changeChapter', payload: { chapter: 2 } });
  assert.equal(state.presentation.slide, 0);
  assert.equal(state.presentation.mode, 'activity');
  assert.equal(applyRoomAction(state, { type: 'presentation', payload: { chapter: 1, step: 4, slide: 2 } }), state);
});
