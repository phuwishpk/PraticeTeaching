import { useEffect, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { classroomChoiceActivities } from '../content/classroomChoiceActivities';
import CountdownTimer from './CountdownTimer';
import './ClassroomChoiceActivity.css';

export default function ClassroomChoiceActivity({ activityId, audience = 'student' }) {
  const { roomState, voteChoice, connected, error } = useRoom();
  const activity = classroomChoiceActivities[activityId];
  const teacher = audience === 'teacher';
  const name = teacher ? null : sessionStorage.getItem('student_name');
  const startTime = roomState.questionStartTime;
  const votes = roomState.choiceVotes?.[activityId] || {};
  const totalVotes = Object.keys(votes).length;
  const totalStudents = roomState.students.length;
  const myVote = teacher ? null : votes[name];
  const allAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const [expiredAt, setExpiredAt] = useState(() => Date.now() >= startTime + activity.durationSeconds * 1000 ? startTime : null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setExpiredAt(null);
    const remaining = startTime + activity.durationSeconds * 1000 - Date.now();
    if (remaining <= 0) { setExpiredAt(startTime); return undefined; }
    const timeout = setTimeout(() => setExpiredAt(startTime), remaining);
    return () => clearTimeout(timeout);
  }, [activity.durationSeconds, startTime]);

  const expired = expiredAt === startTime;
  const revealed = expired || allAnswered;

  const submit = async optionId => {
    if (teacher || !name || myVote || submitting || revealed || !connected) return;
    setSubmitting(true);
    try { await voteChoice(activityId, optionId, name); } finally { setSubmitting(false); }
  };

  return (
    <section className={`classroom-choice ${teacher ? 'is-teacher' : 'is-student'}`} lang="th">
      <header className="classroom-choice-heading">
        <div><span>กิจกรรม Multiple Choice</span><h1>{activity.title}</h1></div>
        <CountdownTimer startTime={startTime} duration={activity.durationSeconds} size={teacher ? 70 : 54} stopped={allAnswered} />
      </header>

      <div className="classroom-choice-question">
        <h2>{activity.question}</h2>
        <span role="status">{revealed ? (allAnswered ? 'ตอบครบแล้ว · หยุดเวลา' : 'หมดเวลา') : 'เปิดรับคำตอบ'} · {totalVotes} / {totalStudents} คน</span>
      </div>

      <div className="classroom-choice-options" aria-label="ตัวเลือกคำตอบ">
        {activity.options.map((option, index) => {
          const count = Object.values(votes).filter(vote => vote === option.id).length;
          const percentage = totalVotes ? Math.round(count / totalVotes * 100) : 0;
          const correct = option.id === activity.correctId;
          const selected = myVote === option.id;
          const content = <>
            <span className="classroom-choice-letter">{String.fromCharCode(65 + index)}</span>
            <span className="classroom-choice-icon" aria-hidden="true">{option.icon}</span>
            <span className="classroom-choice-copy"><strong>{option.label}</strong><small>{option.detail}</small></span>
            {revealed && correct && <CircleCheck className="classroom-choice-check" aria-label="คำตอบที่ถูกต้อง" />}
            {revealed && <span className="classroom-choice-result">{count} คน · {percentage}%</span>}
          </>;
          const className = `classroom-choice-option${selected ? ' is-selected' : ''}${revealed && correct ? ' is-correct' : ''}`;
          return teacher
            ? <article className={className} key={option.id}>{content}</article>
            : <button type="button" className={className} key={option.id} disabled={Boolean(myVote) || submitting || revealed || !connected} aria-pressed={selected} onClick={() => submit(option.id)}>{content}</button>;
        })}
      </div>

      {!teacher && <div className="classroom-choice-message" aria-live="polite">
        {submitting && <p>กำลังส่งคำตอบ…</p>}
        {myVote && !revealed && <p>บันทึกคำตอบแล้ว รอเพื่อนตอบให้ครบ</p>}
        {!connected && <p role="alert">กำลังเชื่อมต่อห้องเรียน</p>}
        {error && <p role="alert">{error}</p>}
      </div>}

      {revealed && <section className="classroom-choice-explanation">
        <h2>เฉลยพร้อมเหตุผล</h2><p>{activity.explanation}</p>
        <div className="classroom-choice-flow">{activity.flow.map((step, index) => <span key={step}>{index > 0 && <b>→</b>}<i>{step}</i></span>)}</div>
      </section>}

      <footer className="classroom-choice-objective"><strong>เป้าหมายของผู้เรียน</strong><span>{activity.objective}</span></footer>
    </section>
  );
}

