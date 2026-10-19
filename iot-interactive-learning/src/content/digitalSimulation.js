export const digitalScenarios = {
  switch: { title: 'สวิตช์ → LED', input: 'ปุ่มกด', on: 'กดสวิตช์', off: 'ปล่อยสวิตช์', active: 'กำลังกดปุ่ม', idle: 'ปล่อยปุ่มแล้ว', output: 'LED', resultOn: 'LED ติด', resultOff: 'LED ดับ', rule: 'ถ้าอ่านได้ 1 ให้เปิด LED ถ้าอ่านได้ 0 ให้ปิด LED', note: 'กำหนดให้ปุ่มเป็น active-high และโปรแกรมสั่ง LED ตามค่าที่อ่าน ภาพแสดงหลักการ ไม่ใช่ผังต่อวงจร' },
  motion: { title: 'คนเดินผ่าน → ไฟทางเดิน', input: 'เซนเซอร์ PIR', on: 'ให้คนเดินผ่าน', off: 'ไม่มีการเคลื่อนไหว', active: 'ตรวจพบการเคลื่อนไหว', idle: 'ไม่พบการเคลื่อนไหว', output: 'ไฟทางเดิน', resultOn: 'ไฟทางเดินติด', resultOff: 'ไฟทางเดินดับ', rule: 'ถ้า PIR ส่ง 1 ให้เปิดไฟ ถ้าส่ง 0 ให้ปิดไฟ', note: 'สมมติโมดูล PIR พบแล้วส่ง HIGH แบบจำลองเปลี่ยนทันทีเมื่อกด ของจริงอาจค้างสถานะตามเวลาและการตั้งค่าโมดูล' },
  door: { title: 'เปิดประตู → สัญญาณเตือน', input: 'เซนเซอร์ประตู', on: 'เปิดประตู', off: 'ปิดประตู', active: 'ประตูเปิดอยู่', idle: 'ประตูปิดแล้ว', output: 'สัญญาณเตือน', resultOn: 'กำลังแจ้งเตือน', resultOff: 'หยุดแจ้งเตือน', rule: 'ถ้าประตูเปิดและอ่านได้ 1 ให้แจ้งเตือน ถ้าปิดและอ่านได้ 0 ให้หยุด', note: 'สมมติการต่อวงจรให้เปิดประตู = HIGH ความหมายจริงขึ้นกับวงจร แสดงการเตือนด้วยภาพ ไม่มีเสียง' },
};

export function initialSimulation(scenario = 'switch') {
  return { scenario, input: false, readBit: 0, output: false, phase: 3, running: false, automatic: true, history: [0] };
}
function advance(state) {
  if (state.phase >= 3) return state;
  const phase = state.phase + 1;
  return { ...state, phase, running: phase < 3 && state.running,
    ...(phase === 2 ? { readBit: Number(state.input), history: [...state.history.slice(-7), Number(state.input)] } : {}),
    ...(phase === 3 ? { output: state.input } : {}),
  };
}
export function simulationReducer(state, action) {
  switch (action.type) {
    case 'scenario': return digitalScenarios[action.scenario] ? initialSimulation(action.scenario) : state;
    case 'reset': return initialSimulation(state.scenario);
    case 'toggle': return { ...state, input: !state.input, phase: 1, running: state.automatic };
    case 'replay': return { ...state, phase: 1, running: state.automatic };
    case 'mode': return { ...state, automatic: action.automatic, running: action.automatic && state.phase < 3 };
    case 'pause': return { ...state, running: false };
    case 'play': return { ...state, running: state.phase < 3 };
    case 'step': return advance(state);
    case 'tick': return state.running ? advance(state) : state;
    default: return state;
  }
}
