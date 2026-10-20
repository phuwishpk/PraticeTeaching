import test from 'node:test';
import assert from 'node:assert/strict';
import { digitalScenarios, initialSimulation, simulationReducer as act } from '../src/content/digitalSimulation.js';

test('each example switches output and advances history graph immediately on toggle', () => {
  for (const scenario of Object.keys(digitalScenarios)) {
    let state = initialSimulation(scenario);
    for (const expected of [true, false]) {
      state = act(state, { type: 'toggle' });
      assert.equal(state.input, expected);
      assert.equal(state.output, expected, 'output must turn on when toggling on, and off when toggling off');
      assert.equal(state.readBit, Number(expected));
      assert.equal(state.history.at(-1), Number(expected), 'history must record the new bit');
      assert.equal(state.phase, 3);
    }
    assert.deepEqual(state.history, [0, 1, 0]);
  }
});

test('replay and step controls walk through explanation phases', () => {
  let state = act(initialSimulation(), { type: 'toggle' });
  assert.equal(state.phase, 3);
  assert.equal(state.output, true);
  state = act(state, { type: 'replay' });
  assert.equal(state.phase, 1);
  state = act(state, { type: 'mode', automatic: false });
  state = act(state, { type: 'step' });
  assert.equal(state.phase, 2);
  assert.equal(state.output, true);
  state = act(state, { type: 'step' });
  assert.equal(state.phase, 3);
  assert.equal(state.output, true);
});

test('automatic playback can pause, resume and switch to manual without skipping phases', () => {
  let state = act(initialSimulation(), { type: 'toggle' });
  state = act(state, { type: 'replay' });
  assert.equal(state.phase, 1);
  assert.equal(state.running, true);
  state = act(state, { type: 'pause' });
  assert.equal(act(state, { type: 'tick' }), state);
  state = act(act(state, { type: 'play' }), { type: 'tick' });
  assert.equal(state.phase, 2);
  state = act(state, { type: 'mode', automatic: false });
  assert.equal(act(state, { type: 'tick' }), state);
  state = act(state, { type: 'step' });
  assert.equal(state.phase, 3);
  assert.equal(state.running, false);
});

test('reset and changing examples cancel playback and clear the previous readings', () => {
  let state = act(initialSimulation('motion'), { type: 'toggle' });
  state = act(state, { type: 'replay' });
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
  assert.equal(state.output, false);
  assert.deepEqual(state.history, [0, 1, 0]);
  for (let i = 0; i < 12; i++) {
    state = act(state, { type: 'toggle' });
  }
  assert.deepEqual(state.history, [1, 0, 1, 0, 1, 0, 1, 0]);
});
