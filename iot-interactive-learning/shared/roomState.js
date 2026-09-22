import { problemActivity, isProblemOption } from '../src/content/problemActivity.js';
import { isSensorCatalogOption, sensorCatalogQuestions } from '../src/content/sensorCatalogActivity.js';
import { classroomChoiceActivities, isClassroomChoice } from '../src/content/classroomChoiceActivities.js';
import { lessons } from '../src/content/lessons.js';

export const initialPresentation = (mode = 'lesson') => ({
  mode, slide: 0, demoValue: 50, expanded: false, answerRevealed: false,
});

export const QUESTION_DURATION_MS = 30000;

// How long a finished class stays in the teacher's list of earlier rooms. The server keeps
// to it and the teacher's screen quotes it, so both read it from here.
export const ROOM_ARCHIVE_DAYS = 1;

// Activities that state their own pace in the lesson content keep it; the server must run
// the same clock the learners are watching, or it would cut them off mid-question.
function questionDurationMs(state) {
  const step = CHAPTER_FLOW[state.chapter]?.[state.step];
  const seconds = step?.id === 'problem'
    ? problemActivity.durationSeconds
    : classroomChoiceActivities[step?.id]?.durationSeconds;
  return seconds ? seconds * 1000 : QUESTION_DURATION_MS;
}

// A tap made in good time can still spend seconds crawling over school wi-fi, and being
// told "หมดเวลา" for their network is the one unfairness learners actually notice. The
// window is wide enough to cover that, and answering this late earns the floor score
// anyway, so there is little to gain by exploiting it.
const LATE_ANSWER_GRACE_MS = 5000;

// roomApi resolves the sender of these from their student token, so payload.name cannot be forged.
export const STUDENT_ACTIONS = new Set([
  'problemVote', 'choiceVote', 'digitalVote', 'analogVote', 'catalogVote',
  'architectureVote', 'quizVote', 'logicVote', 'emoji', 'sense',
]);

export const CHAPTER_FLOW = {
  1: [
    { type: 'lobby', lessonId: 1 },
    { type: 'activity', id: 'architecture', lessonId: 2 },
    { type: 'activity', id: 'roles', lessonId: 3 },
    { type: 'activity', id: 'sensors', lessonId: 6 },
    { type: 'activity', id: 'problem', lessonId: 7 },
    { type: 'podium', lessonId: 1 }
  ],
  2: [
    { type: 'lobby', lessonId: 1 },
    { type: 'activity', id: 'digital', lessonId: 4 },
    { type: 'activity', id: 'digitaldata', lessonId: 12 },
    { type: 'activity', id: 'analog', lessonId: 5 },
    { type: 'activity', id: 'adcmeaning', lessonId: 13 },
    { type: 'activity', id: 'signalmatch', lessonId: 11 },
    // { type: 'activity', id: 'signaldesign', lessonId: 14 }, // ซ่อนเนื้อหาเลือกวิธีอ่านตามคำขอ
    { type: 'podium', lessonId: 1 }
  ],
  3: [
    { type: 'lobby', lessonId: 1 },
    { type: 'activity', id: 'logic', lessonId: 8 },
    { type: 'activity', id: 'wrapup', lessonId: 9 },
    { type: 'activity', id: 'ideation', lessonId: 10 },
    { type: 'podium', lessonId: 1 }
  ]
};

export function createRoomState() {
  return {
    pin: String(Math.floor(1000 + Math.random() * 9000)), chapter: 1, step: 0, presentation: initialPresentation('activity'),
    students: [], joinOpen: true, senses: { eyes: false, ears: false, hands: false },
    problemVotes: {}, digitalVotes: {}, analogVotes: {},
    choiceVotes: { roles: {}, signalmatch: {}, wrapup: {}, ideation: {} },
    quizVotes: {}, quizRevealed: false,
    logicVotes: {}, architectureVotes: { esp32: {}, wifi: {}, cloud: {} },
    catalogCurrentQuestion: 1, catalogVotes: { 1: {}, 2: {}, 3: {}, 4: {} },
    currentVoteItem: 'esp32', canvasImages: [],
    chapterScores: { 1: {}, 2: {}, 3: {} },
    // Every graded answer, so the podium can break ties on time instead of join order.
    answers: { 1: {}, 2: {}, 3: {} },
    questionKey: null, questionStartTime: Date.now(), questionDurationMs: QUESTION_DURATION_MS,
    questionStarts: {}, questionRoster: [],
  };
}

