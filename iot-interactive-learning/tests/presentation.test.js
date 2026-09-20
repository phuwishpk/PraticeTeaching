import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/content/lessons.js';
import { CHAPTER_FLOW, applyRoomAction, createRoomState } from '../shared/roomState.js';
import { act, openActivity } from './roomHarness.js';

test('chapter one builds knowledge before asking learners to solve a problem', () => {
  assert.deepEqual(
    CHAPTER_FLOW[1].map(({ id, type, lessonId }) => [id || type, lessonId]),
    [
      ['lobby', 1],
      ['architecture', 2],
      ['roles', 3],
      ['sensors', 6],
      ['problem', 7],
      ['podium', 1],
    ],
  );
});

test('digital levels and multi-bit data open distinct lessons and experiments', () => {
  const steps = CHAPTER_FLOW[2];
  const levels = steps.find(step => step.id === 'digital');
  const data = steps.find(step => step.id === 'digitaldata');
  assert.notEqual(levels.lessonId, data.lessonId);
  const levelGraphics = lessons[levels.lessonId].sections.map(section => section.signalGraphic).filter(Boolean);
  const dataGraphics = lessons[data.lessonId].sections.map(section => section.signalGraphic).filter(Boolean);
  assert.deepEqual(levelGraphics, ['digital:levels', 'digital:polarity']);
  assert.deepEqual(dataGraphics, ['digital:bits']);
  let state = applyRoomAction(createRoomState(), { type: 'changeChapter', payload: { chapter: 2 } });
  state = applyRoomAction(state, { type: 'changeStep', payload: { step: steps.indexOf(levels) } });
  state = applyRoomAction(state, { type: 'presentation', payload: { chapter: 2, step: state.step, slide: 3 } });
  state = applyRoomAction(state, { type: 'changeStep', payload: { step: steps.indexOf(data) } });
  assert.equal(state.presentation.slide, 0);
  assert.equal(CHAPTER_FLOW[2][state.step].lessonId, data.lessonId);
});

test('every chapter two activity owns a distinct lesson without copied content slides', () => {
  const lessonIds = CHAPTER_FLOW[2].filter(step => step.type === 'activity').map(step => step.lessonId);
  assert.equal(new Set(lessonIds).size, lessonIds.length);
  const chapterLessons = lessonIds.map(id => lessons[id]);
  for (const values of [
    chapterLessons.map(lesson => lesson.title),
    chapterLessons.map(lesson => lesson.intro),
    chapterLessons.map(lesson => lesson.recap.title),
    chapterLessons.flatMap(lesson => lesson.sections.map(section => section.title)),
    chapterLessons.flatMap(lesson => lesson.sections.map(section => section.text)),
  ]) {
    assert.equal(new Set(values).size, values.length);
  }
});

test('each chapter step accepts valid navigation and rejects out-of-range slides', () => {
  let state = createRoomState();
  for (const [chapterKey, steps] of Object.entries(CHAPTER_FLOW)) {
    const chapter = Number(chapterKey);
    state = applyRoomAction(state, { type: 'changeChapter', payload: { chapter } });
    for (let step = 0; step < steps.length; step++) {
      state = applyRoomAction(state, { type: 'changeStep', payload: { step } });
      const lesson = lessons[steps[step].lessonId];
      const last = lesson.sections.length + 1 + (lesson.code ? 1 : 0);
      for (let slide = 0; slide <= last; slide++) {
        state = applyRoomAction(state, { type: 'presentation', payload: { chapter, step, slide } });
        assert.equal(state.presentation.slide, slide);
      }
      for (const slide of [-1, last + 1]) {
        assert.throws(() => applyRoomAction(state, { type: 'presentation', payload: { chapter, step, slide } }));
      }
    }
  }
});

test('changing steps resets navigation and ignores delayed actions from the previous step or chapter', () => {
  let state = applyRoomAction(createRoomState(), { type: 'changeStep', payload: { step: 3 } });
  state = applyRoomAction(state, { type: 'presentation', payload: { chapter: 1, step: 3, slide: 4 } });
  state = applyRoomAction(state, { type: 'changeStep', payload: { step: 4 } });
  assert.equal(state.presentation.slide, 0);
  assert.equal(state.presentation.mode, 'lesson');
  assert.equal(applyRoomAction(state, { type: 'presentation', payload: { chapter: 1, step: 3, slide: 2 } }), state);
  state = applyRoomAction(state, { type: 'changeChapter', payload: { chapter: 2 } });
  assert.equal(state.presentation.slide, 0);
  assert.equal(state.presentation.mode, 'activity');
  assert.equal(applyRoomAction(state, { type: 'presentation', payload: { chapter: 1, step: 4, slide: 2 } }), state);
});

test('opening a podium displays the activity view immediately', () => {
  const podiumStep = CHAPTER_FLOW[1].findIndex(({ type }) => type === 'podium');
  const state = applyRoomAction(createRoomState(), { type: 'changeStep', payload: { step: podiumStep } });
  assert.equal(state.presentation.mode, 'activity');
});

test('the sensor review scores the four sensors taught in chapter one', () => {
  let state = act(openActivity('sensors'), 'setCatalogQuestion', { question: 4 });
  state = act(state, 'catalogVote', { name: 'Learner', option: 'soil' });
  assert.ok(state.chapterScores[1].Learner > 0);
  assert.throws(() => act(state, 'catalogVote', { name: 'Learner', option: 'ultrasonic' }));
});
