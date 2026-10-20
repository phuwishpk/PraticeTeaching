import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ECHO_US_PER_CM, I2C_DEVICES, I2C_EMPTY_ADDRESS, TIMING_ERROR_US, TIMING_MAX_CM, TIMING_MIN_CM,
  addressBits, alarmReducer, busReducer, busResponders, echoMicroseconds, hexAddress,
  initialAlarm, initialBus, initialTiming, initialToggle, sirenOn, timingReading, timingReducer,
  toggleReducer,
} from '../src/content/chapterFourLabs.js';

test('the echo pulse and the reported distance are two views of one number', () => {
  for (const cm of [TIMING_MIN_CM, 10, 60, 137, TIMING_MAX_CM]) {
    const reading = timingReading(initialTiming(cm));
    assert.equal(reading.trueEcho, cm * ECHO_US_PER_CM);
    assert.equal(reading.reported, cm, 'a perfect clock must report the distance it measured');
    assert.equal(reading.errorCm, 0);
  }
  // Twice as far is twice the pulse: what the slide claims is what the model does.
  assert.equal(echoMicroseconds(120), echoMicroseconds(60) * 2);
});

test('a clock that runs late turns microseconds into centimetres of error', () => {
  const sloppy = timingReducer(initialTiming(60), { type: 'sloppyTimer' });
  const reading = timingReading(sloppy);
  assert.equal(reading.measuredEcho, reading.trueEcho + TIMING_ERROR_US);
  assert.ok(reading.reported > 60, 'reporting late must read as further away');
  assert.equal(reading.errorCm, Math.round((TIMING_ERROR_US / ECHO_US_PER_CM) * 10) / 10);
  // Toggling it on restarts the measurement, so the class sees the clock run again.
  assert.equal(sloppy.phase, 1);
});

test('moving the object restarts the measurement and stays inside the sensor range', () => {
  let state = initialTiming(60);
  assert.equal(state.phase, 3);
  state = timingReducer(state, { type: 'distance', cm: 5000 });
  assert.equal(state.cm, TIMING_MAX_CM);
  assert.equal(state.phase, 1);
  state = timingReducer(timingReducer(state, { type: 'advance' }), { type: 'advance' });
  assert.equal(state.phase, 3);
  assert.equal(timingReducer(state, { type: 'advance' }), state, 'the last step is the last step');
  // Asking for the distance it already shows is not a new measurement.
  assert.equal(timingReducer(state, { type: 'distance', cm: TIMING_MAX_CM }), state);
  assert.equal(timingReducer(state, { type: 'distance', cm: -40 }).cm, TIMING_MIN_CM);
});

test('a threshold sensor keeps one bit of the same distance', () => {
  const near = timingReading({ ...initialTiming(20), threshold: 50 });
  const far = timingReading({ ...initialTiming(180), threshold: 50 });
  assert.equal(near.nearBit, 1);
  assert.equal(far.nearBit, 0);
  // Both sit far beyond the threshold, and the bit cannot tell them apart.
  assert.equal(timingReading({ ...initialTiming(60), threshold: 50 }).nearBit,
    timingReading({ ...initialTiming(200), threshold: 50 }).nearBit);
});

test('every device on the bus has its own house number, and one address is empty', () => {
  const addresses = I2C_DEVICES.map(device => device.address);
  assert.equal(new Set(addresses).size, addresses.length, 'a shared bus needs distinct addresses');
  assert.ok(!addresses.includes(I2C_EMPTY_ADDRESS));
  for (const device of I2C_DEVICES) {
    assert.equal(busResponders(device.address).length, 1);
    assert.equal(busResponders(device.address)[0].id, device.id);
    assert.equal(addressBits(device.address).length, 7);
    assert.equal(parseInt(addressBits(device.address).join(''), 2), device.address);
  }
  assert.deepEqual(busResponders(I2C_EMPTY_ADDRESS), [], 'nobody may answer an empty address');
  assert.equal(hexAddress(0x23), '0x23');
});

test('duplicating an address makes two devices answer the same call', () => {
  const clashed = busReducer(initialBus(), { type: 'duplicate' });
  assert.equal(clashed.duplicate, true);
  const responders = busResponders(I2C_DEVICES[0].address, true);
  assert.equal(responders.length, 2, 'the conflict the switch demonstrates must be visible');
  // And the address it was moved off no longer answers at all.
  assert.deepEqual(busResponders(I2C_DEVICES[2].address, true), []);
});

