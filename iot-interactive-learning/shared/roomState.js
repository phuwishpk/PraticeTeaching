import { lessons } from '../src/content/lessons.js';

export const initialPresentation = (mode = 'lesson') => ({
  mode, slide: 0, demoValue: 50, expanded: false, answerRevealed: false,
});

export function createRoomState() {
  return {
    pin: String(Math.floor(1000 + Math.random() * 9000)), phase: 1, presentation: initialPresentation('activity'),
    students: [], senses: { eyes: false, ears: false, hands: false },
    problemVotes: {}, digitalVotes: {}, analogVotes: {},
    floatingEmojis: [], quizVotes: {}, quizRevealed: false,
    logicVotes: {}, architectureVotes: { esp32: {}, wifi: {}, cloud: {} },
    currentVoteItem: 'esp32', canvasImages: [],
    scores: {}, questionStartTime: Date.now(),
  };
}

function requireValue(condition, message = 'ข้อมูลคำสั่งไม่ถูกต้อง') {
  if (!condition) throw new Error(message);
}
function validName(name) {
  requireValue(typeof name === 'string' && name.trim().length > 0 && name.length <= 20, 'กรุณากรอกชื่อไม่เกิน 20 ตัวอักษร');
  const cleanName = name.trim();
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  requireValue(!dangerous.includes(cleanName.toLowerCase()), 'ชื่อนี้ไม่สามารถใช้งานได้');
  return cleanName;
}

function calculateScore(startTime) {
  if (!startTime) return 500;
  const elapsed = (Date.now() - startTime) / 1000; // วินาที
  // คะแนนเต็ม 1000, ลดลงวินาทีละ 50 คะแนน, ต่ำสุด 500
  const score = Math.max(500, Math.floor(1000 - (elapsed * 50)));
  return score;
}

