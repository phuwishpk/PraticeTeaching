import { useId, useState } from 'react';
import { Sun, Sprout, ArrowRight, Binary, SlidersHorizontal } from 'lucide-react';
import './SignalGraphics.css';
import { adcCode, binaryValue } from '../content/signalMath.js';

const HIGH_Y = 42;
const LOW_Y = 152;

function DigitalTrace({ bits }) {
  const width = 440 / bits.length;
  let path = `M 72 ${bits[0] ? HIGH_Y : LOW_Y}`;
  bits.forEach((bit, index) => {
    if (index) path += ` V ${bit ? HIGH_Y : LOW_Y}`;
    path += ` H ${72 + (index + 1) * width}`;
  });
  return <svg className="signal-chart" viewBox="0 0 550 205" role="img" aria-label={`กราฟดิจิทัลสองระดับ เรียงจากซ้ายไปขวา: ${bits.join(', ')}`}>
    <text x="6" y="47">1 HIGH</text><text x="6" y="157">0 LOW</text>
    <path className="signal-grid" d="M72 42H520 M72 152H520" />
    <path className="signal-axis" d="M72 22V173H525" />
    {bits.map((bit, index) => <text className="signal-bit-label" key={index} x={72 + (index + .5) * width} y="104" textAnchor="middle">{bit}</text>)}
    <path className="signal-line digital-line" d={path} />
    <text x="78" y="196">ก่อนหน้า</text><text x="517" y="196" textAnchor="end">ลำดับการอ่าน →</text>
  </svg>;
}

export function DigitalSignal({ mode = 'levels' }) {
  const [history, setHistory] = useState([0, 0, 1, 1, 0, 1, 0, 0]);
  const [pressed, setPressed] = useState(false);
  const [bits, setBits] = useState([0, 1, 0, 1]);
  const current = history[history.length - 1];
  const decimal = binaryValue(bits);
  return <section className="signal-lab digital-lab" aria-label="กราฟิก Digital">
    <header className="signal-heading"><Binary aria-hidden="true" /><div><span>DIGITAL · ระดับลอจิก</span><h3>{mode === 'bits' ? 'หลายบิต รวมกันเป็นตัวเลข' : mode === 'polarity' ? 'กดปุ่มเหมือนกัน แต่รหัสอาจต่างกัน' : 'สองระดับที่แยกจากกันชัดเจน'}</h3></div></header>
    {mode === 'bits' ? <>
      <p>แตะแต่ละบิตเพื่อเปลี่ยน 0 ↔ 1 แล้วดูว่าค่าตัวเลขเปลี่ยนอย่างไร</p>
      <div className="bit-calculator">
        <div className="bit-buttons">{bits.map((bit, index) => <button key={index} type="button" aria-label={`บิตน้ำหนัก ${2 ** (3 - index)}`} aria-pressed={Boolean(bit)} onClick={() => setBits(bits.map((value, i) => i === index ? 1 - value : value))}><small>× {2 ** (3 - index)}</small><strong>{bit}</strong></button>)}</div>
        <output className="decimal-result" aria-live="polite"><small>เลขฐานสิบ</small><strong>{decimal}</strong></output>
      </div>
      <DigitalTrace bits={bits} />
      <p className="signal-note">4 บิตแทนได้ 16 ค่า ตั้งแต่ 0–15 แต่ละบิตยังมีแค่ 0 หรือ 1 ตัวอย่างนี้อธิบายเลขฐานสอง ไม่ใช่รูปแบบข้อมูลจริงของ DHT11</p>
    </> : mode === 'polarity' ? <>
      <button type="button" className="signal-toggle" aria-pressed={pressed} onClick={() => setPressed(!pressed)}>{pressed ? 'กำลังกด — แตะเพื่อปล่อย' : 'ยังไม่กด — แตะเพื่อกดปุ่ม'}</button>
      <div className="polarity-grid" aria-live="polite"><div><span>วงจร active-high</span><strong>{pressed ? 1 : 0}</strong><p>กด = HIGH · ปล่อย = LOW</p></div><div><span>วงจร active-low</span><strong>{pressed ? 0 : 1}</strong><p>กด = LOW · ปล่อย = HIGH</p></div></div>
      <p className="signal-note">ทั้งสองวงจรยังเป็น Digital เหมือนกัน ต้องดูการต่อวงจรเพื่อรู้ว่า 0 หรือ 1 หมายถึง “กด”</p>
    </> : <>
      <div className="digital-controls">
        <div role="group" aria-label="เพิ่มสถานะในกราฟ" className="signal-button-group">{[0, 1].map(bit => <button type="button" key={bit} onClick={() => setHistory(previous => [...previous.slice(-7), bit])}>ส่ง {bit} · {bit ? 'HIGH' : 'LOW'}</button>)}</div>
        <output className="logic-readout" aria-live="polite"><span>ค่าล่าสุด</span><strong>{current}</strong><span>{current ? 'HIGH' : 'LOW'}</span></output>
      </div>
      <DigitalTrace bits={history} />
      <div className="signal-insight"><span className="binary-token">0</span><span>หรือ</span><span className="binary-token">1</span><p>อ่านเป็นสองสถานะ<br /><b>ไม่มีสถานะลอจิก 0.5 ในตัวอย่างนี้</b></p></div>
      <p className="signal-note">กดส่งค่าแล้วกราฟจะเลื่อนไปทีละช่อง เป็นภาพอุดมคติของสถานะลอจิก ไม่ใช่กราฟแรงดันจริง ช่วงเปลี่ยนระดับของวงจรจริงใช้เวลา</p>
    </>}
  </section>;
}