function requireValue(condition, message = 'ข้อมูลคำสั่งไม่ถูกต้อง') {
  if (!condition) throw new Error(message);
}

function validName(name) {
  requireValue(typeof name === 'string', 'กรุณากรอกชื่อไม่เกิน 20 ตัวอักษร');
  const cleanName = name.trim();
  requireValue(cleanName.length > 0 && cleanName.length <= 20, 'กรุณากรอกชื่อไม่เกิน 20 ตัวอักษร');
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  requireValue(!dangerous.includes(cleanName.toLowerCase()), 'ชื่อนี้ไม่สามารถใช้งานได้');
  return cleanName;
}

// "Ann", "ann" and "an  n" are the same learner coming back, not three seats in the room.
export function studentKey(name) {
  return validName(name).toLocaleLowerCase('th').replace(/\s+/g, ' ');
}

export function findStudent(state, name) {
  const key = studentKey(name);
  return (state.students || []).find(student => studentKey(student.name) === key);
}

// Only a learner the room already knows may answer, and only under their own name.
function requireStudent(state, name) {
  const student = findStudent(state, name);
  requireValue(student, 'ยังไม่ได้เข้าห้องเรียน กรุณาเข้าร่วมห้องอีกครั้ง');
  return student.name;
}

function calculateScore(elapsedMs) {
  // คะแนนเต็ม 1000, ลดลงวินาทีละ 50 คะแนน, ต่ำสุด 500
  return Math.max(500, Math.floor(1000 - (elapsedMs / 1000) * 50));
}

// Identifies the one question students may answer right now. Sub-questions get their own
// key so moving between them restarts the clock, while re-opening the same question does not.
export function currentQuestionKey(state) {
  const step = CHAPTER_FLOW[state.chapter]?.[state.step];
  if (!step || step.type !== 'activity') return null;
  const base = `c${state.chapter}:s${state.step}:${step.id}`;
  if (step.id === 'architecture') return `${base}:${state.currentVoteItem}`;
  if (step.id === 'sensors') return `${base}:q${state.catalogCurrentQuestion}`;
  return base;
}

function openQuestion(state, key) {
  if (!key) return state.questionKey === null ? state : { ...state, questionKey: null, questionRoster: [] };
  // A question that has been opened before keeps its original clock and roster, so flipping
  // between the lesson and activity tabs cannot hand latecomers a fresh 30 seconds.
  if (state.questionKey === key) return state;
  const started = state.questionStarts[key]
    || { startedAt: Date.now(), durationMs: questionDurationMs(state), roster: state.students.map(({ name }) => name) };
  return {
    ...state, questionKey: key, questionStartTime: started.startedAt,
    questionDurationMs: started.durationMs, questionRoster: started.roster,
    questionStarts: { ...state.questionStarts, [key]: started },
  };
}

const syncQuestion = state =>
  openQuestion(state, state.presentation.mode === 'activity' ? currentQuestionKey(state) : null);

// Answers are accepted only while the teacher is showing that exact question and it is still running.
function openAnswerWindow(state, activityId) {
  const step = CHAPTER_FLOW[state.chapter]?.[state.step];
  requireValue(step?.type === 'activity' && step.id === activityId, 'กิจกรรมนี้ยังไม่เปิดให้ตอบ');
  requireValue(state.questionKey && state.questionKey === currentQuestionKey(state), 'กิจกรรมนี้ยังไม่เปิดให้ตอบ');
  const elapsedMs = Math.max(0, Date.now() - state.questionStartTime);
  requireValue(elapsedMs <= state.questionDurationMs + LATE_ANSWER_GRACE_MS, 'หมดเวลาตอบคำถามนี้แล้ว');
  return { questionKey: state.questionKey, elapsedMs };
}

