import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { MotionConfig } from 'framer-motion';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { CHAPTER_FLOW, createRoomState } from '../shared/roomState.js';
import { chapterTwoLessons, chapterTwoActivities } from '../src/content/chapterTwo.js';

test('teacher and student pages render with the current chapter/step room state', async (t) => {
  // Model browser storage only for rendering; never touch an actual user's session.
  const entries = new Map();
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: key => entries.delete(key),
  } });
  const contextId = '\0test-room-context';
  const server = await createServer({
    server: { middlewareMode: true }, appType: 'custom',
    plugins: [{
      name: 'page-test-room-context', enforce: 'pre',
      resolveId(source) { if (source.includes('/context/RoomContext')) return contextId; },
      load(id) {
        if (id === contextId) return `let value; export const setTestRoom = next => { value = next; }; export const useRoom = () => value;`;
      },
    }],
  });
  try {
    const { setTestRoom } = await server.ssrLoadModule(contextId);
    const { default: Host } = await server.ssrLoadModule('/src/views/HostView.jsx');
    const { default: Client } = await server.ssrLoadModule('/src/views/ClientView.jsx');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { origin: 'http://localhost:5175', search: '' }, innerWidth: 1280, innerHeight: 800,
  } });
    const noop = () => {};
    const renderPage = Component => renderToStaticMarkup(React.createElement(MotionConfig, { isStatic: true }, React.createElement(Component)));
    const provide = (roomState, extra = {}) => setTestRoom({ roomState, connected: true, joinUrl: 'http://localhost:5175/',
      setJoinOpen: noop, removeStudent: noop, restoreRoom: noop, listRooms: async () => [],
      setChapter: noop, setStep: noop, resetRoom: noop, setPresentation: noop,
      addFloatingEmoji: noop, sendFloatingEmoji: noop, setVoteItem: noop, submitVote: noop,
      voteProblem: noop, voteDigital: noop, voteAnalog: noop, voteQuiz: noop, voteLogic: noop,
      voteChoice: noop, setCatalogQuestion: noop, voteCatalog: noop, revealQuiz: noop,
      ...extra,
    });
    await t.test('new visitors see the PIN form even when the teacher is showing a lesson', () => {
      provide({ ...createRoomState(), step: 1, presentation: { mode: 'lesson', slide: 0 } });
      const html = renderPage(Client);
      assert.ok(html.includes('PIN'));
      assert.ok(!html.includes('lesson-slideshow-stage'));
    });
    await t.test('problem activity matches on both screens and only reveals explanations when voting ends', () => {
      entries.set('student_name', 'Test learner');
      const problemStep = CHAPTER_FLOW[1].findIndex(({ id }) => id === 'problem');
      const state = { ...createRoomState(), chapter: 1, step: problemStep,
        students: [{ id: 'test', name: 'Test learner' }, { id: 'peer', name: 'Peer' }],
        presentation: { mode: 'activity', slide: 0 },
        problemVotes: { 'Test learner': 'motion_plan' },
      };
      provide(state);
      for (const Component of [Host, Client]) {
        const html = renderPage(Component);
        assert.ok(html.includes('problem-plan-steps'));
        assert.ok(html.includes('LDR'));
        assert.ok(!html.includes('problem-explanation'));
      }
      provide({ ...state, problemVotes: { ...state.problemVotes, Peer: 'light_plan' } });
      for (const Component of [Host, Client]) {
        const html = renderPage(Component);
        assert.ok(html.includes('problem-explanation'));
        assert.ok(html.includes('data-timer-status="stopped"'));
      }
      provide({ ...state, problemVotes: {}, questionStartTime: Date.now() - 61000 });
      for (const Component of [Host, Client]) assert.ok(renderPage(Component).includes('problem-explanation'));
    });
    await t.test('all steps render on both screens in activity and lesson modes', () => {
      entries.set('student_name', 'Test learner');
      for (const [chapterKey, steps] of Object.entries(CHAPTER_FLOW)) {
        for (let step = 0; step < steps.length; step++) {
          for (const mode of ['activity', 'lesson']) {
            provide({ ...createRoomState(), chapter: Number(chapterKey), step,
              students: [{ id: 'test-learner', name: 'Test learner' }],
              presentation: { mode, slide: 0 },
            });
            const teacher = renderPage(Host);
            assert.ok(teacher.includes('Host Dashboard'));
            assert.ok(teacher.includes(mode === 'lesson' ? 'lesson-slideshow-stage' : 'host-activity'));
            // The lobby has no lesson behind it, so the teacher is not offered that tab there.
            assert.equal(teacher.includes('host-tab-lesson'), steps[step].type !== 'lobby');
            const student = renderPage(Client);
            assert.ok(student.length > 500);
            assert.ok(!student.includes('Unknown Activity'));
          }
        }
      }
    });
    await t.test('chapter two renders every section and keeps discussion answers collapsed', () => {
      entries.set('student_name', 'Test learner');
      for (const [lessonId, lesson] of Object.entries(chapterTwoLessons)) {
        const step = CHAPTER_FLOW[2].findIndex(entry => entry.lessonId === Number(lessonId));
        for (let slide = 0; slide <= lesson.sections.length + 1; slide++) {
          provide({ ...createRoomState(), chapter: 2, step,
            students: [{ id: 'test', name: 'Test learner' }],
            presentation: { mode: 'lesson', slide },
          });
          for (const Component of [Host, Client]) {
            const html = renderPage(Component);
            const section = lesson.sections[slide - 1];
            assert.ok(html.includes(slide === 0 ? lesson.title : section ? section.title : lesson.recap.title));
            if (section?.activity) {
              assert.ok(html.includes('lesson-discussion'));
              assert.ok(html.includes(section.activity.question));
              assert.ok(html.includes('<details><summary>เปิดแนวคำตอบหลังอภิปราย</summary>'));
            }
          }
        }
      }
    });
    await t.test('chapter two choice explanations appear only after completion or expiry on both screens', () => {
      entries.set('student_name', 'Test learner');
      for (const [activityId, activity] of Object.entries(chapterTwoActivities)) {
        const step = CHAPTER_FLOW[2].findIndex(entry => entry.id === activityId);
        const state = { ...createRoomState(), chapter: 2, step,
          questionStartTime: Date.now(), questionDurationMs: activity.durationSeconds * 1000,
          students: [{ id: 'test', name: 'Test learner' }, { id: 'peer', name: 'Peer' }],
          presentation: { mode: 'activity', slide: 0 },
          choiceVotes: { [activityId]: { 'Test learner': activity.correctId } },
        };
        provide(state);
        for (const Component of [Host, Client]) {
          const html = renderPage(Component);
          assert.ok(html.includes(activity.question));
          assert.ok(!html.includes('classroom-choice-explanation'));
        }
        provide({ ...state, choiceVotes: { [activityId]: { 'Test learner': activity.correctId, Peer: activity.correctId } } });
        for (const Component of [Host, Client]) assert.ok(renderPage(Component).includes('classroom-choice-explanation'));
        provide({ ...state, questionStartTime: Date.now() - (activity.durationSeconds + 1) * 1000 });
        for (const Component of [Host, Client]) assert.ok(renderPage(Component).includes('classroom-choice-explanation'));
      }
    });
    await t.test('a teacher who drops off the network is told, and how to get back', () => {
      const room = { ...createRoomState(), students: [{ id: 'test', name: 'Test learner' }] };
      provide(room);
      assert.ok(!renderPage(Host).includes('ขาดการเชื่อมต่อกับห้องเรียน'));

      provide(room, { connected: false });
      const offline = renderPage(Host);
      assert.ok(offline.includes('ขาดการเชื่อมต่อกับห้องเรียน'));
      assert.ok(offline.includes('โหลดใหม่'), 'and a way to recover');
      assert.ok(offline.includes('นักเรียนไม่หลุด'), 'reassuring the teacher the room survives');
    });
    await t.test('every classroom activity gives students multiple choices', () => {
      entries.set('student_name', 'Test learner');
      for (const [chapterKey, steps] of Object.entries(CHAPTER_FLOW)) {
        for (let step = 0; step < steps.length; step++) {
          if (steps[step].type !== 'activity') continue;
          provide({ ...createRoomState(), chapter: Number(chapterKey), step,
            students: [{ id: 'test-learner', name: 'Test learner' }],
            presentation: { mode: 'activity', slide: 0 },
          });
          const html = renderPage(Client);
          const answerButtons = html.match(/<button/g) || [];
          assert.ok(answerButtons.length >= 2, `${steps[step].id} must render multiple answer buttons`);
        }
      }
    });
  } finally {
    await server.close();
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage); else delete globalThis.localStorage;
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete globalThis.window;
  }
});