function AnalogTrace({ level }) {
  const endY = 158 - level * 1.16;
  const id = useId();
  const curve = `M64 140 C104 140 113 63 168 68 S247 159 306 133 S402 32 438 68 S478 ${endY} 514 ${endY}`;
  return <svg className="signal-chart" viewBox="0 0 550 205" role="img" aria-label="ตัวอย่างกราฟแอนะล็อก เส้นโค้งต่อเนื่องมีระดับระหว่างค่าน้อยและค่ามาก">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffc46a" stopOpacity=".35" /><stop offset="100%" stopColor="#ffc46a" stopOpacity="0" /></linearGradient></defs>
    <text x="4" y="40">มาก</text><text x="4" y="163">น้อย</text>
    <path className="signal-grid" d="M64 40H520 M64 98H520 M64 158H520" />
    <path className="signal-axis" d="M64 20V176H525" />
    <path d={`${curve} L514 176 L64 176Z`} fill={`url(#${id})`} />
    <path className="signal-line analog-line" d={curve} />
    <circle cx="514" cy={endY} r="6" fill="#ffe0a2" />
    <text x="66" y="199">ระดับแรงดันแอนะล็อก</text><text x="517" y="199" textAnchor="end">เวลา →</text>
  </svg>;
}

export function AnalogSignal({ mode = 'wave' }) {
  const [level, setLevel] = useState(50);
  const [bits, setBits] = useState(3);
  const sliderId = useId();
  const maxCode = 2 ** bits - 1;
  // Ideal unipolar ADC: equal-width bins; the top endpoint saturates at maxCode.
  const code = adcCode(level, bits);
  const voltage = (level / 100 * 3.2).toFixed(2);
  const raw = adcCode(level, 12);
  return <section className="signal-lab analog-lab" aria-label={mode === 'wave' ? 'กราฟิก Analog' : 'กราฟิก Analog ผ่าน ADC'}>
    <header className="signal-heading"><SlidersHorizontal aria-hidden="true" /><div><span>{mode === 'wave' ? 'ANALOG · เปลี่ยนระดับต่อเนื่อง' : 'ANALOG → ADC → ตัวเลข'}</span><h3>{mode === 'wave' ? 'ค่อย ๆ เปลี่ยนแสง เห็นระดับระหว่างกลาง' : mode === 'raw' ? 'ตัวเลขที่อ่านได้ ยังไม่ใช่หน่วยของสิ่งที่วัด' : 'แยกแรงดันก่อนแปลง กับรหัสหลังแปลง'}</h3></div></header>
    <div className="analog-console">
      <div className="light-orb" style={{ '--light-level': level / 100 }}><Sun size={56} strokeWidth={1.5} aria-hidden="true" /><span>{mode === 'wave' ? 'แสงจำลอง' : 'แรงดันเข้าจำลอง'}</span></div>
      <div className="analog-slider"><label htmlFor={sliderId}>{mode === 'wave' ? 'เลื่อนปรับระดับแสง' : 'เลื่อนปรับแรงดันขาเข้า'}</label><input id={sliderId} type="range" min="0" max="100" step="0.1" value={level} aria-valuetext={`${voltage} โวลต์ ในวงจรสมมติ`} onChange={event => setLevel(Number(event.target.value))} /><div className="range-labels"><span>{mode === 'wave' ? 'แสงน้อย' : '0 V'}</span><span>{mode === 'wave' ? 'แสงมาก' : '3.20 V'}</span></div></div>
      <output className="voltage-readout"><small>แรงดันจำลอง</small><strong>{voltage}<span> V</span></strong></output>
    </div>
    {mode === 'wave' ? <>
      <AnalogTrace level={level} />
      <div className="analog-spectrum"><span>น้อย</span><div /><span>มาก</span></div>
      <p className="signal-note">เส้นโค้งเป็นตัวอย่างการเปลี่ยนตามเวลา การเลื่อนปรับเฉพาะจุดปลาย ไม่ใช่ประวัติการเลื่อนจริง สมมติวงจรที่แสงมากทำให้แรงดันสูงขึ้น และใช้ช่วง 0–3.20 V เพื่อสาธิต</p>
      <p className="signal-emphasis">Analog มีค่าระหว่างกลางได้ เช่น 1.20 V, 1.25 V, 1.27 V — ไม่จำกัดแค่ LOW / HIGH</p>
    </> : mode === 'adc' ? <>
      <div className="signal-button-group" role="group" aria-label="เลือกความละเอียด ADC">{[3, 4, 12].map(value => <button type="button" key={value} aria-pressed={bits === value} onClick={() => setBits(value)}>{value} บิต{value === 3 ? ' · ดูขั้นชัด ๆ' : ''}</button>)}</div>
      <div className="adc-stages" aria-live="polite"><div><small>ก่อนแปลง · Analog</small><strong>{voltage} V</strong><span>แรงดันในช่วงวัด</span></div><ArrowRight aria-hidden="true" /><div className="adc-chip"><small>ADC {bits} บิต</small><strong>{maxCode + 1}</strong><span>ระดับที่แยกได้</span></div><ArrowRight aria-hidden="true" /><div><small>หลังแปลง · Digital</small><strong>{code}</strong><span>รหัสจำนวนเต็ม 0–{maxCode}</span></div></div>
      <div className="quantization-chart">
        <svg className="signal-chart" viewBox="0 0 550 225" role="img" aria-label={`กราฟแรงดันขาเข้าเทียบรหัส ADC ${bits} บิต รหัสเปลี่ยนเป็นขั้น จำนวน ${maxCode + 1} ระดับ`}>
          <path className="signal-axis" d="M65 25V177H520" /><path className="signal-grid" d="M65 42H514 M65 105H514" />
          <text x="6" y="47">{maxCode}</text><text x="30" y="177">0</text>
          <text x="65" y="16">รหัส ADC</text>
          <path className="signal-line adc-line" d={Array.from({ length: maxCode + 1 }, (_, index) => `${index === 0 ? 'M' : 'V'} ${index === 0 ? '65 ' : ''}${172 - index / maxCode * 130} H${65 + (index + 1) / (maxCode + 1) * 449}`).join(' ')} />
          <circle cx={65 + level / 100 * 449} cy={172 - code / maxCode * 130} r="6" fill="#fff4d2" />
          <text x="65" y="207">0 V</text><text x="514" y="207" textAnchor="end">แรงดันขาเข้า → 3.20 V</text>
        </svg>
      </div>
      <p className="signal-note">เส้นขั้นบันไดนี้คือรหัสหลัง ADC ไม่ใช่สัญญาณ Analog ต้นทาง ลอง 3 บิตแล้วขยับทีละน้อย: แรงดันเปลี่ยนได้แม้ยังได้รหัสเดิม เมื่อใช้ 12 บิต ขั้นจะเล็กจนมองแยกยากในภาพนี้</p>
    </> : <>
      <div className="raw-reading" aria-live="polite"><span>แรงดัน {voltage} V → ADC 12 บิต</span><strong>{raw}</strong><span>ค่าดิบ · ไม่มีหน่วย °C หรือ % ความชื้น</span></div>
      <div className="calibration-cards"><div><Sun aria-hidden="true" /><h4>ถ้ามาจากวงจร LDR</h4><p>ต้องเทียบกับแสงจริงก่อนบอกว่ามืดหรือสว่าง ค่านี้ไม่ใช่ lux โดยตรง</p></div><div><Sprout aria-hidden="true" /><h4>ตัวเลขเดียวกันไม่ได้แปลเหมือนกัน</h4><p>หากมาจากเซ็นเซอร์ดิน ต้องเทียบกับดินแห้งและดินชื้นของอุปกรณ์นั้นก่อน</p></div></div>
      <p className="signal-emphasis">ค่ากลางสเกล ADC ≠ ความชื้นดิน 50% โดยอัตโนมัติ</p>
    </>}
    {mode !== 'wave' && <p className="signal-note">จำลอง ADC อุดมคติ ช่วง 0–3.20 V เพื่อให้เห็นหลักการ ไม่ใช่พิกัดแรงดันของบอร์ดจริง ตัวเลื่อนและตัวเลขบนเว็บมีความละเอียดจำกัด ส่วนสัญญาณ Analog จริงต่อเนื่องในช่วงทำงาน</p>}
  </section>;
}

