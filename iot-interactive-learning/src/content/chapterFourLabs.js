// The arithmetic and the state transitions behind the chapter four laboratories, kept out of
// the components so the classroom behaviour can be tested in node, and so the numbers the
// slides quote and the numbers the readouts show are the same numbers.

// ─── Lesson 15 · Ultrasonic timing ───────────────────────────────────────────────
// Sound covers one centimetre and back in about 58 µs, which is where the datasheet's
// "distance = pulse ÷ 58" comes from. One constant, so the graph and the readout agree.
export const ECHO_US_PER_CM = 58;
export const TIMING_MIN_CM = 5;
export const TIMING_MAX_CM = 200;
export const TIMING_PRESETS = [10, 30, 60, 120, 200];
// A clock that reports half a millisecond late — small in human terms, 8.6 cm in answer terms.
export const TIMING_ERROR_US = 500;

export const echoMicroseconds = cm => Math.round(cm * ECHO_US_PER_CM);
export const distanceFromEcho = us => Math.round((us / ECHO_US_PER_CM) * 10) / 10;
export const clampDistance = cm =>
  Math.min(TIMING_MAX_CM, Math.max(TIMING_MIN_CM, Math.round(Number(cm) || TIMING_MIN_CM)));

export const TIMING_STEPS = [
  { id: 'trigger', title: 'บอร์ดสั่งยิงคลื่น', detail: 'ส่งพัลส์สั้นเข้าขา Trigger แล้วเริ่มรอ' },
  { id: 'echo', title: 'ขา Echo ขึ้นเป็น HIGH', detail: 'บอร์ดเริ่มจับเวลาตั้งแต่ขอบขาขึ้น' },
  { id: 'calc', title: 'Echo กลับเป็น LOW แล้วคำนวณ', detail: 'ความกว้างของพัลส์ ÷ 58 = ระยะทางเป็นเซนติเมตร' },
];

export function initialTiming(cm = 60) {
  return { cm, phase: 3, sloppyTimer: false, threshold: 50 };
}

export function timingReducer(state, action) {
  switch (action.type) {
    case 'distance': {
      const cm = clampDistance(action.cm);
      // Moving the object starts a fresh measurement; standing still is not news.
      return cm === state.cm ? state : { ...state, cm, phase: 1 };
    }
    case 'measure': return { ...state, phase: 1 };
    case 'advance': return state.phase >= 3 ? state : { ...state, phase: state.phase + 1 };
    case 'sloppyTimer': return { ...state, sloppyTimer: !state.sloppyTimer, phase: 1 };
    case 'threshold': return { ...state, threshold: clampDistance(action.cm) };
    case 'reset': return initialTiming(state.cm);
    default: return state;
  }
}

// What the board believes it measured, which is only ever as good as its clock.
export function timingReading(state) {
  const trueEcho = echoMicroseconds(state.cm);
  const measuredEcho = trueEcho + (state.sloppyTimer ? TIMING_ERROR_US : 0);
  const reported = distanceFromEcho(measuredEcho);
  return {
    trueEcho, measuredEcho, reported,
    errorCm: Math.round((reported - state.cm) * 10) / 10,
    // The same object through a threshold sensor: one bit, and the distance is gone.
    nearBit: state.cm <= state.threshold ? 1 : 0,
  };
}

// ─── Lesson 16 · I2C, where every device has a house number ──────────────────────
export const I2C_DEVICES = [
  { id: 'light', address: 0x23, short: 'เซนเซอร์แสง', model: 'BH1750', job: 'ส่งค่าความสว่างให้บอร์ด',
    answer: '532 lux', bytes: '0x02 0x14' },
  { id: 'screen', address: 0x3c, short: 'จอแสดงผล', model: 'OLED', job: 'รับข้อความไปแสดงบนจอ',
    answer: 'ขึ้นข้อความ "27.4 C" บนจอ', bytes: '0x00 0x7F' },
  { id: 'climate', address: 0x44, short: 'อุณหภูมิ/ความชื้น', model: 'SHT31', job: 'ส่งอุณหภูมิและความชื้น',
    answer: '27.4 °C · 58 %RH', bytes: '0x65 0x8C' },
];
// The full name is only ever the two parts together, so nothing has to re-join them.
export const deviceName = device => `${device.short} ${device.model}`;
// An address with nothing behind it: the call goes out and the bus stays silent.
export const I2C_EMPTY_ADDRESS = 0x50;
export const DUPLICATE_DEVICE_ID = 'climate';

export const hexAddress = address => `0x${address.toString(16).toUpperCase().padStart(2, '0')}`;
export const addressBits = address => address.toString(2).padStart(7, '0').split('').map(Number);

