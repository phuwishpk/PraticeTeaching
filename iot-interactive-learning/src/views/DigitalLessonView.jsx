import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Binary } from 'lucide-react';
import { LessonSlideshow } from '../components/LessonContent';
import DigitalExamples from '../components/DigitalExamples';

// Every digital lesson in teaching order, so the arrows carry straight from one into the next.
const LESSON_TOUR = [
  { id: 4, label: '01 · รู้จัก 0 และ 1' },
  { id: 17, label: '02 · จำสถานะ' },
];

// An independent teaching preview; navigation here never changes the live classroom.
export default function DigitalLessonView() {
  const [phase, setPhase] = useState('examples');
  const index = LESSON_TOUR.findIndex(lesson => lesson.id === phase);
  return <div className="digital-lesson-view">
    <header className="digital-lesson-nav">
      <Link to="/host"><Binary size={24} aria-hidden="true" />IOT LAB<span>ห้องเรียน</span></Link>
      <nav aria-label="หัวข้อบทเรียน Digital">
        <button type="button" aria-pressed={phase === 'examples'} onClick={() => setPhase('examples')}>
          กดจำลองตัวอย่าง
        </button>
        {LESSON_TOUR.map(lesson => <button type="button" key={lesson.id} aria-pressed={phase === lesson.id}
          onClick={() => setPhase(lesson.id)}>{lesson.label}</button>)}
      </nav>
      <span>สื่อทดลองสำหรับการสอน</span>
    </header>
    <main>
      {phase === 'examples'
        ? <div className="digital-examples-page"><DigitalExamples /></div>
        : <LessonSlideshow key={phase} phase={phase}
          onPastEnd={index < LESSON_TOUR.length - 1 ? () => setPhase(LESSON_TOUR[index + 1].id) : undefined}
          onBeforeStart={index > 0 ? () => setPhase(LESSON_TOUR[index - 1].id) : undefined} />}
    </main>
  </div>;
}