export function SignalComparison() {
  return <section className="signal-comparison" aria-label="เปรียบเทียบ Analog และ Digital">
    <div className="comparison-digital"><span>DIGITAL</span><h3>แยกเป็นสองระดับลอจิก</h3><svg viewBox="0 0 260 85" role="img" aria-label="ดิจิทัลรูปคลื่นสี่เหลี่ยม ระดับ 0 และ 1"><text x="2" y="20">1</text><text x="2" y="70">0</text><path d="M25 65H65V15H110V65H155V15H205V65H250" className="signal-line digital-line" /></svg><p>อ่าน LOW / HIGH เป็น 0 / 1<br />หลายบิตรวมกันส่งตัวเลขได้</p><b>นึกถึงสวิตช์: สองสถานะ</b></div>
    <div className="comparison-analog"><span>ANALOG</span><h3>มีระดับระหว่างกลางต่อเนื่อง</h3><svg viewBox="0 0 260 85" role="img" aria-label="แอนะล็อกเส้นโค้งต่อเนื่องหลายระดับ"><path d="M10 60C35 60 35 15 65 15S95 65 125 65S155 20 185 20S220 55 250 35" className="signal-line analog-line" /></svg><p>แรงดันอาจค่อย ๆ เพิ่มหรือลด<br />ผ่าน ADC แล้วจึงได้ค่าจำนวนเต็ม</p><b>นึกถึงการหรี่แสง: ค่อย ๆ เปลี่ยนระดับ</b></div>
    <p className="comparison-footnote">ดูชนิดของสัญญาณที่ส่ง ไม่ใช่สิ่งที่วัดอย่างเดียว เช่น อุณหภูมิเปลี่ยนต่อเนื่อง แต่ DHT11 ส่งค่าด้วยสัญญาณ Digital ได้</p>
  </section>;
}

export default function SignalGraphic({ type }) {
  if (type === 'comparison') return <SignalComparison />;
  const [family, mode] = type.split(':');
  return family === 'digital' ? <DigitalSignal mode={mode} /> : <AnalogSignal mode={mode} />;
}

export function SignalActivityReview({ kind, revealed }) {
  if (!revealed) return null;
  return <section className="signal-activity-review" aria-label="ทดลองสัญญาณหลังสรุปผลโหวต">
    <h2>ลองปรับสัญญาณ แล้วอธิบายสิ่งที่เห็น</h2>
    <p>แบบจำลองนี้ให้ทดลองเพิ่มเติม ผลโหวตของคุณยังคงเดิม</p>
    {kind === 'digital' ? <DigitalSignal /> : <AnalogSignal />}
  </section>;
}