// Writes the running total and the per-question record together so the two cannot drift apart.
function recordAnswer(state, { name, questionKey, elapsedMs, correct }) {
  const score = correct ? calculateScore(elapsedMs) : 0;
  const chapterAnswers = state.answers[state.chapter] || {};
  const chapterScores = state.chapterScores[state.chapter] || {};
  return {
    answers: {
      ...state.answers,
      [state.chapter]: {
        ...chapterAnswers,
        [name]: { ...chapterAnswers[name], [questionKey]: { correct, elapsedMs, score } },
      },
    },
    chapterScores: {
      ...state.chapterScores,
      [state.chapter]: { ...chapterScores, [name]: (chapterScores[name] || 0) + score },
    },
  };
}

// Progress is measured against the roster captured when the question opened, so somebody
// joining halfway through cannot pull a revealed answer back off the screen. Anyone who did
// answer is counted either way, so a latecomer's vote never reads as more than 100%.
export function answerProgress(state, votes = {}) {
  const roster = state.questionRoster?.length ? state.questionRoster : (state.students || []).map(({ name }) => name);
  const counted = new Set([...roster, ...Object.keys(votes)]);
  const answered = [...counted].filter(name => votes[name] !== undefined).length;
  return { answered, total: counted.size, allAnswered: counted.size > 0 && answered >= counted.size };
}

// One row per learner for the chapter being taught. The room keeps every answer so it can
// rank on time, but those records grow with students x questions and the whole state goes
// out to every phone on every tap — which is what makes a full class unusable. Only this
// summary travels.
function summariseAnswers(state, chapter) {
  const chapterAnswers = state.answers?.[chapter] || {};
  return (state.students || []).map(student => {
    const entries = Object.values(chapterAnswers[student.name] || {});
    const correct = entries.filter(entry => entry.correct);
    return {
      id: student.id,
      name: student.name,
      score: entries.reduce((total, entry) => total + entry.score, 0),
      answeredCount: entries.length,
      correctCount: correct.length,
      totalTimeMs: correct.reduce((total, entry) => total + entry.elapsedMs, 0),
      bestTimeMs: correct.length ? Math.min(...correct.map(entry => entry.elapsedMs)) : null,
    };
  });
}

// What actually goes down the wire. answers and questionStarts are server bookkeeping:
// no screen reads them, and together they were half of every broadcast.
export function broadcastState(state) {
  const { answers: _answers, questionStarts: _starts, ...shared } = state;
  return { ...shared, standings: summariseAnswers(state, state.chapter) };
}

const compareTime = (left, right) => {
  const a = left ?? Number.POSITIVE_INFINITY;
  const b = right ?? Number.POSITIVE_INFINITY;
  return a === b ? 0 : a - b;
};

// Ranks on points first, then on how quickly those points were earned — the totals, then the
// single best answer — so equal scores are separated by time instead of by who joined first.
export function rankStudents(state, chapter = state.chapter) {
  const rows = chapter === state.chapter && state.standings
    ? state.standings
    : summariseAnswers(state, chapter);
  return [...rows]
    .sort((a, b) =>
      b.score - a.score
      || b.correctCount - a.correctCount
      || compareTime(a.correctCount ? a.totalTimeMs : null, b.correctCount ? b.totalTimeMs : null)
      || compareTime(a.bestTimeMs, b.bestTimeMs)
      || a.name.localeCompare(b.name, 'th'));
}

