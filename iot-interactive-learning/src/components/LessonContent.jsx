import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lessons, sensorQuizExplanation } from '../content/lessons';
import './LessonContent.css';

const PHASE_TO_CHAPTER = {
  1: 1, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 
  9: 6, 10: 6, 11: 6, 12: 6, 13: 7, 14: 8, 15: 9, 16: 10
};

export default function LessonContent({ phase, quizRevealed = false }) {
  const chapter = PHASE_TO_CHAPTER[phase] || 1;
  const lesson = lessons[chapter];
  if (!lesson) return null;

  return (
    <article className="lesson-content" aria-labelledby={`lesson-title-${phase}`} lang="th">
      <header className="lesson-header">
        <span className="lesson-eyebrow">IOT LAB · บทที่ {phase} / 10</span>
        <h1 id={`lesson-title-${phase}`}>{lesson.title}</h1>
        <p>{lesson.intro}</p>
      </header>
      {lesson.goals && (
        <section className="lesson-goals" aria-label="เป้าหมายการเรียนรู้">
          <h2>เมื่อจบบทนี้ คุณจะ…</h2>
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
            <div><h2>{section.title}</h2><p>{section.text}</p></div>
          </section>
        ))}
      </div>
      {lesson.code && <pre className="lesson-code" aria-label="ตัวอย่างรหัสลำลอง"><code>{lesson.code}</code></pre>}
      <aside className="lesson-callout"><h2>ลองเชื่อมกับตัวอย่าง</h2><p>{lesson.example}</p></aside>
      <aside className="lesson-callout lesson-caution"><h2>จุดที่ควรเข้าใจให้ชัด</h2><p>{lesson.caution}</p></aside>
      {lesson.question && (
        <section className="lesson-check">
          <h2>เช็กความเข้าใจ</h2><p>{lesson.question}</p>
          <details key={phase}><summary>ดูแนวคำตอบและเหตุผล</summary><p>{lesson.answer}</p></details>
        </section>
      )}
      {phase === 7 && (quizRevealed
        ? <aside className="lesson-callout" aria-live="polite"><h2>เฉลยพร้อมเหตุผล</h2><p>{sensorQuizExplanation}</p></aside>
        : <p className="lesson-muted">ลองตอบในกิจกรรมก่อน แล้วดูเหตุผลเมื่อครูเปิดเฉลย</p>)}
      {lesson.sources && <footer className="lesson-sources">อ่านเพิ่มเติมจากผู้พัฒนาอุปกรณ์: {lesson.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</footer>}
    </article>
  );
}

export function StudentLessonNotes({ phase, quizRevealed }) {
  const chapter = PHASE_TO_CHAPTER[phase] || 1;
  return (
    <details className="student-lesson-notes" key={phase}>
      <summary>📖 อ่านคำอธิบายบทที่ {chapter} เพิ่มเติม</summary>
      <LessonContent phase={phase} quizRevealed={quizRevealed} />
    </details>
  );
}

// ─── Full-screen Slideshow for Student View ────────────────────────────────────
// controlledSlide: when provided, the component uses this as the current slide (teacher mode)
// onSlideChange: called with new slide index when navigation happens (teacher mode)
export function LessonSlideshow({ phase, quizRevealed = false, controlledSlide, onSlideChange }) {
  const chapter = PHASE_TO_CHAPTER[phase] || 1;
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

  if (!lesson) return null;

  // Build slides array
  const slides = [];

  // Slide 0: title + intro + goals
  slides.push({
    id: 'intro',
    label: 'บทนำ',
    content: (
      <div className="lesson-slide-body">
        <span className="lesson-eyebrow">IOT LAB · บทที่ {chapter}</span>
        <h1 className="lesson-slide-title">{lesson.title}</h1>
        <p className="lesson-slide-intro">{lesson.intro}</p>
        {lesson.goals && (
          <div className="lesson-slide-goals">
            <h2>🎯 เมื่อจบบทนี้ คุณจะ…</h2>
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
      label: `${i + 1}. ${section.title.length > 12 ? section.title.slice(0, 12) + '…' : section.title}`,
      content: (
        <div className="lesson-slide-body">
          <span className="lesson-slide-section-num">ส่วนที่ {i + 1} / {lesson.sections.length}</span>
          <h2 className="lesson-slide-section-title">{section.title}</h2>
          <p className="lesson-slide-section-text">{section.text}</p>
        </div>
      ),
    });
  });

  // Example + Caution slide
  slides.push({
    id: 'example',
    label: 'ตัวอย่าง',
    content: (
      <div className="lesson-slide-body">
        <div className="lesson-slide-callout">
          <h2>🔗 ลองเชื่อมกับตัวอย่าง</h2>
          <p>{lesson.example}</p>
        </div>
        <div className="lesson-slide-caution">
          <h2>⚠️ จุดที่ควรเข้าใจให้ชัด</h2>
          <p>{lesson.caution}</p>
        </div>
        {lesson.question && (
          <div className="lesson-slide-check">
            <h2>❓ เช็กความเข้าใจ</h2>
            <p>{lesson.question}</p>
            <details><summary>ดูแนวคำตอบ</summary><p>{lesson.answer}</p></details>
          </div>
        )}
        {phase === 7 && (
          quizRevealed
            ? <div className="lesson-slide-callout" style={{ marginTop: 16 }}><h2>✅ เฉลยพร้อมเหตุผล</h2><p>{sensorQuizExplanation}</p></div>
            : <p className="lesson-muted">ลองตอบในกิจกรรมก่อน แล้วดูเหตุผลเมื่อครูเปิดเฉลย</p>
        )}
        {lesson.sources && (
          <footer className="lesson-sources" style={{ marginTop: 16 }}>
            อ่านเพิ่มเติม: {lesson.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}</a>)}
          </footer>
        )}
      </div>
    ),
  });

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
  const prev = () => { if (slideIndex > 0) goTo(slideIndex - 1); };
  const next = () => { if (slideIndex < slides.length - 1) goTo(slideIndex + 1); };

  const variants = {
    enter: d => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: d => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <div className="lesson-slideshow">
      {/* Slide content */}
      <div className="lesson-slideshow-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slides[slideIndex].id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="lesson-slideshow-slide"
          >
            {slides[slideIndex].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation bar */}
      <nav className="lesson-slideshow-nav" aria-label="เลื่อนหน้าเนื้อหา">
        <button
          className="lesson-nav-arrow"
          onClick={prev}
          disabled={slideIndex === 0}
          aria-label="หน้าก่อน"
        >
          ‹
        </button>

        <div className="lesson-nav-pages">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              className={`lesson-nav-page-btn${i === slideIndex ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-current={i === slideIndex ? 'true' : undefined}
              title={slide.label}
            >
              {i === 0 ? '📋' : i === slides.length - 1 ? '💡' : i}
            </button>
          ))}
        </div>

        <button
          className="lesson-nav-arrow"
          onClick={next}
          disabled={slideIndex === slides.length - 1}
          aria-label="หน้าถัดไป"
        >
          ›
        </button>
      </nav>
    </div>
  );
}
