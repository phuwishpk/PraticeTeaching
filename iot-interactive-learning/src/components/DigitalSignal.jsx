import { useState } from 'react';
import { Binary, Check, Lightbulb, RotateCcw, ToggleLeft, ToggleRight } from 'lucide-react';
import { binaryValue } from '../content/signalMath.js';
import './DigitalSignal.css';
import DigitalExamples from './DigitalExamples';

const INITIAL = [0, 0, 1, 1, 0, 1, 0, 0];

function Trace({ bits, selected, onSelect, hideBits = false }) {
  const width = 640 / bits.length;
  let path = `M100 ${bits[0] ? 48 : 156}`;
  bits.forEach((bit, index) => {
    if (index) path += ` V${bit ? 48 : 156}`;
    path += ` H${100 + (index + 1) * width}`;
  });
  return <div className="digital-trace-wrap">
    <svg className="digital-trace" viewBox="0 0 780 205" role="img" aria-label={hideBits ? 'โจทย์อ่านกราฟ: LOW, HIGH, HIGH, LOW จากซ้ายไปขวา' : `กราฟลอจิกจากซ้ายไปขวา: ${bits.join(', ')}`}>
      {selected !== undefined && <rect x={100 + selected * width} y="22" width={width} height="153" rx="8" className="digital-trace-selection" />}
      <text x="12" y="47" className="digital-high-label">1</text><text x="42" y="47">HIGH</text>
      <text x="12" y="157" className="digital-low-label">0</text><text x="42" y="157">LOW</text>
      <path d="M100 48H750 M100 156H750" className="digital-grid" />
      {bits.map((bit, i) => <g key={i}>
        <path d={`M${100 + i * width} 24V175`} className="digital-grid" />
        <text x={100 + (i + .5) * width} y="112" textAnchor="middle" className="digital-trace-bit">{hideBits ? '?' : bit}</text>
      </g>)}
      <path d={path} className="digital-wave" />
      <text x="100" y="198">อ่านจากซ้าย</text><text x="740" y="198" textAnchor="end">ลำดับการอ่าน →</text>
    </svg>
    {onSelect && <div className="digital-sample-buttons" role="group" aria-label="เลือกช่องเพื่ออ่านค่ากราฟ">
      {bits.map((bit, i) => <button type="button" key={i} onClick={() => onSelect(i)} aria-pressed={selected === i} aria-label={`อ่านช่อง ${i + 1}: ${bit}`}><span>ช่อง {i + 1}</span><b>{bit}</b></button>)}
    </div>}
  </div>;
}

function StateCard({ value, label, children }) {
  return <div className={`digital-state-card ${value ? 'is-high' : 'is-low'}`}>
    <span>{label}</span><div className="digital-state-number"><strong>{value}</strong><b>{value ? 'HIGH' : 'LOW'}</b></div>{children}
  </div>;
}

export function DigitalIntro() {
  return <div className="digital-intro-art" aria-label="Digital แบบไบนารี ใช้ LOW เท่ากับ 0 และ HIGH เท่ากับ 1">
    <StateCard value={0} label="ระดับลอจิกต่ำ"><span>LOW</span></StateCard>
    <div className="digital-intro-center"><Binary size={38} aria-hidden="true" /><b>1 บิต</b><span>2 สถานะ</span></div>
    <StateCard value={1} label="ระดับลอจิกสูง"><span>HIGH</span></StateCard>
  </div>;
}