// The server applies each action to its latest state, so simultaneous votes cannot
// overwrite the teacher's selected slide (or another student's answer).
export function applyRoomAction(state, action) {
  const { type, payload: p = {} } = action;
  switch (type) {
    case 'phase': {
      requireValue(Number.isInteger(p.phase) && !!lessons[p.phase]);
      return { ...state, phase: p.phase, presentation: initialPresentation(p.phase === 1 ? 'activity' : 'lesson'), questionStartTime: Date.now() };
    }
    case 'presentation': {
      if (p.phase !== state.phase) return state;
      const patch = {};
      if ('mode' in p) {
        requireValue(['lesson', 'activity'].includes(p.mode));
        patch.mode = p.mode;
      }
      if ('slide' in p) {
        const lesson = lessons[state.phase];
        const maxSlide = lesson ? lesson.sections.length + 2 : 0; // intro=0, sections, example, recap=last
        requireValue(Number.isInteger(p.slide) && p.slide >= 0 && p.slide <= maxSlide);
        Object.assign(patch, { slide: p.slide, expanded: false, answerRevealed: false });
      }
      // Discard delayed demo updates belonging to a previously selected slide.
      if ('forSlide' in p && p.forSlide !== state.presentation.slide) return state;
      if ('demoValue' in p) {
        requireValue(Number.isFinite(p.demoValue));
        patch.demoValue = Math.max(0, Math.min(100, p.demoValue));
      }
      for (const key of ['expanded', 'answerRevealed']) {
        if (key in p) { requireValue(typeof p[key] === 'boolean'); patch[key] = p[key]; }
      }
      
      const newState = { ...state, presentation: { ...state.presentation, ...patch } };
      if (p.mode === 'activity') newState.questionStartTime = Date.now();
      return newState;
    }
    case 'join': {
      requireValue(p.pin === state.pin, 'รหัส PIN ไม่ถูกต้อง');
      const name = validName(p.name);
      requireValue(!state.students.some(student => student.name === name), 'ชื่อนี้มีผู้ใช้แล้ว กรุณาเพิ่มชื่อหรือเลขที่');
      return { ...state, students: [...state.students, { id: p.id, name }] };
    }
    case 'problemVote': {
      const name = validName(p.name);
      requireValue(['sensor', 'motor', 'wifi', 'usb'].includes(p.option));
      let newScores = { ...state.scores };
      if (p.option === 'sensor' && !state.problemVotes[name]) {
        newScores[name] = (newScores[name] || 0) + calculateScore(state.questionStartTime);
      }
      return { ...state, problemVotes: { ...state.problemVotes, [name]: p.option }, scores: newScores };
    }
    case 'digitalVote': {
      const name = validName(p.name);
      requireValue(['2_states', '10_states', 'infinite', 'none'].includes(p.option));
      let newScores = { ...state.scores };
      if (p.option === '2_states' && !state.digitalVotes[name]) {
        newScores[name] = (newScores[name] || 0) + calculateScore(state.questionStartTime);
      }
      return { ...state, digitalVotes: { ...state.digitalVotes, [name]: p.option }, scores: newScores };
    }
    case 'analogVote': {
      const name = validName(p.name);
      requireValue(['continuous', 'binary', 'faster', 'less_wires'].includes(p.option));
      let newScores = { ...state.scores };
      if (p.option === 'continuous' && !state.analogVotes[name]) {
        newScores[name] = (newScores[name] || 0) + calculateScore(state.questionStartTime);
      }
      return { ...state, analogVotes: { ...state.analogVotes, [name]: p.option }, scores: newScores };
    }
    case 'voteItem':
      requireValue(['esp32', 'wifi', 'cloud'].includes(p.item));
      return { ...state, currentVoteItem: p.item, questionStartTime: Date.now() };
    case 'architectureVote': {
      const name = validName(p.name);
      requireValue(['esp32', 'wifi', 'cloud'].includes(p.item) && ['device', 'network', 'service'].includes(p.layer));
      
      let newScores = { ...state.scores };
      // เช็คว่าตอบถูกไหม (esp32->device, wifi->network, cloud->service)
      const correctMap = { esp32: 'device', wifi: 'network', cloud: 'service' };
      if (p.layer === correctMap[p.item] && !state.architectureVotes[p.item][name]) {
        newScores[name] = (newScores[name] || 0) + calculateScore(state.questionStartTime);
      }
      
      return { ...state, architectureVotes: { ...state.architectureVotes, [p.item]: { ...state.architectureVotes[p.item], [name]: p.layer } }, scores: newScores };
    }

    case 'emoji':
      requireValue(['👍', '💡', '❤️', '🔥', '🎉', '👏'].includes(p.emoji));
      return { ...state, floatingEmojis: [...state.floatingEmojis, { id: p.id, emoji: p.emoji, name: p.name || '', x: p.x }].slice(-30) };
    case 'expireEmoji':
      return { ...state, floatingEmojis: state.floatingEmojis.filter(e => e.id !== p.id) };
    case 'quizVote': {
      const name = validName(p.name);
      requireValue(['ldr', 'dht', 'pir', 'soil'].includes(p.option));
      if (state.quizRevealed) return state;
      
      let newScores = { ...state.scores };
      if (p.option === 'ldr' && !state.quizVotes[name]) {
        newScores[name] = (newScores[name] || 0) + calculateScore(state.questionStartTime);
      }
      
      return { ...state, quizVotes: { ...state.quizVotes, [name]: p.option }, scores: newScores };
    }
    case 'quizReveal':
      requireValue(typeof p.reveal === 'boolean');
      return { ...state, quizRevealed: p.reveal };
    case 'logicVote': {
      const name = validName(p.name);
      requireValue(['dark', 'dry', 'motion', 'hot'].includes(p.option));
      
      let newScores = { ...state.scores };
      if (p.option === 'dry' && !state.logicVotes[name]) {
        newScores[name] = (newScores[name] || 0) + calculateScore(state.questionStartTime);
      }
      
      return { ...state, logicVotes: { ...state.logicVotes, [name]: p.option }, scores: newScores };
    }
    case 'sense':
      requireValue(['eyes', 'ears', 'hands'].includes(p.sense));
      return { ...state, senses: { ...state.senses, [p.sense]: true } };
    case 'reset': return createRoomState();
    default: throw new Error('ไม่พบคำสั่งนี้');
  }
}
