import { applyRoomAction, createRoomState, CHAPTER_FLOW } from '../shared/roomState.js';

export const act = (state, type, payload = {}) => applyRoomAction(state, { type, payload });

export const joinAll = (state, names) =>
  names.reduce((room, name) => act(room, 'join', { pin: room.pin, name, id: name }), state);

export function locateActivity(activityId) {
  for (const [chapter, steps] of Object.entries(CHAPTER_FLOW)) {
    const step = steps.findIndex(entry => entry.id === activityId);
    if (step >= 0) return { chapter: Number(chapter), step };
  }
  throw new Error(`ไม่พบกิจกรรม ${activityId}`);
}

// Walks the room the way a teacher does: everyone gathers in the lobby, the teacher moves to
// the step, then opens the activity tab — which is the moment the question starts running.
export function openActivity(activityId, students = ['Learner']) {
  const { chapter, step } = locateActivity(activityId);
  let state = joinAll(createRoomState(), students);
  state = act(state, 'changeChapter', { chapter });
  state = act(state, 'changeStep', { step });
  return act(state, 'presentation', { chapter, step, mode: 'activity' });
}

// Rewinds the open question's clock, including the record it is restored from, so the room
// behaves exactly as it would had the learners really taken that long.
export function age(state, ms) {
  const started = state.questionStarts[state.questionKey];
  return {
    ...state,
    questionStartTime: state.questionStartTime - ms,
    questionStarts: { ...state.questionStarts, [state.questionKey]: { ...started, startedAt: started.startedAt - ms } },
  };
}
