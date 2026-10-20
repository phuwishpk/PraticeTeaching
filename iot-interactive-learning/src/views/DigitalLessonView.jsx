import { Link, useSearchParams } from 'react-router-dom';
import { Binary } from 'lucide-react';
import LessonContent, { LessonSlideshow } from '../components/LessonContent';
import DigitalExamples from '../components/DigitalExamples';

const LESSON_TOUR = [
  { id: 'examples', label: 'ทดลองใกล้ตัว' },
  { id: '4', label: '0/1 และอ่านกราฟ' },
  { id: '12', label: 'หลายบิตเป็นตัวเลข' },
  // { id: '17', label: 'จำสถานะ' }, // ซ่อนเนื้อหาจำสถานะตามคำขอ
  { id: '18', label: 'สรุปทบทวน' },
];

// URL topics can be bookmarked or shared without changing the live classroom.
export default function DigitalLessonView() {
  const [params, setParams] = useSearchParams();
  const phase = LESSON_TOUR.some(lesson => lesson.id === params.get('topic')) ? params.get('topic') : 'examples';
  const reading = params.get('view') === 'read';
  const index = LESSON_TOUR.findIndex(lesson => lesson.id === phase);
  const changeTopic = id => setParams({ topic: id, ...(reading ? { view: 'read' } : {}) });
  return <div className="digital-lesson-view" lang="th">
    <a className="digital-skip-link" href="#digital-main">ข้ามไปเนื้อหา</a>
    <header className="digital-lesson-nav">
      <Link to="/host"><Binary size={24} aria-hidden="true" />IOT LAB<span>ห้องเรียน</span></Link>
      <nav aria-label="หัวข้อบทเรียน Digital">
        {LESSON_TOUR.map((lesson, i) => <button type="button" key={lesson.id}
          aria-current={phase === lesson.id ? 'step' : undefined} aria-pressed={phase === lesson.id}
          onClick={() => changeTopic(lesson.id)}>{i + 1}. {lesson.label}</button>)}
      </nav>
    </header>
    <div className="digital-study-tools">
      <p>หัวข้อ {index + 1} / {LESSON_TOUR.length} · เลือกหัวข้อได้เลย หรือเรียนตามลำดับ</p>
      {phase !== 'examples' && <div role="group" aria-label="รูปแบบการอ่าน">
        <button type="button" aria-pressed={!reading} onClick={() => setParams({ topic: phase })}>ทีละหน้า</button>
        <button type="button" aria-pressed={reading} onClick={() => setParams({ topic: phase, view: 'read' })}>อ่านต่อเนื่อง</button>
      </div>}
    </div>
    <main id="digital-main" tabIndex={-1}>
      {phase === 'examples'
        ? <div className="digital-examples-page"><DigitalExamples /></div>
        : reading
          ? <div className="digital-reading-page" key={phase}><LessonContent phase={Number(phase)} /></div>
          : <LessonSlideshow key={phase} phase={Number(phase)}
            onPastEnd={index < LESSON_TOUR.length - 1 ? () => changeTopic(LESSON_TOUR[index + 1].id) : undefined}
            onBeforeStart={index > 0 ? () => changeTopic(LESSON_TOUR[index - 1].id) : undefined} />}
    </main>
    <nav className="digital-topic-footer" aria-label="เปลี่ยนหัวข้อ">
      <button type="button" disabled={index === 0} onClick={() => changeTopic(LESSON_TOUR[index - 1].id)}>← หัวข้อก่อนหน้า</button>
      <span>{LESSON_TOUR[index].label}</span>
      <button type="button" disabled={index === LESSON_TOUR.length - 1} onClick={() => changeTopic(LESSON_TOUR[index + 1].id)}>หัวข้อถัดไป →</button>
    </nav>
  </div>;
}