test('calling a device runs the transaction, and the frame tour wraps around', () => {
  let state = busReducer(initialBus(), { type: 'call', address: I2C_DEVICES[1].address });
  assert.equal(state.phase, 1);
  state = busReducer(busReducer(state, { type: 'advance' }), { type: 'advance' });
  assert.equal(state.phase, 3);
  assert.equal(busReducer(state, { type: 'advance' }), state);
  let tour = state;
  for (let i = 0; i < 6; i++) tour = busReducer(tour, { type: 'frameNext' });
  assert.equal(tour.frameStep, 0, 'six beats return to the start of the frame');
  assert.equal(busReducer(tour, { type: 'frameStep', index: 99 }).frameStep, 5);
  assert.equal(busReducer(tour, { type: 'frameStep', index: -3 }).frameStep, 0);
});

test('the siren keeps ringing after the pin goes quiet, until someone resets it', () => {
  let state = initialAlarm();
  assert.equal(sirenOn(state), false);
  state = alarmReducer(state, { type: 'pir' });
  assert.equal(sirenOn(state), true);
  state = alarmReducer(state, { type: 'pir' });
  assert.equal(state.pir, false);
  assert.equal(sirenOn(state), true, 'this is the whole point of holding state');
  state = alarmReducer(state, { type: 'reset' });
  assert.equal(sirenOn(state), false);
  assert.ok(state.log.length > 0, 'the class reads what happened from the log');
});

test('resetting while the PIR pin is HIGH latches straight back', () => {
  let state = alarmReducer(initialAlarm(), { type: 'pir' });
  state = alarmReducer(state, { type: 'reset' });
  assert.equal(state.latched, true);
  assert.equal(sirenOn(state), true);
});

test('without state the siren only ever repeats the pin', () => {
  let state = alarmReducer(initialAlarm(), { type: 'remembers' });
  assert.equal(state.remembers, false);
  state = alarmReducer(state, { type: 'pir' });
  assert.equal(sirenOn(state), true);
  state = alarmReducer(state, { type: 'pir' });
  assert.equal(sirenOn(state), false, 'no memory means the alarm forgets the intruder');
  // There is no variable to clear, and saying so is more honest than a silent no-op.
  const afterReset = alarmReducer(state, { type: 'reset' });
  assert.equal(sirenOn(afterReset), false);
  assert.notEqual(afterReset.log.at(-1), state.log.at(-1));
});

test('one button toggles once per press, not once per read', () => {
  let state = initialToggle();
  state = toggleReducer(state, { type: 'signal' });      // press
  assert.equal(state.latched, true);
  assert.equal(state.presses, 1);
  state = toggleReducer(state, { type: 'signal' });      // release
  assert.equal(state.latched, true, 'releasing must not flip the light again');
  assert.equal(state.presses, 1);
  state = toggleReducer(state, { type: 'signal' });      // press again
  assert.equal(state.latched, false);
  assert.equal(state.presses, 2);
  assert.deepEqual(state.history, [0, 1, 0, 1]);
  assert.deepEqual(toggleReducer(state, { type: 'reset' }), initialToggle());
});

test('the button trace keeps a bounded window of presses', () => {
  let state = initialToggle();
  for (let i = 0; i < 20; i++) state = toggleReducer(state, { type: 'signal' });
  assert.equal(state.history.length, 10);
  assert.equal(state.presses, 10, 'twenty edges are ten complete presses');
});

test('button and lamp histories stay aligned and preserve the lamp on release', () => {
  let state = initialToggle();
  state = toggleReducer(state, { type: 'signal' });
  state = toggleReducer(state, { type: 'signal' });
  assert.deepEqual(state.history, [0, 1, 0]);
  assert.deepEqual(state.outputHistory, [0, 1, 1]);
  state = toggleReducer(state, { type: 'signal' });
  assert.deepEqual(state.outputHistory, [0, 1, 1, 0]);
  for (let i = 0; i < 20; i++) state = toggleReducer(state, { type: 'signal' });
  assert.equal(state.history.length, 10);
  assert.equal(state.outputHistory.length, 10);
  assert.equal(state.outputHistory.at(-1), Number(state.latched));
  assert.deepEqual(toggleReducer(state, { type: 'reset' }).outputHistory, [0]);
});
