import { useEffect, useReducer } from 'react';
import { Check, Clock, Hand, Lightbulb, RotateCcw, Ruler, Waves } from 'lucide-react';
import {
  ECHO_US_PER_CM, TIMING_ERROR_US, TIMING_MAX_CM, TIMING_MIN_CM, TIMING_PRESETS, TIMING_STEPS,
  initialTiming, timingReading, timingReducer,
} from '../content/chapterFourLabs';
import './DigitalLabs.css';

// The object slides along this part of the floor, so one centimetre is always the same
// number of pixels in the picture and in the pulse underneath it.
const TRACK_START = 190;
const TRACK_END = 690;
const objectX = cm => TRACK_START + ((cm - TIMING_MIN_CM) / (TIMING_MAX_CM - TIMING_MIN_CM)) * (TRACK_END - TRACK_START);

function Scene({ cm, phase, sending }) {
  const x = objectX(cm);
  return <svg viewBox="0 0 820 260" className="lab-scene" data-sending={sending} aria-hidden="true">
    <path d="M30 206H790" stroke="#527082" strokeWidth="3" />
    {[120, 300, 480, 660].map(tick => <path key={tick} d={`M${tick} 206l-34 22`} stroke="#2b4455" strokeWidth="2" />)}
    {/* HC-SR04: one eye speaks, the other listens */}
    <g transform="translate(70 118)">
      <rect x="-32" y="-46" width="104" height="92" rx="12" fill="#22394c" stroke="#6d8a9d" strokeWidth="3" />
      <circle cx="4" cy="-14" r="20" fill="#0d1d28" stroke="#8fa8ba" strokeWidth="3" />
      <circle cx="4" cy="26" r="20" fill="#0d1d28" stroke="#8fa8ba" strokeWidth="3" />
      <circle cx="4" cy="-14" r="8" fill={phase === 1 ? '#9ee8c9' : '#3c5365'} />
      <circle cx="4" cy="26" r="8" fill={phase === 2 ? '#ffd98f' : '#3c5365'} />
      <text x="20" y="66" textAnchor="middle" className="lab-scene-label">HC-SR04</text>
    </g>
    {/* Sound on its way out, then on its way back */}
    <g className="lab-wave-group" opacity={phase === 3 ? 0.28 : 1}>
      {[0, 1, 2].map(ring => <path key={ring} className="lab-wave"
        d={`M${110 + ring * 26} 86q${22 + ring * 4} 32 0 64`} fill="none"
        stroke={phase === 2 ? '#ffd98f' : '#9ee8c9'} strokeWidth="4" strokeLinecap="round"
        style={{ animationDelay: `${ring * 0.18}s` }} />)}
    </g>
    {/* The thing being measured */}
    <g className="lab-target" transform={`translate(${x} 0)`}>
      <rect x="-26" y="86" width="52" height="120" rx="8" fill="#2d4f63" stroke="#a9c6d6" strokeWidth="3" />
      <path d="M-26 108H26 M-26 150H26" stroke="#6f93a8" strokeWidth="2" />
      <circle cx="0" cy="70" r="7" fill="#a9c6d6" />
    </g>
    {/* The distance, written where the class can see it */}
    <g className="lab-measure">
      <path d={`M90 236H${x}`} stroke="#9ee8c9" strokeWidth="2" strokeDasharray="7 6" />
      <path d="M90 228v16" stroke="#9ee8c9" strokeWidth="3" />
      <path d={`M${x} 228v16`} stroke="#9ee8c9" strokeWidth="3" />
      <text x={(90 + x) / 2} y="256" textAnchor="middle" className="lab-scene-measure">{cm} cm</text>
    </g>
  </svg>;
}

// One pulse, drawn to scale: the width is the measurement, not decoration.
function PulseTrace({ trueEcho, measuredEcho, sloppy }) {
  const perUs = 500 / (TIMING_MAX_CM * ECHO_US_PER_CM);
  const start = 150;
  const trueEnd = start + trueEcho * perUs;
  const measuredEnd = start + measuredEcho * perUs;
  return <svg viewBox="0 0 760 170" className="lab-trace" role="img"
    aria-label={`พัลส์ Echo กว้าง ${trueEcho} ไมโครวินาที${sloppy ? ` แต่บอร์ดจับเวลาได้ ${measuredEcho} ไมโครวินาที` : ''}`}>
    <text x="8" y="44" className="lab-trace-level">1 HIGH</text>
    <text x="8" y="126" className="lab-trace-level">0 LOW</text>
    <path d="M86 38H740 M86 120H740" className="lab-trace-grid" />
    <path d={`M86 120H${start}V38H${trueEnd}V120H740`} className="lab-trace-wave" />
    {sloppy && <path d={`M${trueEnd} 38H${measuredEnd}V120`} className="lab-trace-wave-error" />}
    <path d={`M${start} 148H${trueEnd}`} className="lab-trace-span" />
    <path d={`M${start} 142v12 M${trueEnd} 142v12`} className="lab-trace-span" />
    <text x={(start + trueEnd) / 2} y="166" textAnchor="middle" className="lab-trace-span-label">
      {trueEcho} µs
    </text>
  </svg>;
}

