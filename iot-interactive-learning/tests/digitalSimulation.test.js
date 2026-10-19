import test from 'node:test';
import assert from 'node:assert/strict';
import { digitalScenarios, initialSimulation, simulationReducer as act } from '../src/content/digitalSimulation.js';

test('each example reads the input before changing its output, in both directions', () => {
  for (const scenario of Object.keys(digitalScenarios)) {
    let state = initialSimulation(scenario);
    for (const expected of [true, false]) {
      const oldOutput = state.output;
      state = act(state, { type: 'toggle' });
      assert.equal(state.input, expected);
      assert.equal(state.output, oldOutput);
      state = act(state, { type: 'tick' });
      assert.equal(state.readBit, Number(expected));
      assert.equal(state.output, oldOutput, 'reading alone must not skip the output explanation');
      state = act(state, { type: 'tick' });
      assert.equal(state.output, expected);
      assert.equal(state.running, false);
    }
    assert.deepEqual(state.history, [0, 1, 0]);
  }
});

test('paused and manual explanations cannot advance from delayed playback ticks', () => {
  let state = act(initialSimulation(), { type: 'toggle' });
  state = act(state, { type: 'pause' });
  assert.equal(act(state, { type: 'tick' }), state);
  state = act(state, { type: 'mode', automatic: false });
  state = act(state, { type: 'step' });
  assert.equal(state.phase, 2);
  assert.equal(state.output, false);
  assert.equal(act(state, { type: 'tick' }), state);
  state = act(state, { type: 'step' });
  assert.equal(state.output, true);
  assert.equal(act(state, { type: 'step' }), state);
});

test('reset and changing examples cancel playback and clear the previous readings', () => {
  let state = act(initialSimulation('motion'), { type: 'toggle' });
  state = act(state, { type: 'tick' });
  const reset = act(state, { type: 'reset' });
  assert.deepEqual(reset, initialSimulation('motion'));
  assert.equal(act(reset, { type: 'tick' }), reset);
  const switched = act(state, { type: 'scenario', scenario: 'door' });
  assert.deepEqual(switched, initialSimulation('door'));
  assert.equal(act(switched, { type: 'tick' }), switched);
});

test('rapid input changes process the latest event and history retains eight actual readings', () => {
  let state = initialSimulation();
  state = act(state, { type: 'toggle' });
  state = act(state, { type: 'toggle' });
  state = act(act(state, { type: 'tick' }), { type: 'tick' });
  assert.equal(state.output, false);
  assert.deepEqual(state.history, [0, 0]);
  for (let i = 0; i < 12; i++) {
    state = act(state, { type: 'toggle' });
    state = act(act(state, { type: 'tick' }), { type: 'tick' });
  }
  assert.deepEqual(state.history, [1, 0, 1, 0, 1, 0, 1, 0]);
});
