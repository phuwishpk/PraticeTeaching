import { useEffect, useReducer } from 'react';
import { AlertTriangle, Check, Hash, Network, RotateCcw, StepForward, X } from 'lucide-react';
import {
  I2C_DEVICES, I2C_EMPTY_ADDRESS, I2C_FRAME_STEPS, addressBits, busReducer, busResponders,
  deviceName, effectiveAddress, hexAddress, initialBus,
} from '../content/chapterFourLabs';
import './DigitalLabs.css';

const DEVICE_X = [250, 450, 650];

function Bus({ called, duplicate, phase, responders }) {
  const answered = responders.length === 1;
  return <svg viewBox="0 0 820 300" className="lab-scene" data-sending={phase < 3} aria-hidden="true">
    {/* The board that starts every conversation */}
    <g transform="translate(60 92)">
      <rect x="-30" y="-40" width="118" height="116" rx="14" fill="#22394c" stroke="#6d8a9d" strokeWidth="3" />
      <rect x="-6" y="-16" width="70" height="68" rx="8" fill="#0d1d28" stroke="#8fa8ba" strokeWidth="3" />
      <text x="29" y="24" textAnchor="middle" className="lab-scene-label">บอร์ด</text>
      <text x="29" y="96" textAnchor="middle" className="lab-scene-label">Master</text>
    </g>
    {/* Two wires, shared by everybody */}
    <path d="M148 86H770" className="lab-bus-line" />
    <path d="M148 140H770" className="lab-bus-line" />
    <text x="782" y="91" className="lab-scene-label">SDA</text>
    <text x="782" y="145" className="lab-scene-label">SCL</text>
    {/* The address travelling down the shared wire */}
    {phase < 3 && <circle className="lab-bus-packet" cy="86" r="11" fill="#9ee8c9" />}
    {I2C_DEVICES.map((device, index) => {
      const address = effectiveAddress(device, duplicate);
      const match = address === called;
      const x = DEVICE_X[index];
      return <g key={device.id} transform={`translate(${x} 170)`}>
        <path d="M0 -30V-84" stroke={match && phase >= 2 ? '#9ee8c9' : '#49617a'} strokeWidth="3" />
        <rect x="-74" y="-30" width="148" height="92" rx="14"
          fill={match && phase >= 3 ? '#1f4a3f' : '#1b3245'}
          stroke={match && phase >= 2 ? '#9ee8c9' : '#5f7891'} strokeWidth="3" />
        <text x="0" y="0" textAnchor="middle" className="lab-scene-address">{hexAddress(address)}</text>
        <text x="0" y="28" textAnchor="middle" className="lab-scene-label">{device.short}</text>
        <text x="0" y="50" textAnchor="middle" className="lab-scene-label">{device.model}</text>
        {phase >= 2 && <g transform="translate(58 -42)">
          <circle r="15" fill={match ? '#9ee8c9' : '#30465b'} />
          <text y="6" textAnchor="middle" className="lab-scene-tick">{match ? '✓' : '—'}</text>
        </g>}
      </g>;
    })}
    {phase >= 3 && !answered && <text x="410" y="268" textAnchor="middle" className="lab-scene-silent">
      {responders.length === 0 ? 'ไม่มีใครตอบ — บอร์ดได้แต่ความเงียบ' : 'สองตัวตอบพร้อมกัน — ข้อมูลชนกัน'}
    </text>}
  </svg>;
}

// The same transaction, one beat at a time: a protocol is an order agreed in advance.
function Frame({ called, frameStep, dispatch, responder }) {
  const bits = addressBits(called);
  const step = I2C_FRAME_STEPS[frameStep];
  return <div className="lab-frame">
    <div className="lab-frame-track" role="group" aria-label="ขั้นตอนบนสายสัญญาณ">
      {I2C_FRAME_STEPS.map((item, index) => <button type="button" key={item.id}
        aria-pressed={frameStep === index} onClick={() => dispatch({ type: 'frameStep', index })}>
        <span>{index + 1}</span>{item.label}
      </button>)}
    </div>
    <div className="lab-frame-detail" aria-live="polite">
      <b>{step.label}</b>
      <p>{step.detail}</p>
      {step.id === 'address' && <div className="lab-bit-strip" aria-label={`ที่อยู่ ${hexAddress(called)} เป็นเลขฐานสอง ${bits.join('')}`}>
        {bits.map((bit, index) => <span key={index} className={bit ? 'is-high' : ''}>{bit}</span>)}
        <em>{hexAddress(called)}</em>
      </div>}
      {step.id === 'ack' && <p className="lab-frame-answer">
        {responder ? `${deviceName(responder)} ดึงสายลงหนึ่งจังหวะ = ACK` : 'ไม่มีอุปกรณ์ที่อยู่นี้ สายจึงถูกปล่อยสูงไว้ = NACK'}
      </p>}
      {step.id === 'data' && <p className="lab-frame-answer">
        {responder ? `${responder.bytes} → ${responder.answer}` : 'ไม่มีข้อมูลให้ถอดรหัส'}
      </p>}
    </div>
    <button type="button" className="lab-trigger is-compact" onClick={() => dispatch({ type: 'frameNext' })}>
      <StepForward size={19} aria-hidden="true" />จังหวะถัดไป
    </button>
  </div>;
}