// The conflict switch rewires one sensor onto its neighbour's address, which is the mistake
// a class makes with two identical modules on one bus.
export const effectiveAddress = (device, duplicate) =>
  duplicate && device.id === DUPLICATE_DEVICE_ID ? I2C_DEVICES[0].address : device.address;

export function busResponders(called, duplicate = false) {
  return I2C_DEVICES.filter(device => effectiveAddress(device, duplicate) === called);
}

export const I2C_FRAME_STEPS = [
  { id: 'start', label: 'START', detail: 'บอร์ดดึงสาย SDA ลงขณะที่ SCL ยังสูง เป็นสัญญาณเริ่มสนทนา' },
  { id: 'address', label: 'ที่อยู่ 7 บิต', detail: 'ส่งบ้านเลขที่ของอุปกรณ์ทีละบิตตามจังหวะ SCL' },
  { id: 'rw', label: 'บิตอ่าน/เขียน', detail: '1 = ขออ่านข้อมูล · 0 = จะเขียนข้อมูลไปให้' },
  { id: 'ack', label: 'ACK', detail: 'อุปกรณ์ที่ตรงที่อยู่ดึงสายลงหนึ่งจังหวะ เพื่อบอกว่า "ผมอยู่นี่"' },
  { id: 'data', label: 'ข้อมูล 8 บิต', detail: 'ค่าจริงเดินทางเป็นบิต แล้วบอร์ดจึงถอดเป็นตัวเลข' },
  { id: 'stop', label: 'STOP', detail: 'ปล่อย SDA ขึ้นขณะ SCL สูง เป็นการจบสนทนา' },
];

export function initialBus(called = I2C_DEVICES[0].address) {
  return { called, phase: 3, duplicate: false, frameStep: 0 };
}

export function busReducer(state, action) {
  switch (action.type) {
    case 'call': return { ...state, called: action.address, phase: 1, frameStep: 0 };
    case 'advance': return state.phase >= 3 ? state : { ...state, phase: state.phase + 1 };
    case 'duplicate': return { ...state, duplicate: !state.duplicate, phase: 1, frameStep: 0 };
    case 'frameStep': {
      const frameStep = Math.min(I2C_FRAME_STEPS.length - 1, Math.max(0, action.index));
      return { ...state, frameStep };
    }
    case 'frameNext':
      return { ...state, frameStep: (state.frameStep + 1) % I2C_FRAME_STEPS.length };
    case 'reset': return initialBus(state.called);
    default: return state;
  }
}

// ─── Lesson 17 · State: the program remembers what the pin has forgotten ─────────
// The siren latches on motion and only a reset clears it — and a reset while someone is
// still in the room latches straight back, which is the honest behaviour of the real thing.
export function initialAlarm() {
  return { pir: false, latched: false, remembers: true, log: [] };
}

const logged = (state, entry) => ({ ...state, log: [...state.log.slice(-5), entry] });

export function alarmReducer(state, action) {
  switch (action.type) {
    case 'pir': {
      const pir = !state.pir;
      const latched = state.latched || pir;
      return logged({ ...state, pir, latched },
        pir ? 'PIR = 1 · ตรวจพบการเคลื่อนไหว' : 'PIR = 0 · ไม่พบการเคลื่อนไหวแล้ว');
    }
    case 'reset':
      if (!state.remembers) return logged(state, 'กด Reset · โปรแกรมนี้ไม่มีสถานะให้ล้าง');
      return logged({ ...state, latched: state.pir },
        state.pir ? 'กด Reset · ยังมีคนอยู่ ไซเรนจึงติดใหม่ทันที' : 'กด Reset · isAlarm = 0 ไซเรนหยุด');
    case 'remembers':
      return { ...initialAlarm(), remembers: !state.remembers, pir: state.pir, latched: !state.remembers && state.pir };
    case 'reset-all': return { ...initialAlarm(), remembers: state.remembers };
    default: return state;
  }
}

// What the siren actually does under each program, from the same pin.
export const sirenOn = state => (state.remembers ? state.latched : state.pir);

// One button, two programs: a latch that flips on the rising edge, and a lamp that merely
// follows the pin. Pressing and releasing is what separates them.
export function initialToggle() {
  return { signal: false, latched: false, presses: 0, history: [0] };
}

export function toggleReducer(state, action) {
  switch (action.type) {
    case 'signal': {
      const signal = !state.signal;
      const rising = signal && !state.signal;
      return {
        ...state, signal,
        latched: rising ? !state.latched : state.latched,
        presses: rising ? state.presses + 1 : state.presses,
        history: [...state.history.slice(-9), Number(signal)],
      };
    }
    case 'reset': return initialToggle();
    default: return state;
  }
}

export const TOGGLE_STATES = [
  { id: 'off', label: 'ไฟปิด', variable: 'isOn = 0' },
  { id: 'on', label: 'ไฟเปิด', variable: 'isOn = 1' },
];
