import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lessons } from '../content/lessons';
import { SectionExplanation, LessonRecap } from './LessonGraphics';
import './LessonContent.css';

export default function LessonContent({ phase, quizRevealed = false }) {
  const chapter = phase;
  const lesson = lessons[chapter];
  if (!lesson) return null;

  return (
    <article data-signal={lesson.signalTheme} className="lesson-content" aria-labelledby={`lesson-title-${phase}`} lang="th">
      <header className="lesson-header">
        <span className="lesson-eyebrow">IOT LAB · {lesson.displayLabel || `ส่วนที่ ${chapter}`}</span>
        <h1 id={`lesson-title-${phase}`}>{lesson.title}</h1>
        <p>{lesson.intro}</p>
      </header>
      {lesson.goals && (
        <section className="lesson-goals" aria-label="เป้าหมายการเรียนรู้">
          <h2>เมื่อจบเนื้อหานี้ คุณจะ…</h2>
          <ul>{lesson.goals.map(goal => <li key={goal}>{goal}</li>)}</ul>
        </section>
      )}
      {lesson.flow && (
        <ol className="lesson-flow" aria-label="ลำดับการทำงาน">
          {lesson.flow.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}
        </ol>
      )}
      {lesson.layerGraphic && (
        <div className="lesson-layer-graphic" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
          {lesson.layerGraphic.map((layer) => (
            <div key={layer.id} className="glass-panel" style={{ padding: '1rem', border: `2px solid ${layer.color}`, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ fontSize: '2.5rem', filter: `drop-shadow(0 0 10px ${layer.color})` }}>{layer.icon}</div>
              <div style={{ fontWeight: 'bold', color: layer.color, fontSize: '1.1rem' }}>{layer.title}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{layer.desc}</div>
            </div>
          ))}
        </div>
      )}
      <div className="lesson-sections">
        {lesson.sections.map((section, index) => (
          <section className="glass-panel lesson-section" key={section.title}>
            <span className="lesson-section-number">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2>{section.title}</h2>
              <SectionExplanation section={section} />
            </div>
          </section>
        ))}
      </div>
      {lesson.code && <pre className="lesson-code" aria-label="ตัวอย่างรหัสลำลอง"><code>{lesson.code}</code></pre>}
      {/* Example, caution, and check sections removed as requested */}
      {lesson.sources && <footer className="lesson-sources">อ่านเพิ่มเติมจากผู้พัฒนาอุปกรณ์: {lesson.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</footer>}
      <LessonRecap lesson={lesson} />
    </article>
  );
}

export function StudentLessonNotes({ phase, quizRevealed }) {
  const chapter = phase;
  return (
    <details className="student-lesson-notes" key={phase}>
      <summary>📖 อ่านคำอธิบายส่วนที่ {chapter} เพิ่มเติม</summary>
      <LessonContent phase={phase} quizRevealed={quizRevealed} />
    </details>
  );
}

// ─── Full-screen Slideshow for Student View ────────────────────────────────────
// controlledSlide: when provided, the component uses this as the current slide (teacher mode)
// onSlideChange: called with new slide index when navigation happens (teacher mode)
export function LessonSlideshow({ phase, quizRevealed = false, controlledSlide, onSlideChange }) {
  // A chapter with no lesson must not mount the stage at all, and the stage owns hooks —
  // so the guard lives out here, where returning early skips no hook.
  if (!lessons[phase]) return null;
  return (
    <LessonSlideshowStage
      phase={phase}
      quizRevealed={quizRevealed}
      controlledSlide={controlledSlide}
      onSlideChange={onSlideChange}
    />
  );
}

function LessonSlideshowStage({ phase, quizRevealed = false, controlledSlide, onSlideChange }) {
  const chapter = phase;
  const lesson = lessons[chapter];

  // Internal state — used in student uncontrolled mode
  const [slideIndex, setSlideIndex] = useState(controlledSlide ?? 0);
  const [direction, setDirection] = useState(1);

  const isControlled = controlledSlide !== undefined;

  // Sync local state when teacher changes slide (student follow mode)
  useEffect(() => {
    if (isControlled) {
      const next = controlledSlide ?? 0;
      setDirection(next > slideIndex ? 1 : -1);
      setSlideIndex(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledSlide]);

  // Build slides array
  const slides = [];

  // Slide 0: title + intro + goals
  slides.push({
    id: 'intro',
    label: 'เริ่มต้น',
    content: (
      <div className="lesson-slide-body">
        <span className="lesson-eyebrow">IOT LAB · {lesson.displayLabel || `ส่วนที่ ${chapter}`}</span>
        <h1 className="lesson-slide-title">{lesson.title}</h1>
        <p className="lesson-slide-intro">{lesson.intro}</p>
        {lesson.goals && (
          <div className="lesson-slide-goals">
            <h2>🎯 เมื่อจบเนื้อหานี้ คุณจะ…</h2>
            <ul>{lesson.goals.map(g => <li key={g}>{g}</li>)}</ul>
          </div>
        )}
        {lesson.flow && (
          <div className="lesson-slide-flow">
            {lesson.flow.map((step, i) => (
              <span key={step} className="lesson-slide-flow-step">
                <b>{i + 1}</b> {step}
              </span>
            ))}
          </div>
        )}
        {lesson.layerGraphic && (
          <div className="lesson-layer-graphic" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            {lesson.layerGraphic.map((layer) => (
              <div key={layer.id} className="glass-panel" style={{ padding: '1rem', border: `2px solid ${layer.color}`, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '2.5rem', filter: `drop-shadow(0 0 10px ${layer.color})` }}>{layer.icon}</div>
                <div style={{ fontWeight: 'bold', color: layer.color, fontSize: '1.1rem' }}>{layer.title}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{layer.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  });

  // One slide per section
  lesson.sections.forEach((section, i) => {
    slides.push({
      id: `section-${i}`,
      label: `${i + 1}. ${section.title}`,
      content: (
        <div className="lesson-slide-body">
          <span className="lesson-slide-section-num">ส่วนที่ {i + 1} / {lesson.sections.length}</span>
          <h2 className="lesson-slide-section-title">{section.title}</h2>
          <SectionExplanation section={section} />
        </div>
      ),
    });
  });

  if (lesson.code) {
    slides.push({
      id: 'example',
      label: 'รหัสลำลอง/เพิ่มเติม',
      content: (
        <div className="lesson-slide-body">
          <pre className="lesson-code" aria-label="ตัวอย่างรหัสลำลอง"><code>{lesson.code}</code></pre>
        </div>
      ),
    });
  }

  slides.push({
    id: 'recap',
    label: 'สรุปและจุดประสงค์',
    content: <div className="lesson-slide-body"><LessonRecap lesson={lesson} /></div>,
  });

  const currentIndex = Math.min(Math.max(slideIndex, 0), slides.length - 1);
  const goTo = (idx) => {
    if (isControlled && onSlideChange) {
      // Teacher mode: dispatch to server, server will echo back via roomState
      onSlideChange(idx);
    } else {
      // Student mode: update local state directly
      setDirection(idx > slideIndex ? 1 : -1);
      setSlideIndex(idx);
    }
  };
  const prev = () => { if (currentIndex > 0) goTo(currentIndex - 1); };
  const next = () => { if (currentIndex < slides.length - 1) goTo(currentIndex + 1); };

  // Arrow keys move the slides, so the teacher can present from a clicker or from across the
  // room instead of walking back to the mouse. PageUp/PageDown too — that is what most
  // presenter remotes actually send. A student following the teacher gets no keys at all:
  // their view is controlled and has no onSlideChange to call.
  const canNavigate = !isControlled || Boolean(onSlideChange);
  useEffect(() => {
    if (!canNavigate) return;
    const handleKey = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      // Never steal the keys from someone typing an answer or using a select.
      const target = event.target;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      let step = 0;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') step = 1;
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') step = -1;
      else return;
      event.preventDefault();
      if (step > 0) next(); else prev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const variants = {
    enter: d => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: d => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div className="lesson-slideshow" lang="th" data-signal={lesson.signalTheme}>
      {/* Slide content */}
      <div className="lesson-slideshow-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slides[currentIndex].id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="lesson-slideshow-slide"
          >
            {slides[currentIndex].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation bar */}
      <nav className="lesson-slideshow-nav" aria-label="เลื่อนหน้าเนื้อหา">
        <button
          className="lesson-nav-arrow"
          onClick={prev}
          disabled={currentIndex === 0}
          aria-label="หน้าก่อน"
          title={canNavigate ? 'หน้าก่อน (←)' : 'หน้าก่อน'}
        >
          ‹
        </button>

        <div className="lesson-nav-pages">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              className={`lesson-nav-page-btn${i === currentIndex ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-current={i === currentIndex ? 'true' : undefined}
              title={slide.label}
              aria-label={slide.label}
            >
              {i === 0 ? '📋' : i === slides.length - 1 ? 'สรุป' : i}
            </button>
          ))}
        </div>

        <button
          className="lesson-nav-arrow"
          onClick={next}
          disabled={currentIndex === slides.length - 1}
          aria-label="หน้าถัดไป"
          title={canNavigate ? 'หน้าถัดไป (→)' : 'หน้าถัดไป'}
        >
          ›
        </button>
      </nav>
    </div>
  );
}
