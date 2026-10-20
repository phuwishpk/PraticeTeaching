import { useReducer } from 'react';
import { Brain, Hand, Lightbulb, Power, RotateCcw, Siren, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  TOGGLE_STATES, alarmReducer, initialAlarm, initialToggle, sirenOn, toggleReducer,
} from '../content/chapterFourLabs';
import './DigitalLabs.css';
import PredictionCheck from './PredictionCheck';

function AlarmScene({ pir, siren }) {
  return <svg viewBox="0 0 820 280" className="lab-scene" data-sending={pir} aria-hidden="true">
    <path d="M40 232H780" stroke="#527082" strokeWidth="3" />
    <path d="M60 230V48H760V230" fill="#122735" stroke="#354f62" strokeWidth="3" />
    {/* PIR watching the doorway */}
    <g transform="translate(160 76)">
      <path d="M0 0L250 150H0Z" fill={pir ? '#91efbf1f' : '#7791b40a'}
        stroke={pir ? '#8becbf' : '#3d5765'} strokeDasharray="6 7" />
      <rect x="-34" y="-22" width="68" height="46" rx="12" fill="#dce6ed" />
      <circle r="15" fill={pir ? '#8becbf' : '#8ba5ba'} />
      <text x="0" y="-34" textAnchor="middle" className="lab-scene-label">PIR</text>
    </g>
    {/* Whoever set it off, and may already have left */}
    <g className="lab-person" transform={`translate(${pir ? 330 : 600} 0)`}
      stroke="#cfdbf8" strokeWidth="9" strokeLinecap="round" fill="none">
      <g transform="translate(0 130)">
        <circle cx="0" cy="-10" r="17" fill="#cfdbf8" stroke="none" />
        <path d="M0 18v52 M0 33l-24 27 M0 33l28 14 M0 70l-23 44 M0 70l30 40" />
      </g>
    </g>
    {/* The siren, which answers to the program and not to the pin */}
    <g transform="translate(660 120)">
      <rect x="-48" y="-50" width="96" height="108" rx="18"
        fill={siren ? '#cf685e' : '#34495d'} stroke={siren ? '#ffd1aa' : '#8195a9'} strokeWidth="3" />
      <circle r="28" fill="#152c3b" />
      <circle r="16" fill={siren ? '#ffcf8e' : '#6b829a'} />
      {siren && <g className="lab-siren-waves" stroke="#ffcf8e" fill="none" strokeWidth="4">
        <path d="M-66-30q-26 30 0 60 M66-30q26 30 0 60 M-84-46q-36 46 0 92 M84-46q36 46 0 92" />
      </g>}
      <text x="0" y="80" textAnchor="middle" className="lab-scene-label">ไซเรน</text>
    </g>
  </svg>;
}

function ToggleScene({ signal, latched }) {
  return <svg viewBox="0 0 820 280" className="lab-scene" aria-hidden="true">
    <path d="M40 236H780" stroke="#527082" strokeWidth="3" />
    {/* Three steps of a stairwell, lit or not */}
    {[0, 1, 2].map(step => <path key={step}
      d={`M${120 + step * 150} 236v-${54 + step * 34}h130v${54 + step * 34}`}
      fill={latched ? '#2c4a42' : '#1b3042'} stroke="#52708a" strokeWidth="3" />)}
    {/* The lamp on the wall */}
    <g transform="translate(660 92)">
      <circle className="lab-lamp-glow" r="76" fill="#ffe3a5" opacity={latched ? 0.14 : 0} />
      <path d="M-16 24C-62-20-28-56 0-56S62-20 16 24V42H-16Z"
        fill={latched ? '#ffe2a0' : '#334b61'} stroke={latched ? '#fff2cb' : '#8195a9'} strokeWidth="4" />
      <path d="M-18 32H18 M-18 42H18" stroke="#9bb1c1" strokeWidth="5" strokeLinecap="round" />
    </g>
    {/* The one button that does both jobs */}
    <g transform="translate(180 150)">
      <rect x="-52" y="-30" width="104" height="92" rx="16" fill="#263b50" stroke="#688294" strokeWidth="3" />
      <circle cy={signal ? 12 : 6} r="26" fill={signal ? '#8becbf' : '#99acc6'} className="lab-button-cap" />
      <text x="0" y="80" textAnchor="middle" className="lab-scene-label">ปุ่มกดเดียว</text>
    </g>
  </svg>;
}

export default function StateLab({ mode = 'alarm' }) {
  if (mode === 'toggle') return <ToggleMachine />;
  return <AlarmMachine />;
}

