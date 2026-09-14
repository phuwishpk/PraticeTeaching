import test from 'node:test';
import assert from 'node:assert/strict';
import { adcCode, binaryValue } from '../src/content/signalMath.js';

test('ADC keeps nearby analog inputs in one bin and moves at the bin boundary', () => {
  assert.equal(adcCode(12.4, 3), 0);
  assert.equal(adcCode(12.5, 3), 1);
  assert.equal(adcCode(24.9, 3), 1);
  assert.equal(adcCode(25, 3), 2);
});

test('all demonstrated ADC resolutions include zero and saturate at the highest valid code', () => {
  for (const bits of [3, 4, 12]) {
    assert.equal(adcCode(0, bits), 0);
    assert.equal(adcCode(50, bits), 2 ** (bits - 1));
    assert.equal(adcCode(100, bits), 2 ** bits - 1);
    assert.equal(adcCode(101, bits), 2 ** bits - 1);
    assert.equal(adcCode(-1, bits), 0);
  }
});

test('the four-bit graphic represents every number from 0 to 15', () => {
  for (let expected = 0; expected <= 15; expected++) {
    const bits = [8, 4, 2, 1].map(weight => (expected & weight) ? 1 : 0);
    assert.equal(binaryValue(bits), expected);
  }
});
