import { lessons } from '../src/content/lessons.js';

export const initialPresentation = (mode = 'lesson') => ({
  mode, slide: 0, demoValue: 50, expanded: false, answerRevealed: false,
});

export function createRoomState() {
  return {
    pin: '8492', phase: 1, presentation: initialPresentation('activity'),
    students: [], senses: { eyes: false, ears: false, hands: false },
    digitalValue: 0, analogValue: 0, digitalPresses: [], analogValues: {},
    wordSubmissions: [], floatingEmojis: [], quizVotes: {}, quizRevealed: false,
    logicVotes: {}, architectureVotes: { esp32: {}, wifi: {}, cloud: {} },
    currentVoteItem: 'esp32', canvasImages: [],
  };
}

function requireValue(condition, message = 'ข้อมูลคำสั่งไม่ถูกต้อง') {
  if (!condition) throw new Error(message);
}
function validName(name) {
  requireValue(typeof name === 'string' && name.trim().length > 0 && name.length <= 20, 'กรุณากรอกชื่อไม่เกิน 20 ตัวอักษร');
  return name.trim();
}

// The server applies each action to its latest state, so simultaneous votes cannot
// overwrite the teacher's selected slide (or another student's answer).
export function applyRoomAction(state, action) {
  const { type, payload: p = {} } = action;
  switch (type) {
    case 'phase': {
      requireValue(Number.isInteger(p.phase) && !!lessons[p.phase]);
      return { ...state, phase: p.phase, presentation: initialPresentation(p.phase === 1 ? 'activity' : 'lesson'), digitalPresses: [], digitalValue: 0 };
    }
    case 'presentation': {
      if (p.phase !== state.phase) return state;
      const patch = {};
      if ('mode' in p) {
        requireValue(['lesson', 'activity'].includes(p.mode));
        patch.mode = p.mode;
      }
      if ('slide' in p) {
        requireValue(Number.isInteger(p.slide) && p.slide >= 0 && p.slide < lessons[state.phase].sections.length);
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
      return { ...state, presentation: { ...state.presentation, ...patch }, ...(p.mode ? { digitalPresses: [], digitalValue: 0 } : {}) };
    }
    case 'join': {
      requireValue(p.pin === state.pin, 'รหัส PIN ไม่ถูกต้อง');
      const name = validName(p.name);
      requireValue(!state.students.some(student => student.name === name), 'ชื่อนี้มีผู้ใช้แล้ว กรุณาเพิ่มชื่อหรือเลขที่');
      return { ...state, students: [...state.students, { id: p.id, name }] };
    }
    case 'digital': {
      const name = validName(p.name);
      if (state.phase !== 4 || state.presentation.mode !== 'activity') return state;
      const presses = state.digitalPresses.filter(n => n !== name);
      if (p.value) presses.push(name);
      return { ...state, digitalPresses: presses, digitalValue: presses.length > 0 ? 1 : 0 };
    }
    case 'analog': {
      const name = validName(p.name);
      requireValue(Number.isFinite(p.value) && p.value >= 0 && p.value <= 4095);
      return { ...state, analogValues: { ...state.analogValues, [name]: Math.round(p.value) } };
    }
    case 'voteItem':
      requireValue(['esp32', 'wifi', 'cloud'].includes(p.item));
      return { ...state, currentVoteItem: p.item };
    case 'architectureVote': {
      const name = validName(p.name);
      requireValue(['esp32', 'wifi', 'cloud'].includes(p.item) && ['device', 'network', 'service'].includes(p.layer));
      return { ...state, architectureVotes: { ...state.architectureVotes, [p.item]: { ...state.architectureVotes[p.item], [name]: p.layer } } };
    }
    case 'word': {
      const name = validName(p.name);
      requireValue(typeof p.word === 'string' && p.word.trim().length > 0 && p.word.length <= 30);
      return { ...state, wordSubmissions: [...state.wordSubmissions.filter(w => w.name !== name), { word: p.word.trim(), name, id: p.id }] };
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
      return { ...state, quizVotes: { ...state.quizVotes, [name]: p.option } };
    }
    case 'quizReveal':
      requireValue(typeof p.reveal === 'boolean');
      return { ...state, quizRevealed: p.reveal };
    case 'logicVote': {
      const name = validName(p.name);
      requireValue(['dark', 'dry', 'motion', 'hot'].includes(p.option));
      return { ...state, logicVotes: { ...state.logicVotes, [name]: p.option } };
    }
    case 'sense':
      requireValue(['eyes', 'ears', 'hands'].includes(p.sense));
      return { ...state, senses: { ...state.senses, [p.sense]: true } };
    case 'reset': return createRoomState();
    default: throw new Error('ไม่พบคำสั่งนี้');
  }
}