function AlarmMachine() {
  const [state, dispatch] = useReducer(alarmReducer, undefined, initialAlarm);
  const { pir, latched, remembers, log } = state;
  const siren = sirenOn(state);
  return <section className="digital-lab" aria-label="จำลองไซเรนที่จำสถานะ">
    <header className="lab-heading">
      <div>
        <span className="lab-kicker">STATE · ขากลับเป็น 0 แล้ว แต่ระบบยังจำได้</span>
        <h3>ตรวจพบการเคลื่อนไหว แล้วให้ขา PIR กลับเป็น LOW</h3>
        <p>ลองสลับระหว่างโปรแกรมที่จำสถานะกับโปรแกรมที่ไม่จำ แล้วดูว่าไซเรนต่างกันอย่างไร</p>
      </div>
      <button type="button" className="lab-reset" onClick={() => dispatch({ type: 'reset-all' })}>
        <RotateCcw size={18} aria-hidden="true" />เริ่มใหม่
      </button>
    </header>

    <div className="lab-modes" role="group" aria-label="เลือกแบบของโปรแกรม">
      <button type="button" aria-pressed={remembers} onClick={() => remembers || dispatch({ type: 'remembers' })}>
        <Brain size={18} aria-hidden="true" />โปรแกรมที่จำสถานะ (isAlarm)
      </button>
      <button type="button" aria-pressed={!remembers} onClick={() => remembers && dispatch({ type: 'remembers' })}>
        โปรแกรมที่ไม่จำสถานะ
      </button>
    </div>

    <PredictionCheck key={String(remembers)} question={`หลังตรวจพบการเคลื่อนไหว (HIGH) แล้วขา PIR กลับเป็น LOW โปรแกรมที่${remembers ? 'จำ' : 'ไม่จำ'}สถานะจะทำให้ไซเรนเป็นอย่างไร?`} options={[
      { id: 'on', label: 'ยังดังอยู่', correct: remembers, reason: remembers ? 'isAlarm ยังคงเป็น 1 จนกด Reset ลองทดลองด้านล่าง' : 'โปรแกรมนี้สั่งตามขา PIR โดยตรง ขาเป็น LOW จึงหยุดไซเรน' },
      { id: 'off', label: 'หยุดดัง', correct: !remembers, reason: remembers ? 'ขา PIR เป็น 0 แต่ isAlarm ยังเป็น 1 ลองดูสองค่านี้แยกกัน' : 'ถูกแล้ว โปรแกรมนี้ไม่มีสถานะค้างไว้ เมื่อขา LOW ไซเรนจึงหยุด' },
    ]} />
    <div className="lab-stage">
      <AlarmScene pir={pir} siren={siren} />
    </div>

    <div className="lab-control-row">
      <button type="button" className="lab-trigger" onClick={() => dispatch({ type: 'pir' })}>
        <Hand size={21} aria-hidden="true" />{pir ? 'ให้ขา PIR กลับเป็น LOW' : 'จำลองตรวจพบการเคลื่อนไหว'}
      </button>
      <button type="button" className="lab-trigger is-secondary" onClick={() => dispatch({ type: 'reset' })}>
        <Power size={21} aria-hidden="true" />กดปุ่ม Reset
      </button>
    </div>

    <div className="lab-variables" aria-live="polite">
      <div className={pir ? 'is-high' : ''}>
        <span>ขา PIR อ่านได้</span><strong>{Number(pir)}</strong><b>{pir ? 'HIGH' : 'LOW'}</b>
      </div>
      <div className={remembers ? (latched ? 'is-high' : '') : 'is-absent'}>
        <span>ตัวแปรในโปรแกรม</span>
        <strong>{remembers ? Number(latched) : '—'}</strong>
        <b>{remembers ? `isAlarm = ${Number(latched)}` : 'ไม่มีตัวแปรจำสถานะ'}</b>
      </div>
      <div className={siren ? 'is-alarm' : ''}>
        <span>ไซเรน</span><strong>{siren ? 'ดัง' : 'เงียบ'}</strong>
        <b><Siren size={16} aria-hidden="true" />{siren ? 'กำลังแจ้งเตือน' : 'ยังไม่แจ้งเตือน'}</b>
      </div>
    </div>

    <p className="lab-switch-note" role="status">
      {remembers
        ? latched && !pir
          ? 'ขา PIR กลับเป็น 0 แล้ว — แต่ isAlarm ยังเป็น 1 ไซเรนจึงดังต่อจนมีคนกด Reset'
          : latched
            ? 'ตรวจพบการเคลื่อนไหว isAlarm ถูกตั้งเป็น 1 ลองให้ขา PIR กลับเป็น LOW แล้วดูว่าไซเรนหยุดไหม'
            : 'สถานะเฝ้าระวัง isAlarm = 0 รอสัญญาณจาก PIR'
        : pir
          ? 'ไซเรนดังตามขา PIR ตรง ๆ'
          : 'พอขา PIR กลับเป็น 0 ไซเรนก็หยุดทันที — โปรแกรมไม่ได้เก็บสถานะการแจ้งเตือนไว้'}
    </p>

    {log.length > 0 && <ol className="lab-log" aria-label="ลำดับเหตุการณ์ที่ผ่านมา">
      {log.map((entry, index) => <li key={`${index}-${entry}`}>{entry}</li>)}
    </ol>}

    <div className="lab-key-idea"><Lightbulb size={22} aria-hidden="true" />
      <p><b>สถานะคือความจำของโปรแกรม</b><br />
        ขา PIR บอกค่าที่อ่านตอนนี้ ส่วน isAlarm จำว่าเคยตรวจพบการเคลื่อนไหวแล้ว</p>
    </div>
    <p className="lab-footnote">
      โมดูล PIR จริงมักค้างสถานะไว้ตามเวลาที่ตั้งบนบอร์ดก่อนกลับเป็น 0 แบบจำลองนี้เปลี่ยนทันทีเพื่อให้เห็นประเด็นเรื่องสถานะ
      PIR ตรวจการเคลื่อนไหว ไม่ได้ยืนยันว่ามีคนอยู่นิ่ง การกด Reset ขณะขา PIR ยัง HIGH จะตั้งเตือนใหม่ตามกติกาโปรแกรมนี้
    </p>
  </section>;
}