// The server applies each action to its latest state, so simultaneous votes cannot
// overwrite the teacher's selected slide (or another student's answer).
export function applyRoomAction(state, action) {
  const { type, payload: p = {} } = action;
  switch (type) {
    case 'changeChapter': {
      requireValue([1, 2, 3].includes(p.chapter));
      return syncQuestion({
        ...state, chapter: p.chapter, step: 0, joinOpen: CHAPTER_FLOW[p.chapter][0].type === 'lobby',
        presentation: initialPresentation('activity'),
      });
    }
    case 'changeStep': {
      const steps = CHAPTER_FLOW[state.chapter];
      requireValue(Number.isInteger(p.step) && p.step >= 0 && p.step < steps.length);
      const stepType = steps[p.step].type;
      // Leaving the lobby closes the door: the lesson has started, so no new names may appear.
      return syncQuestion({
        ...state, step: p.step, joinOpen: stepType === 'lobby',
        presentation: initialPresentation(stepType === 'activity' ? 'lesson' : 'activity'),
      });
    }
    case 'setJoinOpen':
      requireValue(typeof p.open === 'boolean');
      return { ...state, joinOpen: p.open };
    case 'removeStudent': {
      // Frees a seat so a learner who lost their device can take their own name back.
      // Their answers stay recorded, so returning does not reopen questions they already did.
      const key = studentKey(p.name);
      const students = state.students.filter(student => studentKey(student.name) !== key);
      if (students.length === state.students.length) return state;
      return { ...state, students, questionRoster: state.questionRoster.filter(name => studentKey(name) !== key) };
    }
    case 'presentation': {
      if (p.chapter !== state.chapter || p.step !== state.step) return state;
      const patch = {};
      if ('mode' in p) {
        requireValue(['lesson', 'activity'].includes(p.mode));
        patch.mode = p.mode;
      }
      if ('slide' in p) {
        const lessonId = CHAPTER_FLOW[state.chapter][state.step].lessonId;
        const lesson = lessons[lessonId];
        const maxSlide = lesson ? lesson.sections.length + 1 + (lesson.code ? 1 : 0) : 0; // intro, sections, optional code, recap
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
      return syncQuestion({ ...state, presentation: { ...state.presentation, ...patch } });
    }
    case 'verifyPin': {
      requireValue(p.pin === state.pin, 'รหัส PIN ไม่ถูกต้อง');
      return state; // No state change, just validates
    }
    case 'join': {
      requireValue(p.pin === state.pin, 'รหัส PIN ไม่ถูกต้อง');
      const name = validName(p.name);
      const seated = findStudent(state, name);
      if (seated) {
        // roomApi decides which of these it is. Without a takeover the seat is untouched —
        // the same learner simply reopened their tab. With one, the seat gets a fresh id,
        // which is how the screen that used to hold it finds out it has been replaced.
        if (!p.takeover) return state;
        return {
          ...state,
          students: state.students.map(student => (student === seated ? { ...student, id: p.id } : student)),
        };
      }
      requireValue(state.joinOpen, 'คุณครูปิดรับเข้าห้องแล้ว กรุณาแจ้งคุณครูเพื่อเปิดรับอีกครั้ง');
      return { ...state, students: [...state.students, { id: p.id, name }] };
    }
    case 'problemVote': {
      const name = requireStudent(state, p.name);
      requireValue(isProblemOption(p.option));
      if (isProblemOption(state.problemVotes[name])) return state;
      const window = openAnswerWindow(state, 'problem');
      return {
        ...state,
        problemVotes: { ...state.problemVotes, [name]: p.option },
        ...recordAnswer(state, { ...window, name, correct: p.option === problemActivity.correctId }),
      };
    }
    case 'choiceVote': {
      const name = requireStudent(state, p.name);
      requireValue(Object.hasOwn(classroomChoiceActivities, p.activityId));
      requireValue(isClassroomChoice(p.activityId, p.option));
      const activityVotes = state.choiceVotes?.[p.activityId] || {};
      if (activityVotes[name]) return state;
      const window = openAnswerWindow(state, p.activityId);
      return {
        ...state,
        choiceVotes: { ...state.choiceVotes, [p.activityId]: { ...activityVotes, [name]: p.option } },
        ...recordAnswer(state, { ...window, name, correct: p.option === classroomChoiceActivities[p.activityId].correctId }),
      };
    }
    case 'digitalVote': {
      const name = requireStudent(state, p.name);
      requireValue(['2_states', '10_states', 'infinite', 'none'].includes(p.option));
      if (state.digitalVotes[name] !== undefined) return state;
      const window = openAnswerWindow(state, 'digital');
      return {
        ...state,
        digitalVotes: { ...state.digitalVotes, [name]: p.option },
        ...recordAnswer(state, { ...window, name, correct: p.option === '2_states' }),
      };
    }
    case 'analogVote': {
      const name = requireStudent(state, p.name);
      requireValue(['continuous', 'binary', 'faster', 'less_wires'].includes(p.option));
      if (state.analogVotes[name] !== undefined) return state;
      const window = openAnswerWindow(state, 'analog');
      return {
        ...state,
        analogVotes: { ...state.analogVotes, [name]: p.option },
        ...recordAnswer(state, { ...window, name, correct: p.option === 'continuous' }),
      };
    }
    case 'voteItem':
      requireValue(['esp32', 'wifi', 'cloud'].includes(p.item));
      return syncQuestion({ ...state, currentVoteItem: p.item });
    case 'setCatalogQuestion':
      requireValue(Number.isInteger(p.question) && p.question >= 1 && p.question <= 4);
      return syncQuestion({ ...state, catalogCurrentQuestion: p.question });
    case 'catalogVote': {
      const name = requireStudent(state, p.name);
      requireValue(isSensorCatalogOption(p.option));
      const qIndex = state.catalogCurrentQuestion;
      if (state.catalogVotes[qIndex][name] !== undefined) return state;
      const window = openAnswerWindow(state, 'sensors');
      return {
        ...state,
        catalogVotes: { ...state.catalogVotes, [qIndex]: { ...state.catalogVotes[qIndex], [name]: p.option } },
        ...recordAnswer(state, { ...window, name, correct: p.option === sensorCatalogQuestions[qIndex].correct }),
      };
    }
    case 'architectureVote': {
      const name = requireStudent(state, p.name);
      requireValue(['esp32', 'wifi', 'cloud'].includes(p.item) && ['device', 'network', 'service'].includes(p.layer));
      requireValue(p.item === state.currentVoteItem, 'กิจกรรมนี้ยังไม่เปิดให้ตอบ');
      if (state.architectureVotes[p.item][name] !== undefined) return state;
      const window = openAnswerWindow(state, 'architecture');
      // เช็คว่าตอบถูกไหม (esp32->device, wifi->network, cloud->service)
      const correctMap = { esp32: 'device', wifi: 'network', cloud: 'service' };
      return {
        ...state,
        architectureVotes: { ...state.architectureVotes, [p.item]: { ...state.architectureVotes[p.item], [name]: p.layer } },
        ...recordAnswer(state, { ...window, name, correct: p.layer === correctMap[p.item] }),
      };
    }
    case 'quizVote': {
      // No chapter step shows this quiz, so openAnswerWindow refuses it — the endpoint cannot
      // be used to award points for a question nobody was asked.
      const name = requireStudent(state, p.name);
      requireValue(['ldr', 'dht', 'pir', 'soil'].includes(p.option));
      if (state.quizRevealed || state.quizVotes[name] !== undefined) return state;
      const window = openAnswerWindow(state, 'quiz');
      return {
        ...state,
        quizVotes: { ...state.quizVotes, [name]: p.option },
        ...recordAnswer(state, { ...window, name, correct: p.option === 'ldr' }),
      };
    }
    case 'quizReveal':
      requireValue(typeof p.reveal === 'boolean');
      return { ...state, quizRevealed: p.reveal };
    case 'logicVote': {
      const name = requireStudent(state, p.name);
      requireValue(['dark', 'dry', 'motion', 'hot'].includes(p.option));
      if (state.logicVotes[name] !== undefined) return state;
      const window = openAnswerWindow(state, 'logic');
      return {
        ...state,
        logicVotes: { ...state.logicVotes, [name]: p.option },
        ...recordAnswer(state, { ...window, name, correct: p.option === 'dry' }),
      };
    }
    case 'sense':
      requireStudent(state, p.name);
      requireValue(['eyes', 'ears', 'hands'].includes(p.sense));
      return { ...state, senses: { ...state.senses, [p.sense]: true } };
    case 'reset': return createRoomState();
    default: throw new Error('ไม่พบคำสั่งนี้');
  }
}
