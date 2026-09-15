import { useEffect, useState } from 'react';
import { Moon, Sun, House, Lightbulb, ArrowRight, CircleCheck } from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { problemActivity, isProblemOption } from '../content/problemActivity';
import { answerProgress } from '../../shared/roomState';
import { getStudentName } from '../session';
import CountdownTimer from './CountdownTimer';
import './ProblemActivity.css';

function PlanSteps({ option }) {
  return <span className="problem-plan-steps">
    <span><small>ข้อมูลที่ใช้</small><strong>{option.input}</strong></span><ArrowRight aria-hidden="true" />
    <span><small>บอร์ดตรวจเงื่อนไข</small><strong>{option.condition}</strong></span><ArrowRight aria-hidden="true" />
    <span><small>ผลที่ต้องการ</small><strong>{option.output}</strong></span>
  </span>;
}

export default function ProblemActivity({ audience = 'student' }) {
  const { roomState, voteProblem, error, connected } = useRoom();
  const teacher = audience === 'teacher';
  const name = teacher ? null : getStudentName();
  const startTime = roomState.questionStartTime;
  const [expiredAt, setExpiredAt] = useState(() => Date.now() >= startTime + problemActivity.durationSeconds * 1000 ? startTime : null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const remaining = startTime + problemActivity.durationSeconds * 1000 - Date.now();
    const timeout = setTimeout(() => setExpiredAt(startTime), Math.max(0, remaining));
    return () => clearTimeout(timeout);
  }, [startTime]);

  const votes = Object.fromEntries(Object.entries(roomState.problemVotes || {}).filter(([, vote]) => isProblemOption(vote)));
  // Counted against the roster taken when the question opened, so a latecomer cannot
  // drag the class back out of the reveal.
  const { answered: total, total: students, allAnswered } = answerProgress(roomState, votes);
  const myVote = teacher ? undefined : votes[name];
  const expired = expiredAt === startTime;
  const revealed = expired || allAnswered;
  const answer = problemActivity.options.find(option => option.id === problemActivity.correctId);

  const submit = async id => {
    if (teacher || !name || myVote || submitting || revealed || !connected) return;
    setSubmitting(true);
    try { await voteProblem(id, name); } finally { setSubmitting(false); }
  };

  return <section className={`problem-activity ${teacher ? 'problem-teacher' : 'problem-student'}`} lang="th">
    <header className="problem-heading"><div><span>กิจกรรมในห้องเรียน · Multiple Choice · วิเคราะห์โจทย์</span><h1>{problemActivity.title}</h1></div><CountdownTimer startTime={startTime} duration={problemActivity.durationSeconds} size={64} stopped={allAnswered} /></header>
    <div className="problem-scenario"><p>{problemActivity.scenario}</p><div className="problem-scene-pair">
      <div className="problem-night"><Moon aria-hidden="true" /><House aria-hidden="true" /><Lightbulb aria-hidden="true" /><strong>มืด → ไฟเปิด</strong></div>
      <div className="problem-day"><Sun aria-hidden="true" /><House aria-hidden="true" /><Lightbulb aria-hidden="true" /><strong>สว่าง → ไฟปิด</strong></div>
    </div></div>
    <div className="problem-question"><h2>{problemActivity.question}</h2><p>คิดตาม 3 ขั้นในเนื้อหา: ระบุผลลัพธ์ → หาข้อมูลที่ต้องวัด → อธิบายเหตุผล</p><span role="status">{revealed ? (expired ? 'หมดเวลา' : 'ตอบครบแล้ว') : 'เปิดรับคำตอบ'} · {total} / {students} คน</span></div>
    <div className="problem-options" aria-label="ตัวเลือกแผนการทำงาน">{problemActivity.options.map(option => {
      const count = Object.values(votes).filter(vote => vote === option.id).length;
      const percentage = total ? Math.round(count / total * 100) : 0;
      const correct = option.id === problemActivity.correctId;
      const selected = myVote === option.id;
      const content = <><span className="problem-option-heading"><b>{option.letter}</b><span>{selected ? 'คำตอบของคุณ' : `แผน ${option.letter}`}</span>{revealed && correct && <span className="problem-correct-label"><CircleCheck size={18} aria-hidden="true" /> ตรงกับโจทย์</span>}</span><PlanSteps option={option} />{revealed && <span className="problem-result"><span>{count} คน · {percentage}%</span><span className="problem-result-track"><span style={{ width: `${percentage}%` }} /></span></span>}</>;
      const className = `problem-option${selected ? ' is-selected' : ''}${revealed && correct ? ' is-correct' : ''}`;
      return teacher ? <article className={className} key={option.id}>{content}</article> : <button type="button" className={className} key={option.id} disabled={Boolean(myVote) || submitting || revealed || !connected} aria-pressed={selected} onClick={() => submit(option.id)}>{content}</button>;
    })}</div>
    {!teacher && <div aria-live="polite">{submitting && <p>กำลังส่งคำตอบ…</p>}{myVote && !revealed && <p className="problem-wait">บันทึกคำตอบแล้ว ลองอธิบายว่าเลือกแผนนี้เพราะอะไร ระหว่างรอสรุปผล</p>}{!connected && <p role="alert">กำลังเชื่อมต่อห้องเรียน กรุณารอก่อนส่งคำตอบ</p>}{error && <p role="alert">{error}</p>}</div>}
    {revealed && <section className="problem-explanation" aria-label="เฉลยพร้อมเหตุผล">
      <h2>เฉลย: แผน {answer.letter} — วัดแสง แล้วสั่งไฟตามความมืด</h2>
      {!teacher && <p>{myVote ? (myVote === answer.id ? 'คุณเลือกแผนได้ตรงกับโจทย์' : 'ลองเทียบข้อมูลที่แผนของคุณวัด กับสิ่งที่โจทย์ต้องการรู้') : 'ยังไม่ได้ส่งคำตอบ ลองทบทวนเหตุผลต่อไปนี้'}</p>}
      <p>{problemActivity.explanation}</p>
      <div className="problem-reasons">{problemActivity.options.map(option => <details key={option.id}><summary>แผน {option.letter}: {option.id === answer.id ? 'ทำไมจึงตรงกับโจทย์' : 'ทำไมยังไม่ตรงกับโจทย์'}</summary><p>{option.reason}</p></details>)}</div>
      <p className="problem-prompt">ลองพูดให้ครบ: “ฉันเลือก… เพราะวัด… บอร์ดนำค่าไป… แล้วสั่ง… ให้…”</p>
      <p className="problem-note">ต้องทดลองวงจร LDR ก่อนว่าค่าเพิ่มหรือลดเมื่อแสงน้อย แล้วตั้งเกณฑ์ให้ตรงกับวงจรจริง</p>
      <strong>{problemActivity.takeaway}</strong>
    </section>}
  </section>;
}