function ToggleMachine() {
  const [state, dispatch] = useReducer(toggleReducer, undefined, initialToggle);
  const { signal, latched, presses, history, outputHistory } = state;
  const stepWidth = 64;
  let path = `M60 ${history[0] ? 26 : 86}`;
  history.forEach((bit, index) => {
    if (index) path += `V${bit ? 26 : 86}`;
    path += `H${60 + (index + 1) * stepWidth}`;
  });
  return <section className="digital-lab" aria-label="จำลองไฟบันไดที่ใช้ปุ่มเดียว">
    <header className="lab-heading">
      <div>
        <span className="lab-kicker">STATE · ปุ่มเดียว สองความหมาย</span>
        <h3>กดปุ่มเดิมซ้ำ ๆ แล้วดูว่าไฟตัดสินใจจากอะไร</h3>
        <p>ปุ่มส่งสัญญาณเหมือนกันทุกครั้ง สิ่งที่ทำให้ผลต่างกันคือสถานะเดิมของไฟ</p>
      </div>
      <button type="button" className="lab-reset" onClick={() => dispatch({ type: 'reset' })}>
        <RotateCcw size={18} aria-hidden="true" />เริ่มใหม่
      </button>
    </header>

    <PredictionCheck question="เริ่มจากไฟดับ กดปุ่มหนึ่งครั้งแล้วปล่อย ไฟจะเป็นอย่างไร?" options={[
      { id: 'on', label: 'ยังติดอยู่', correct: true, reason: 'จังหวะกดสลับสถานะเป็นเปิด จังหวะปล่อยไม่สลับอีกครั้ง ลองดูกราฟปุ่มเทียบกับกราฟไฟ' },
      { id: 'off', label: 'ดับทันทีที่ปล่อย', correct: false, reason: 'นั่นคือโปรแกรมที่สั่งตามปุ่มตรง ๆ ตัวอย่างนี้จำสถานะไฟไว้หลังปล่อยปุ่ม' },
    ]} />
    <div className="lab-stage">
      <ToggleScene signal={signal} latched={latched} />
    </div>

    <div className="lab-control-row">
      <button type="button" className="lab-trigger" aria-pressed={signal} onClick={() => dispatch({ type: 'signal' })}>
        {signal ? <ToggleRight size={22} aria-hidden="true" /> : <ToggleLeft size={22} aria-hidden="true" />}
        {signal ? 'ปล่อยปุ่ม (สัญญาณกลับเป็น 0)' : 'กดปุ่ม (สัญญาณเป็น 1)'}
      </button>
      <p className="lab-switch-note" role="status">
        {signal
          ? 'ตอนนี้สัญญาณเป็น 1 — โปรแกรมสลับไฟไปแล้วตอน “ขอบขาขึ้น” การกดค้างต่อไม่ทำให้สลับซ้ำ'
          : presses === 0
            ? 'ยังไม่เคยกด ไฟอยู่ในสถานะเริ่มต้น'
            : 'ปล่อยแล้ว สัญญาณเป็น 0 แต่ไฟยังอยู่ในสถานะเดิม เพราะโปรแกรมจำไว้'}
      </p>
    </div>

    <div className="lab-variables" aria-live="polite">
      <div className={signal ? 'is-high' : ''}>
        <span>สัญญาณจากปุ่ม</span><strong>{Number(signal)}</strong><b>{signal ? 'กำลังกด' : 'ปล่อยอยู่'}</b>
      </div>
      <div className={latched ? 'is-high' : ''}>
        <span>สถานะที่จำไว้</span><strong>{Number(latched)}</strong><b>isOn = {Number(latched)}</b>
      </div>
      <div>
        <span>กดมาแล้ว</span><strong>{presses}</strong><b>ครั้ง</b>
      </div>
    </div>

    <div className="lab-state-diagram" aria-label={`แผนผังสถานะ ปัจจุบันคือ ${latched ? 'ไฟเปิด' : 'ไฟปิด'}`}>
      {TOGGLE_STATES.map((item, index) => <div key={item.id}
        className={`lab-state-node${Number(latched) === index ? ' is-current' : ''}`}>
        <b>{item.label}</b><span>{item.variable}</span>
      </div>)}
      <span className="lab-state-arrow" aria-hidden="true">กดปุ่ม ⇄ กดปุ่ม</span>
    </div>

    <p className="lab-note">อ่านสองกราฟตามช่องเดียวกัน: กราฟแรกคือปุ่ม กราฟที่สองคือไฟ เส้นประสีเหลืองคือจังหวะกด (0 → 1) ที่ทำให้ไฟสลับ</p>
    <svg viewBox="0 0 760 260" className="lab-trace" role="img"
      aria-label={`สัญญาณปุ่ม: ${history.join(', ')}; สถานะไฟในแต่ละช่อง: ${outputHistory.join(', ')}`}>
      <text x="60" y="18" className="lab-trace-level">ปุ่ม · Input</text>
      <text x="8" y="32" className="lab-trace-level">1</text>
      <text x="8" y="92" className="lab-trace-level">0</text>
      <path d="M60 26H700 M60 86H700" className="lab-trace-grid" />
      <path d={path} className="lab-trace-wave" />
      <text x="60" y="132" className="lab-trace-level">ไฟ · สถานะที่โปรแกรมจำ</text>
      <text x="8" y="151" className="lab-trace-level">1</text>
      <text x="8" y="211" className="lab-trace-level">0</text>
      <path d="M60 145H700 M60 205H700" className="lab-trace-grid" />
      <path d={`M60 ${outputHistory[0] ? 145 : 205}` + outputHistory.map((bit, i) => `${i ? `V${bit ? 145 : 205}` : ''}H${60 + (i + 1) * stepWidth}`).join('')}
        className="lab-trace-wave lab-output-wave" />
      {history.map((bit, i) => i > 0 && bit === 1 && history[i - 1] === 0 ? <path key={i}
        d={`M${60 + i * stepWidth} 22V218`} className="lab-edge-marker" /> : null)}
      <text x="60" y="245" className="lab-trace-level">หนึ่งช่องต่อเหตุการณ์กดหรือปล่อย · ไม่ใช่เวลาจริง</text>
    </svg>

    <div className="lab-key-idea"><Lightbulb size={22} aria-hidden="true" />
      <p><b>สัญญาณเดิม ผลต่างกัน เพราะสถานะต่างกัน</b><br />
        โปรแกรมไม่ได้ถามว่า “ปุ่มถูกกดไหม” อย่างเดียว แต่ถามว่า “ตอนนี้ไฟเปิดอยู่หรือปิดอยู่” ด้วย</p>
    </div>
    <p className="lab-footnote">
      ของจริงยังต้องกันสัญญาณเด้งตอนกด (debounce) ไม่ให้นับหนึ่งครั้งเป็นหลายครั้ง
      ซึ่งเป็นอีกเรื่องที่แยกจากการจำสถานะ แบบจำลองนี้ถือว่าสัญญาณสะอาดแล้ว
    </p>
  </section>;
}
