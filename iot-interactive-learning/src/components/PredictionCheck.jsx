import { useState } from 'react';
import './PredictionCheck.css';

// An optional pause to predict and explain; it never prevents experimenting.
export default function PredictionCheck({ question, options }) {
  const [selected, setSelected] = useState(null);
  const answer = options.find(option => option.id === selected);
  return <section className="prediction-check" aria-label="ลองคิดก่อนทดลอง">
    <h4>ลองคิดก่อนทดลอง</h4>
    <p>{question}</p>
    <div className="prediction-options" role="group" aria-label={question}>
      {options.map(option => <button key={option.id} type="button"
        aria-pressed={selected === option.id} onClick={() => setSelected(option.id)}>
        {option.label}
      </button>)}
    </div>
    <p className="prediction-feedback" role="status">
      {answer ? `${answer.correct ? 'ถูกต้อง' : 'ลองคิดอีกครั้ง'} — ${answer.reason}` : 'เลือกคำตอบ แล้วใช้ตัวจำลองด้านล่างตรวจความคิดของตัวเอง'}
    </p>
  </section>;
}