export default function ProtocolLab({ mode = 'bus' }) {
  const [state, dispatch] = useReducer(busReducer, I2C_DEVICES[0].address, initialBus);
  const { called, phase, duplicate, frameStep } = state;
  const responders = busResponders(called, duplicate);
  const responder = responders.length === 1 ? responders[0] : null;

  useEffect(() => {
    if (phase >= 3) return;
    const timer = setTimeout(() => dispatch({ type: 'advance' }), 850);
    return () => clearTimeout(timer);
  }, [phase, called, duplicate]);

  if (mode === 'frame') return <section className="digital-lab" aria-label="ไล่ดูบิตบนสายสัญญาณ I2C">
    <header className="lab-heading">
      <div>
        <span className="lab-kicker">PROTOCOL · ข้อตกลงว่าบิตไหนมาก่อน</span>
        <h3>กดไล่ดูทีละจังหวะ บนสายเส้นเดิม</h3>
        <p>โปรโตคอลคือการตกลงลำดับไว้ล่วงหน้า ทั้งสองฝ่ายจึงถอดความหมายตรงกัน</p>
      </div>
      <button type="button" className="lab-reset" onClick={() => dispatch({ type: 'reset' })}>
        <RotateCcw size={18} aria-hidden="true" />เริ่มใหม่
      </button>
    </header>
    <div className="lab-chips" role="group" aria-label="เลือกอุปกรณ์ที่จะคุยด้วย">
      {I2C_DEVICES.map(device => <button type="button" key={device.id} aria-pressed={called === device.address}
        onClick={() => dispatch({ type: 'call', address: device.address })}>
        {hexAddress(device.address)} · {device.short}
      </button>)}
      <button type="button" aria-pressed={called === I2C_EMPTY_ADDRESS}
        onClick={() => dispatch({ type: 'call', address: I2C_EMPTY_ADDRESS })}>
        {hexAddress(I2C_EMPTY_ADDRESS)} · ไม่มีอุปกรณ์
      </button>
    </div>
    <Frame called={called} frameStep={frameStep} dispatch={dispatch} responder={responder} />
    <div className="lab-compare">
      <article className="is-active">
        <h4><Network size={19} aria-hidden="true" />I2C</h4>
        <p className="lab-compare-sub">สาย SDA + SCL สองเส้น ต่อพ่วงได้หลายตัว</p>
        <p className="lab-note">เรียกด้วย <b>Address</b> ก่อนทุกครั้ง จึงแยกได้ว่าคุยกับใคร และต้องไม่มีใครใช้ที่อยู่ซ้ำกัน</p>
      </article>
      <article>
        <h4><Hash size={19} aria-hidden="true" />UART</h4>
        <p className="lab-compare-sub">สาย TX ↔ RX ไขว้กัน คุยกันทีละคู่</p>
        <p className="lab-note">ไม่มี Address เพราะมีกันอยู่สองฝ่าย แต่ต้องตั้ง <b>baud rate</b> ให้ตรงกัน ไม่ตรงก็อ่านเป็นอักขระเพี้ยน</p>
      </article>
    </div>
    <p className="lab-footnote">
      ที่อยู่ในแบบจำลองเป็นค่าที่พบบ่อยของโมดูลเหล่านี้ ของจริงบางรุ่นเลือกที่อยู่ได้ด้วยการบัดกรีจัมเปอร์
      ภาพนี้อธิบายลำดับการสื่อสาร ไม่ใช่ผังต่อวงจร และยังละรายละเอียดอย่างสัญญาณ clock stretching ไว้
    </p>
  </section>;

  return <section className="digital-lab" aria-label="จำลองการเรียกอุปกรณ์บนสาย I2C">
    <header className="lab-heading">
      <div>
        <span className="lab-kicker">I2C · สายสองเส้น หลายอุปกรณ์</span>
        <h3>กดเลือกว่าจะคุยกับใคร แล้วดูว่าใครตอบ</h3>
        <p>ทุกตัวได้ยินทุกคำ แต่ตอบเฉพาะตัวที่ถูกเรียกชื่อ</p>
      </div>
      <button type="button" className="lab-reset" onClick={() => dispatch({ type: 'reset' })}>
        <RotateCcw size={18} aria-hidden="true" />เริ่มใหม่
      </button>
    </header>

    <div className="lab-chips" role="group" aria-label="เลือกที่อยู่ที่บอร์ดจะเรียก">
      {I2C_DEVICES.map(device => <button type="button" key={device.id}
        aria-pressed={called === effectiveAddress(device, duplicate)}
        onClick={() => dispatch({ type: 'call', address: effectiveAddress(device, duplicate) })}>
        เรียก {hexAddress(effectiveAddress(device, duplicate))}
      </button>)}
      <button type="button" aria-pressed={called === I2C_EMPTY_ADDRESS}
        onClick={() => dispatch({ type: 'call', address: I2C_EMPTY_ADDRESS })}>
        เรียก {hexAddress(I2C_EMPTY_ADDRESS)} (ไม่มีใครอยู่)
      </button>
    </div>

    <div className="lab-stage">
      <Bus called={called} duplicate={duplicate} phase={phase} responders={responders} />
    </div>

    <ol className="lab-steps" aria-label="ลำดับการสื่อสาร">
      <li data-current={phase === 1}>
        <span className="lab-step-number">1</span>
        <div><b>บอร์ดส่งที่อยู่</b><p>{hexAddress(called)} ออกไปบนสาย SDA ที่ทุกตัวต่อร่วมกัน</p></div>
      </li>
      <li data-current={phase === 2}>
        <span className="lab-step-number">2</span>
        <div><b>ทุกตัวเทียบที่อยู่ของตัวเอง</b><p>ตรงก็รับไว้ ไม่ตรงก็เงียบและไม่ต้องทำอะไร</p></div>
      </li>
      <li data-current={phase === 3}>
        <span className="lab-step-number">3</span>
        <div><b>ตัวที่ถูกเรียกตอบกลับ</b><p>{responder ? `${responder.job}` : 'ไม่มีใครตอบในรอบนี้'}</p></div>
      </li>
    </ol>

    <output className="lab-answer" aria-live="polite">
      {responder
        ? <><Check size={22} aria-hidden="true" /><div><b>{deviceName(responder)} ตอบรับ (ACK)</b>
          <p>ส่งกลับ {responder.bytes} → บอร์ดถอดได้ <strong>{responder.answer}</strong></p></div></>
        : responders.length === 0
          ? <><X size={22} aria-hidden="true" /><div><b>ไม่มีอุปกรณ์ที่อยู่ {hexAddress(called)}</b>
            <p>สายเงียบ (NACK) โปรแกรมที่ดีต้องตรวจตรงนี้ ไม่ใช่เชื่อว่ามีค่ากลับมาเสมอ</p></div></>
          : <><AlertTriangle size={22} aria-hidden="true" /><div><b>มีสองตัวใช้ที่อยู่ {hexAddress(called)}</b>
            <p>ทั้งคู่ตอบพร้อมกันบนสายเส้นเดียว ข้อมูลทับกันจนบอร์ดอ่านค่าเพี้ยน</p></div></>}
    </output>

    <div className="lab-switch-row">
      <button type="button" className="lab-switch" aria-pressed={duplicate}
        onClick={() => dispatch({ type: 'duplicate' })}>
        <AlertTriangle size={19} aria-hidden="true" />
        {duplicate ? 'กำลังตั้งให้ที่อยู่ซ้ำกัน' : 'ลองตั้งให้สองตัวใช้ที่อยู่เดียวกัน'}
      </button>
      <p className="lab-switch-note" role="status">
        {duplicate
          ? `SHT31 ถูกย้ายไปใช้ ${hexAddress(I2C_DEVICES[0].address)} ซ้ำกับเซนเซอร์แสง — ลองเรียกที่อยู่นั้นดู`
          : 'ที่อยู่ไม่ซ้ำกัน บอร์ดจึงเจาะจงคุยกับตัวที่ต้องการได้'}
      </p>
    </div>

    <div className="lab-key-idea"><Check size={22} aria-hidden="true" />
      <p><b>ที่อยู่คือเหตุผลที่ต่อพ่วงได้</b><br />
        สายไม่ได้เพิ่มขึ้นตามจำนวนอุปกรณ์ สิ่งที่ต้องไม่ซ้ำกันคือบ้านเลขที่ ไม่ใช่เส้นสาย</p>
    </div>
    <p className="lab-footnote">
      ที่อยู่ที่ใช้เป็นค่าที่พบบ่อยของโมดูลเหล่านี้ ภาพแสดงหลักการสื่อสาร ไม่ใช่ผังต่อวงจร
      และชะลอจังหวะเพื่อการสอน ของจริงรับส่งจบในเสี้ยวมิลลิวินาที
    </p>
  </section>;
}