function QuickCheck() {
  const [answer, setAnswer] = useState(null);
  return <div className="digital-quick-check">
    <span className="digital-kicker">ลองอ่านด้วยตัวเอง</span><h3>กราฟนี้เป็นชุดบิตใด?</h3>
    <Trace bits={[0, 1, 1, 0]} hideBits />
    <div className="digital-actions" role="group" aria-label="คำตอบอ่านกราฟ">{['0110', '0101', '1001'].map(option => <button type="button" key={option} aria-pressed={answer === option} onClick={() => setAnswer(option)}>{option}</button>)}<button type="button" className="digital-reset" onClick={() => setAnswer(null)} aria-label="เริ่มคำถามใหม่"><RotateCcw size={20} />ลองใหม่</button></div>
    <p className="digital-feedback" role="status">{answer === null ? 'เริ่มจากซ้าย: อ่านระดับของแต่ละช่อง' : answer === '0110' ? 'ถูกต้อง! LOW → HIGH → HIGH → LOW = 0110' : 'ลองอีกครั้ง: สองช่องตรงกลางอยู่ที่ระดับ HIGH เหมือนกัน'}</p>
  </div>;
}

export default function DigitalSignal({ mode = 'levels' }) {
  if (mode === 'combined' || mode === 'sensor') return <DigitalExamples key={mode} initialScenario={mode === 'sensor' ? 'motion' : 'switch'} showScenarioPicker={false} />;
  return <DigitalSignalLab key={mode} mode={mode} />;
}