function DistanceControls({ cm, dispatch }) {
  return <div className="lab-control-row">
    <div className="lab-chips" role="group" aria-label="เลือกระยะของวัตถุ">
      {TIMING_PRESETS.map(preset => <button type="button" key={preset} aria-pressed={cm === preset}
        onClick={() => dispatch({ type: 'distance', cm: preset })}>{preset} cm</button>)}
    </div>
    <label className="lab-slider">
      <span><Ruler size={18} aria-hidden="true" />เลื่อนวัตถุเข้า–ออก</span>
      <input type="range" min={TIMING_MIN_CM} max={TIMING_MAX_CM} step="1" value={cm}
        onChange={event => dispatch({ type: 'distance', cm: event.target.value })} />
    </label>
  </div>;
}

export default function TimingLab({ mode = 'pulse' }) {
  const [state, dispatch] = useReducer(timingReducer, 60, initialTiming);
  const { cm, phase, sloppyTimer, threshold } = state;
  const { trueEcho, measuredEcho, reported, errorCm, nearBit } = timingReading(state);

  // Walk the measurement through its three steps so the class can watch the clock start
  // and stop, instead of seeing the answer appear at once.
  useEffect(() => {
    if (phase >= 3) return;
    const timer = setTimeout(() => dispatch({ type: 'advance' }), 900);
    return () => clearTimeout(timer);
  }, [phase, cm, sloppyTimer]);

  if (mode === 'compare') return <section className="digital-lab" aria-label="เทียบการอ่านแบบผ่าน/ไม่ผ่าน กับการวัดเวลา">
    <header className="lab-heading">
      <div>
        <span className="lab-kicker">DIGITAL ทั้งสองแบบ · ขาเดียวกัน ข้อมูลไม่เท่ากัน</span>
        <h3>เลื่อนวัตถุหนึ่งครั้ง ดูสองเซนเซอร์ตอบ</h3>
        <p>ทั้งสองขาส่งแต่ 0 กับ 1 แต่สิ่งที่บอร์ดได้รู้ต่างกันมาก</p>
      </div>
      <button type="button" className="lab-reset" onClick={() => dispatch({ type: 'reset' })}>
        <RotateCcw size={18} aria-hidden="true" />เริ่มใหม่
      </button>
    </header>
    <DistanceControls cm={cm} dispatch={dispatch} />
    <div className="lab-compare">
      <article className={nearBit ? 'is-active' : ''}>
        <h4>เซนเซอร์แบบมีเกณฑ์ (ขา DO)</h4>
        <p className="lab-compare-sub">ตอบได้แค่ว่าใกล้กว่าเกณฑ์หรือไม่</p>
        <div className="lab-bit-badge"><strong>{nearBit}</strong><b>{nearBit ? 'HIGH' : 'LOW'}</b></div>
        <p className="lab-compare-read">{nearBit ? 'ใกล้กว่าเกณฑ์' : 'ไกลกว่าเกณฑ์'}</p>
        <label className="lab-slider">
          <span>เกณฑ์ที่ตั้งไว้ · {threshold} cm</span>
          <input type="range" min={TIMING_MIN_CM} max={TIMING_MAX_CM} step="1" value={threshold}
            onChange={event => dispatch({ type: 'threshold', cm: event.target.value })} />
        </label>
        <p className="lab-note">ขยับวัตถุข้ามเกณฑ์ จะเห็นค่าพลิกทันที แต่ไม่ว่าจะอยู่ห่าง 60 หรือ 200 cm ค่าก็เป็น 0 เหมือนกัน</p>
      </article>
      <article className="is-active">
        <h4>Ultrasonic (ขา Echo)</h4>
        <p className="lab-compare-sub">ตอบเป็นความกว้างของพัลส์ แล้วแปลงเป็นระยะ</p>
        <div className="lab-bit-badge is-wide"><strong>{reported}</strong><b>cm</b></div>
        <p className="lab-compare-read">พัลส์กว้าง {trueEcho} µs</p>
        <PulseTrace trueEcho={trueEcho} measuredEcho={trueEcho} sloppy={false} />
        <p className="lab-note">ยังเป็นสัญญาณสองระดับเหมือนกัน แต่ข้อมูลอยู่ใน “เวลา” ไม่ใช่ในระดับ</p>
      </article>
    </div>
    <div className="lab-key-idea"><Check size={22} aria-hidden="true" />
      <p><b>ทั้งคู่เป็น Digital</b> ต่างกันที่ตัวแรกใช้ <b>ระดับ</b> บอกสถานะ ส่วนตัวที่สองใช้ <b>ความยาวของเวลา</b> บอกปริมาณ
        งานที่ต้องรู้ว่า “เท่าไร” จึงเลือกแบบที่สอง</p>
    </div>
    <p className="lab-footnote">เกณฑ์ของโมดูลจริงปรับด้วยตัวต้านทานบนบอร์ดหรือในโปรแกรม ตัวเลขในแบบจำลองนี้ตั้งขึ้นเพื่อการสอน</p>
  </section>;

  return <section className="digital-lab" aria-label="ห้องทดลองวัดระยะด้วยเวลาของสัญญาณ">
    <header className="lab-heading">
      <div>
        <span className="lab-kicker">DIGITAL TIMING · กดแล้วจับเวลา</span>
        <h3>ขยับวัตถุ แล้วดูพัลส์ยืดหรือหด</h3>
        <p>ขา Echo มีแค่ 0 กับ 1 แต่ “นานแค่ไหน” คือข้อมูลระยะทาง</p>
      </div>
      <button type="button" className="lab-reset" onClick={() => dispatch({ type: 'reset' })}>
        <RotateCcw size={18} aria-hidden="true" />เริ่มใหม่
      </button>
    </header>

    <DistanceControls cm={cm} dispatch={dispatch} />

    <div className="lab-stage">
      <Scene cm={cm} phase={phase} sending={phase < 3} />
      <button type="button" className="lab-trigger" onClick={() => dispatch({ type: 'measure' })}>
        <Waves size={22} aria-hidden="true" />ยิงคลื่นวัดอีกครั้ง
      </button>
    </div>

    <ol className="lab-steps" aria-label="ลำดับการวัด">
      {TIMING_STEPS.map((step, index) => <li key={step.id} data-current={phase === index + 1}>
        <span className="lab-step-number">{index + 1}</span>
        <div><b>{step.title}</b><p>{step.detail}</p></div>
      </li>)}
    </ol>

    <div className="lab-readout-row">
      <output className="lab-readout" aria-live="polite">
        <span><Clock size={17} aria-hidden="true" />เวลาที่ขา Echo เป็น HIGH</span>
        <strong>{phase < 3 ? '…' : measuredEcho}</strong><b>µs</b>
      </output>
      <div className="lab-formula" aria-hidden="true">÷ {ECHO_US_PER_CM} =</div>
      <output className="lab-readout is-answer" aria-live="polite">
        <span><Ruler size={17} aria-hidden="true" />ระยะที่บอร์ดสรุปได้</span>
        <strong>{phase < 3 ? '…' : reported}</strong><b>cm</b>
      </output>
    </div>

    <PulseTrace trueEcho={trueEcho} measuredEcho={measuredEcho} sloppy={sloppyTimer} />

    <div className="lab-switch-row">
      <button type="button" className="lab-switch" aria-pressed={sloppyTimer}
        onClick={() => dispatch({ type: 'sloppyTimer' })}>
        <Hand size={19} aria-hidden="true" />
        {sloppyTimer ? `กำลังใช้นาฬิกาที่ช้าไป ${TIMING_ERROR_US} µs` : `ลองใช้นาฬิกาที่ช้าไป ${TIMING_ERROR_US} µs`}
      </button>
      <p className="lab-switch-note" role="status">
        {sloppyTimer
          ? `ช้าไปครึ่งมิลลิวินาที บอร์ดรายงาน ${reported} cm ทั้งที่วัตถุอยู่ ${cm} cm — คลาด ${errorCm > 0 ? '+' : ''}${errorCm} cm`
          : 'นาฬิกาแม่น ค่าที่รายงานตรงกับระยะจริง'}
      </p>
    </div>

    <div className="lab-key-idea"><Lightbulb size={22} aria-hidden="true" />
      <p><b>เวลาเป็นข้อมูล จึงต้องจับเวลาให้แม่น</b><br />
        เสียงเดินทาง 1 cm ไป–กลับใช้เวลาเพียง {ECHO_US_PER_CM} µs ความคลาดในระดับไมโครวินาทีจึงกลายเป็นเซนติเมตรทันที</p>
    </div>
    <p className="lab-footnote">
      แบบจำลองนี้ชะลอแต่ละขั้นเพื่อการสอน ของจริงจบใน 1 ครั้งวัดไม่ถึงมิลลิวินาที ใช้ความเร็วเสียงประมาณ 343 m/s
      ซึ่งเปลี่ยนตามอุณหภูมิอากาศ และวัตถุผิวนุ่มหรือเอียงมากอาจสะท้อนคลื่นกลับไม่ถึงเซนเซอร์
    </p>
  </section>;
}
