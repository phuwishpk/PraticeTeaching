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
      <section className="lesson-goals" aria-label="เป้าหมายการเรียนรู้">
        <h2>เมื่อจบบทนี้ คุณจะ…</h2>
        <ul>{lesson.goals.map(goal => <li key={goal}>{goal}</li>)}</ul>
      </section>
      {lesson.flow && (
        <ol className="lesson-flow" aria-label="ลำดับการทำงาน">
          {lesson.flow.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}
        </ol>
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