function DigitalSignalLab({ mode }) {
  const [history, setHistory] = useState(INITIAL);
  const [selected, setSelected] = useState(7);
  const [pressed, setPressed] = useState(false);
  const [bits, setBits] = useState([0, 1, 0, 1]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const current = history[history.length - 1];
  const send = bit => { setHistory(previous => [...previous.slice(-7), bit]); setSelected(7); };
  const reset = () => { setHistory(INITIAL); setSelected(7); setPressed(false); setBits([0, 1, 0, 1]); setShowAnswer(false); setResetCount(count => count + 1); };
  const titles = { levels: 'สร้างกราฟด้วย 0 และ 1', combined: 'กดปุ่ม แล้วตามดูสัญญาณ', polarity: 'ปุ่มเดียวกัน ทำไมอ่านได้ต่างกัน?', bits: 'แตะบิต แล้วประกอบเป็นตัวเลข', sensor: 'จากการเคลื่อนไหว → ข้อมูลหนึ่งบิต', check: 'อ่านกราฟเป็น ก็เข้าใจสัญญาณ' };
  return <section className="digital-studio" aria-label="ห้องทดลองสัญญาณ Digital">
    <header className="digital-studio-header"><div><span className="digital-kicker">DIGITAL LAB · ทดลองและสังเกต</span><h3>{titles[mode] || titles.levels}</h3></div><button type="button" className="digital-reset" onClick={reset}><RotateCcw size={20} aria-hidden="true" />เริ่มใหม่</button></header>
    {mode === 'bits' ? <>
      <p>แต่ละตำแหน่งมีน้ำหนักต่างกัน เลือกบิตที่เป็น <b>1</b> แล้วบวกน้ำหนักเข้าด้วยกัน</p>
      <div className="digital-bit-calculator"><div className="digital-bit-buttons">{bits.map((bit, index) => <button type="button" key={index} aria-label={`บิตน้ำหนัก ${2 ** (3 - index)}`} aria-pressed={Boolean(bit)} onClick={() => setBits(previous => previous.map((value, i) => i === index ? 1 - value : value))}><span>น้ำหนัก {2 ** (3 - index)}</span><strong>{bit}</strong><small>{bit ? 'นำมาบวก' : 'ไม่นำมาบวก'}</small></button>)}</div><output aria-live="polite" className="digital-decimal"><span>เลขฐานสิบ</span><strong>{binaryValue(bits)}</strong></output></div>
      <div className="digital-equation" aria-live="polite">{bits.map((bit, i) => <span key={i} className={bit ? 'is-high' : ''}>{i > 0 && <i> + </i>}{bit * 2 ** (3 - i)}</span>)}<b> = {binaryValue(bits)}</b></div>
      <div className="digital-challenge"><Lightbulb aria-hidden="true" /><p>โจทย์ชวนคิด: ทำให้ได้เลข <b>6</b></p><button type="button" onClick={() => setShowAnswer(!showAnswer)} aria-expanded={showAnswer}>{showAnswer ? 'ซ่อนแนวคิด' : 'ดูแนวคิด'}</button></div>
      {showAnswer && <p className="digital-feedback">เปิดบิตน้ำหนัก 4 และ 2 → 0110₂ = 4 + 2 = 6</p>}
      <p className="digital-caption">4 บิต = 16 รูปแบบ แทนจำนวนเต็มไม่ติดเครื่องหมาย 0–15 ตัวอย่างนี้สอนเลขฐานสอง ไม่ใช่แพ็กเก็ตจริงของ DHT11</p>
    </> : mode === 'polarity' ? <>
      <div className="digital-actions"><button type="button" className="digital-primary" aria-pressed={pressed} onClick={() => setPressed(!pressed)}>{pressed ? <ToggleRight /> : <ToggleLeft />}{pressed ? 'กำลังกด · แตะเพื่อปล่อย' : 'ยังไม่กด · แตะเพื่อกด'}</button><span>สังเกตค่าของทั้งสองวงจร</span></div>
      <div className="digital-polarity" aria-live="polite"><StateCard value={pressed ? 1 : 0} label="วงจร A · Active-high"><p>กด = 1 / ปล่อย = 0</p><span>แรงดันจำลอง {pressed ? '3.3' : '0'} V</span></StateCard><StateCard value={pressed ? 0 : 1} label="วงจร B · Active-low"><p>กด = 0 / ปล่อย = 1</p><span>แรงดันจำลอง {pressed ? '0' : '3.3'} V</span></StateCard></div>
      <div className="digital-key-idea"><Check aria-hidden="true" /><p><b>0 ไม่ได้แปลว่าปิดเสมอไป</b><br />ต้องรู้การต่อวงจร ก่อนแปลความหมายของบิต</p></div>
      <p className="digital-caption">0 V / 3.3 V เป็นแรงดันขาสัญญาณอุดมคติในตัวอย่าง ช่วงแรงดัน LOW/HIGH จริงขึ้นกับอุปกรณ์</p>
    </> : mode === 'check' ? <QuickCheck key={resetCount} /> : <>
      <div className="digital-level-console"><div><span className="digital-kicker">01 · เลือกส่งค่าทีละบิต</span><div className="digital-actions"><button type="button" className="digital-send-low" onClick={() => send(0)}><b>0</b><span>ส่ง LOW</span></button><button type="button" className="digital-send-high" onClick={() => send(1)}><b>1</b><span>ส่ง HIGH</span></button></div></div><output className="digital-current" aria-live="polite"><span>ค่าล่าสุด</span><strong>{current}</strong><b>{current ? 'HIGH' : 'LOW'}</b></output></div>
      <div className="digital-chart-heading"><span className="digital-kicker">02 · อ่านกราฟจากซ้ายไปขวา</span><span>ขวาสุด = ค่าล่าสุด</span></div>
      <Trace bits={history} selected={selected} onSelect={setSelected} />
      <p className="digital-selected" aria-live="polite">ช่องที่ <b>{selected + 1}</b> อ่านได้ <b>{history[selected]} · {history[selected] ? 'HIGH' : 'LOW'}</b></p>
      <div className="digital-key-idea"><Lightbulb aria-hidden="true" /><p>ลองส่ง <b>1 → 1</b> ติดกัน: กราฟยังอยู่ที่ HIGH <b>ไม่ได้เพิ่มเป็น 2</b></p></div>
      <p className="digital-caption">กราฟลอจิกอุดมคติ: หนึ่งช่องคือหนึ่งครั้งที่ส่งค่า ไม่ใช่ช่วงเวลาที่เท่ากันของวงจรจริง อ่านได้ 0 ไม่ได้หมายความว่าบอร์ดไม่มีไฟเลี้ยง</p>
    </>}
  </section>;
}
