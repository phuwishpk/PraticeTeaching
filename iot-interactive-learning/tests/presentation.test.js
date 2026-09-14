import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/content/lessons.js';
import { applyRoomAction, createRoomState } from '../shared/roomState.js';

test('every chapter can reach its recap and rejects a slide beyond it', () => {
  let state = createRoomState();
  for (const phase of Object.keys(lessons).map(Number)) {
    state = applyRoomAction(state, { type: 'phase', payload: { phase } });
    const last = lessons[phase].sections.length + 2;
    for (let slide = 0; slide <= last; slide++) {
      state = applyRoomAction(state, { type: 'presentation', payload: { phase, slide } });
      assert.equal(state.presentation.slide, slide);
    }
    assert.throws(() => applyRoomAction(state, { type: 'presentation', payload: { phase, slide: last + 1 } }));
    assert.throws(() => applyRoomAction(state, { type: 'presentation', payload: { phase, slide: -1 } }));
  }
});

test('switching from the expanded output chapter resets the slide and ignores stale navigation', () => {
  let state = applyRoomAction(createRoomState(), { type: 'phase', payload: { phase: 3 } });
  state = applyRoomAction(state, { type: 'presentation', payload: { phase: 3, slide: lessons[3].sections.length + 2 } });
  state = applyRoomAction(state, { type: 'phase', payload: { phase: 4 } });
  assert.equal(state.presentation.slide, 0);
  assert.equal(state.presentation.mode, 'lesson');
  assert.equal(applyRoomAction(state, { type: 'presentation', payload: { phase: 3, slide: 12 } }), state);
});
