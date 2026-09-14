// Ideal ADC with equally sized voltage bins and saturation at the upper endpoint.
export function adcCode(levelPercent, bits) {
  const levels = 2 ** bits;
  return Math.max(0, Math.min(levels - 1, Math.floor(levelPercent / 100 * levels)));
}

export function binaryValue(bits) {
  return bits.reduce((value, bit) => value * 2 + bit, 0);
}
