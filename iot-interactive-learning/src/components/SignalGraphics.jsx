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
      <div className="polarity-grid" aria-live="polite">
        <div style={{position: 'relative'}}>
          <span>วงจร active-high</span>
          <strong>{pressed ? 1 : 0}</strong>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '12px 0' }}>
            <span style={{color: pressed ? '#ffca79' : '#888', fontSize: '1rem', fontWeight: 'bold'}}>แรงดันขาสัญญาณ: {pressed ? '3.3V' : '0V'}</span>
            <div style={{ width: '80%', height: 12, background: '#222', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: pressed ? '100%' : '0%', height: '100%', background: '#ffca79', transition: 'width 0.2s ease-in-out' }} />
            </div>
          </div>
          <p>กด = HIGH · ปล่อย = LOW</p>
        </div>
        <div style={{position: 'relative'}}>
          <span>วงจร active-low</span>
          <strong>{pressed ? 0 : 1}</strong>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '12px 0' }}>
            <span style={{color: !pressed ? '#ffca79' : '#888', fontSize: '1rem', fontWeight: 'bold'}}>แรงดันขาสัญญาณ: {pressed ? '0V' : '3.3V'}</span>
            <div style={{ width: '80%', height: 12, background: '#222', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: pressed ? '0%' : '100%', height: '100%', background: '#ffca79', transition: 'width 0.2s ease-in-out' }} />
            </div>
          </div>
          <p>กด = LOW · ปล่อย = HIGH</p>
        </div>
      </div>
      <p className="signal-note">ทั้งสองวงจรยังเป็น Digital เหมือนกัน ต้องดูการต่อวงจรเพื่อรู้ว่า 0 หรือ 1 หมายถึง “กด” ค่า 0 V / 3.3 V เป็นแรงดันสัญญาณอุดมคติของตัวอย่างนี้ ไม่ใช่ไฟเลี้ยงอุปกรณ์ และช่วง LOW/HIGH จริงขึ้นกับอุปกรณ์</p>
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
  const dryValue = 3400;
  const wetValue = 1200;
  const sliderId = useId();
  const maxCode = 2 ** bits - 1;
  // Ideal unipolar ADC: equal-width bins; the top endpoint saturates at maxCode.
  const code = adcCode(level, bits);
  const voltage = (level / 100 * 3.2).toFixed(mode === 'wave' ? 2 : 5);
  const raw = adcCode(level, 12);
  const referenceIndex = Math.max(0, Math.min(100, Math.round((dryValue - raw) / (dryValue - wetValue) * 100)));
  const outsideReference = raw < wetValue || raw > dryValue;
  return <section className="signal-lab analog-lab" aria-label={mode === 'wave' ? 'กราฟิก Analog' : 'กราฟิก Analog ผ่าน ADC'}>
    <header className="signal-heading"><SlidersHorizontal aria-hidden="true" /><div><span>{mode === 'wave' ? 'ANALOG · เปลี่ยนระดับต่อเนื่อง' : 'ANALOG → ADC → ตัวเลข'}</span><h3>{mode === 'wave' ? 'ค่อย ๆ เปลี่ยนแสง เห็นระดับระหว่างกลาง' : mode === 'raw' ? 'ตัวเลขที่อ่านได้ ยังไม่ใช่หน่วยของสิ่งที่วัด' : 'แยกแรงดันก่อนแปลง กับรหัสหลังแปลง'}</h3></div></header>
    <div className="analog-console">
      <div className="light-orb" style={{ '--light-level': level / 100 }}>{mode === 'raw' ? <Sprout size={56} strokeWidth={1.5} aria-hidden="true" /> : <Sun size={56} strokeWidth={1.5} aria-hidden="true" />}<span>{mode === 'wave' ? 'แสงจำลอง' : mode === 'raw' ? 'เซ็นเซอร์ดิน' : 'แรงดันเข้าจำลอง'}</span></div>
      <div className="analog-slider"><label htmlFor={sliderId}>{mode === 'wave' ? 'เลื่อนปรับระดับแสง' : mode === 'raw' ? 'จำลองแรงดันที่เซ็นเซอร์ดินส่งมา' : 'เลื่อนปรับแรงดันขาเข้า'}</label><input id={sliderId} type="range" min="0" max="100" step="0.01" value={level} aria-valuetext={`${voltage} โวลต์ ในวงจรสมมติ`} onChange={event => setLevel(Number(event.target.value))} /><div className="range-labels"><span>{mode === 'wave' ? 'แสงน้อย' : '0 V'}</span><span>{mode === 'wave' ? 'แสงมาก' : '3.20 V'}</span></div></div>
      <output className="voltage-readout"><small>{mode === 'raw' ? 'แรงดันจากเซ็นเซอร์' : 'แรงดันจำลอง'}</small><strong>{voltage}<span> V</span></strong></output>
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
      <p className="signal-note">เส้นขั้นบันไดนี้คือรหัสหลัง ADC ไม่ใช่สัญญาณ Analog ต้นทาง ลอง 3 บิตแล้วขยับทีละน้อย: แรงดันเปลี่ยนได้แม้ยังได้รหัสเดิม เมื่อใช้ 12 บิต ขั้นจะเล็กจนมองแยกยากในภาพนี้ สำหรับ 3 บิต ช่วง 0–3.20 V แบ่งเป็น 8 ช่วง ช่วงละ 0.40 V</p>
    </> : <>
      <div className="raw-reading" aria-live="polite"><span>แรงดัน {voltage} V → ADC 12 บิต</span><strong>{raw}</strong><span>ค่าดิบ · ไม่มีหน่วย °C หรือ % ความชื้น</span></div>
      <div className="calibration-demo">
        <header>
          <Sprout size={32} aria-hidden="true" />
          <div>
            <h4>ดัชนีความเปียกเทียบจุดอ้างอิง 0–100%</h4>
            <p>ข้อมูลสมมติเพื่อฝึกตีความ: <b>ดินแห้งอ้างอิง = 3400 → 0%</b> และ <b>ดินเปียกอ้างอิง = 1200 → 100%</b> ตัวเลื่อนปรับแรงดันจากเซนเซอร์ ไม่ได้ปรับเปอร์เซ็นต์น้ำในดินโดยตรง</p>
          </div>
        </header>
        <div className="signal-button-group" role="group" aria-label="ลองค่าดินอ้างอิง">
          {[3400, 2300, 1200].map(value => <button type="button" key={value} onClick={() => setLevel((value + 0.5) / 4096 * 100)}>ค่าดิบ {value}</button>)}
        </div>
        <div className="map-result" aria-live="polite">
          <span>ค่าดิบ: {raw}</span><ArrowRight aria-hidden="true" />
          <strong>{referenceIndex}%</strong><span>ดัชนีเทียบจุดอ้างอิง</span>
        </div>
        <p className="signal-note">ดัชนี = (3400 − ค่าดิบ) ÷ (3400 − 1200) × 100 เช่น 2300 ได้ดัชนี 50% เพราะอยู่กึ่งกลางจุดอ้างอิงทั้งสอง</p>
        {outsideReference && <p className="signal-reference-notice" role="status">ค่าดิบอยู่นอกช่วงอ้างอิง 1200–3400 จึงจำกัดดัชนีที่ 0% หรือ 100% เพื่อแสดงผล ควรตรวจสภาพและจุดอ้างอิงก่อนตีความ</p>}
      </div>
      <p className="signal-emphasis">ดัชนีนี้ไม่ใช่เปอร์เซ็นต์ปริมาณน้ำจริงในดิน การรายงานหน่วยจริงต้องสอบเทียบกับปริมาณน้ำที่ทราบและความสัมพันธ์ของเซนเซอร์กับดินที่ใช้</p>
    </>}
    {mode !== 'wave' && <p className="signal-note">จำลอง ADC อุดมคติ ช่วง 0–3.20 V เพื่อให้เห็นหลักการ ไม่ใช่พิกัดแรงดันของบอร์ดจริง ตัวเลื่อนและตัวเลขบนเว็บมีความละเอียดจำกัด ส่วนสัญญาณ Analog จริงต่อเนื่องในช่วงทำงาน</p>}
  </section>;
}

// A code-native summary keeps sensor labels, signal paths, and reading methods together.
export function SignalRoutes() {
  return <section className="signal-routes" aria-label="สี่เซนเซอร์ สามวิธีอ่าน">
    <div className="signal-route"><span>DIGITAL · สถานะ</span><h3>PIR · ขาสถานะ</h3>
      <div className="route-symbol">LOW / HIGH</div>
      <ol><li>โมดูลส่งสถานะการตรวจพบ</li><li>บอร์ดอ่านลอจิก 0 หรือ 1</li><li>ตีความตามวงจรและรุ่น</li></ol>
      <p>0 ไม่ได้หมายถึงอุปกรณ์ไม่มีไฟเลี้ยง</p></div>
    <div className="signal-route"><span>DIGITAL · หลายบิต</span><h3>DHT11 · ขาข้อมูล</h3>
      <div className="route-symbol">ชุดบิต → ถอดรหัส</div>
      <ol><li>เซนเซอร์ส่งข้อมูลตามโปรโตคอล</li><li>บอร์ดรับและถอดรหัสด้วยไลบรารี</li><li>ได้อุณหภูมิ °C และความชื้นอากาศ %RH</li></ol>
      <p>อ่าน LOW/HIGH ครั้งเดียว ยังไม่รู้อุณหภูมิ</p></div>
    <div className="signal-route analog-route"><span>ANALOG · แรงดัน</span><h3>LDR / เซนเซอร์ดิน · ขา AO</h3>
      <div className="route-symbol">แรงดัน → ADC</div>
      <ol><li>วงจรส่งแรงดันที่มีค่าระหว่างระดับได้</li><li>ADC แปลงเป็นรหัสจำนวนเต็ม</li><li>เทียบข้อมูลอ้างอิงก่อนแปลความหมาย</li></ol>
      <p>ค่าดิบยังไม่ใช่ lux หรือเปอร์เซ็นต์ปริมาณน้ำในดิน</p></div>
    <p className="signal-route-note">จัดตามขาและรูปแบบข้อมูลของตัวอย่างนี้ โมดูลอื่นอาจมีวิธีส่งต่างกัน และบางโมดูลมีทั้ง AO และ DO ให้เลือก</p>
  </section>;
}

export function SignalComparison({ mode }) {
  const [level, setLevel] = useState(mode === 'multibit' ? 25 : 50);
  const [activeLow, setActiveLow] = useState(false);
  const sliderId = useId();

  if (mode === 'aodo' || mode === 'multibit') {
    const isAoDo = mode === 'aodo';
    const inputVoltage = isAoDo ? level * 3.3 / 100 : level * 0.01;
    const overThreshold = level > 50;
    const high = activeLow ? !overThreshold : overThreshold;
    const binary = Math.round(level).toString(2).padStart(8, '0');
    const voltageMax = isAoDo ? 3.3 : 0.5;
    const voltageY = 160 - inputVoltage / voltageMax * 120;

    return <section className="signal-lab analog-lab" aria-label={isAoDo ? 'ทดลอง AO และ DO' : 'ทดลอง Analog และ Digital หลายบิต'}>
      <header className="signal-heading"><SlidersHorizontal aria-hidden="true" /><div>
        <span>{isAoDo ? 'เทียบสัญญาณ AO กับ DO' : 'เทียบวิธีส่งค่าอุณหภูมิ'}</span>
        <h3>{isAoDo ? 'โมดูลเดียวกัน แต่ออกคนละแบบ' : 'ทั้ง Analog และ Digital ส่งข้อมูลระดับได้'}</h3>
      </div></header>
      <div className="analog-slider">
        <label htmlFor={sliderId}>{isAoDo ? 'ปรับระดับแรงดัน AO ในวงจรสมมติ' : `อุณหภูมิจำลอง ${level} °C · ช่วงตัวอย่าง 0–50 °C`}</label>
        <input id={sliderId} type="range" min="0" max={isAoDo ? 100 : 50} step={isAoDo ? 0.1 : 1} value={level} onChange={event => setLevel(Number(event.target.value))} />
        <div className="range-labels"><span>{isAoDo ? '0 V' : '0 °C'}</span><span>{isAoDo ? '3.30 V' : '50 °C'}</span></div>
      </div>
      {isAoDo && <button type="button" className="signal-toggle" aria-pressed={activeLow} onClick={() => setActiveLow(!activeLow)}>{activeLow ? 'เมื่อเกินเกณฑ์ให้ LOW · แตะเพื่อสลับ' : 'เมื่อเกินเกณฑ์ให้ HIGH · แตะเพื่อสลับ'}</button>}
      <div className="signal-comparison">
        <div className="comparison-analog">
          <span>{isAoDo ? 'AO · แรงดันจากโมดูล' : 'ANALOG · ตัวอย่าง LM35'}</span>
          <h3>{isAoDo ? 'อ่านระดับผ่าน ADC' : 'แรงดันแปรตามอุณหภูมิ'}</h3>
          <svg className="signal-chart" viewBox="0 0 360 210" role="img" aria-label={`ระดับแรงดันสัญญาณ ${inputVoltage.toFixed(3)} โวลต์${isAoDo ? ' เทียบเกณฑ์ 1.65 โวลต์' : ''}`}>
            <path className="signal-axis" d="M78 25V160H340" />
            <text x="8" y="45">{voltageMax.toFixed(2)} V</text><text x="25" y="165">0 V</text>
            {isAoDo && <><path className="signal-threshold" d="M78 100H340" /><text x="110" y="90">เกณฑ์ 1.65 V</text></>}
            <path className="signal-line analog-line" d={`M78 ${voltageY}H330`} />
            <circle cx="310" cy={voltageY} r="6" fill="#ffca79" />
            <text x="90" y="195">ระดับแรงดันขณะนี้</text>
          </svg>
          <output className="comparison-readout">แรงดันขาสัญญาณ {inputVoltage.toFixed(3)} V</output>
          <p>{isAoDo ? 'AO ส่งแรงดันให้บอร์ดอ่านผ่าน ADC แล้วนำค่าดิบไปตั้งเกณฑ์ในโปรแกรมได้ ความละเอียดและความคลาดเคลื่อนยังขึ้นกับเซนเซอร์และวงจร' : 'ใช้ความสัมพันธ์อุดมคติของ LM35: 10 mV/°C เช่น 25 °C → 0.250 V และ 50 °C → 0.500 V บอร์ดอ่าน ADC แล้วแปลงแรงดันเป็นอุณหภูมิ โดยอุปกรณ์จริงมีความคลาดเคลื่อน'}</p>
        </div>
        <div className="comparison-digital">
          <span>{isAoDo ? 'DO · สถานะจากโมดูล' : 'DIGITAL · ตัวอย่าง DHT11'}</span>
          <h3>{isAoDo ? 'อ่านสถานะจากการเทียบเกณฑ์' : 'รับชุดข้อมูลแล้วถอดรหัส'}</h3>
          {isAoDo ? <>
            <svg className="signal-chart" viewBox="0 0 360 210" role="img" aria-label={`สถานะ DO ขณะนี้ ${high ? 'HIGH 1' : 'LOW 0'}`}>
              <path className="signal-axis" d="M95 25V160H340" />
              <text x="8" y="45">HIGH 1</text><text x="8" y="165">LOW 0</text>
              <path className="signal-line digital-line" d={`M95 ${high ? 40 : 160}H330`} />
              <text x="100" y="195">สถานะลอจิกขณะนี้</text>
            </svg>
            <output className="comparison-readout" aria-live="polite">{high ? 'HIGH / 1' : 'LOW / 0'} · AO {overThreshold ? 'มากกว่า' : 'น้อยกว่าหรือเท่ากับ'} 1.65 V</output>
            <p>วงจรเปรียบเทียบแรงดัน (Comparator) ให้สถานะว่าค่าอยู่ด้านใดของเกณฑ์ บอร์ดอ่าน DO เป็นลอจิก แต่ย้อนหาระดับแรงดันละเอียดจากสถานะเดียวไม่ได้</p>
          </> : <>
            <DigitalTrace bits={binary.split('').map(Number)} />
            <output className="comparison-readout" aria-live="polite">{binary}₂ = {Math.round(level)} · ตัวอย่างรหัสจำนวนเต็ม</output>
            <p className="signal-emphasis">ภาพ 8 บิตนี้ใช้ฝึกการแทนตัวเลข ไม่ใช่รูปคลื่นหรือแพ็กเก็ตจริงของ DHT11</p>
            <p>DHT11 ส่งข้อมูลอุณหภูมิและความชื้นตามโปรโตคอล บอร์ดต้องรับชุดข้อมูลและถอดรหัสด้วยไลบรารี จึงได้ค่า เช่น {level} °C การอ่าน HIGH/LOW ครั้งเดียวไม่ให้ค่าอุณหภูมิ</p>
          </>}
        </div>
      </div>
      <p className="signal-note">{isAoDo ? 'แบบจำลองนี้กำหนดเกณฑ์ที่ AO > 1.65 V และให้เลือกขั้วลอจิกได้ ค่าเท่ากับเกณฑ์จัดอยู่ฝั่งไม่เกินเกณฑ์ โมดูลจริงต้องตรวจขั้วลอจิก พฤติกรรมใกล้เกณฑ์ และระดับแรงดันที่บอร์ดรับได้ ไม่ควรใช้สถานะไฟ LED แทนความหมายของ DO โดยไม่ตรวจวงจร' : 'ทั้งสองฝั่งใช้ค่าอุณหภูมิสมมติเดียวกันเพื่อเปรียบเทียบวิธีส่งข้อมูล ไม่ได้อ่านอุปกรณ์จริง และไม่ได้เปรียบเทียบว่าอุปกรณ์ใดแม่นยำกว่า ช่วงวัดและรูปแบบข้อมูลจริงต้องดูเอกสารของรุ่นที่ใช้'}</p>
    </section>;
  }

  return <section className="signal-comparison" aria-label="เปรียบเทียบ Analog และ Digital">
    <div className="comparison-digital"><span>DIGITAL แบบไบนารี</span><h3>สองระดับลอจิก</h3><DigitalTrace bits={[0, 0, 1, 1, 0, 1, 0, 0]} /><p>อ่าน LOW / HIGH เป็น 0 / 1 หลายบิตรวมกันแทนตัวเลขได้ ต้องตีความตามวงจรและรูปแบบข้อมูล</p><b>กราฟแสดงลอจิกอุดมคติ ไม่ใช่แรงดันจริง</b></div>
    <div className="comparison-analog"><span>ANALOG</span><h3>มีค่าระหว่างระดับได้</h3><AnalogTrace level={50} /><p>แรงดันอาจเปลี่ยนหรือคงที่อยู่ช่วงหนึ่งได้ เมื่อต้องการค่าตัวเลขให้บอร์ดคำนวณจึงอ่านผ่าน ADC</p><b>กราฟเป็นเพียงตัวอย่าง Analog ไม่จำเป็นต้องเป็นเส้นโค้ง</b></div>
    <p className="comparison-footnote">ดูวิธีแทนข้อมูลที่ขาสัญญาณ ไม่ตัดสินจากรูปร่างกราฟหรือสิ่งที่วัด เช่น อุณหภูมิเปลี่ยนต่อเนื่อง แต่ DHT11 ส่งข้อมูล Digital ได้ ส่วนการหรี่ LED ก็ทำด้วยพัลส์ Digital แบบ PWM ได้</p>
  </section>;
}

export default function SignalGraphic({ type }) {
  if (type === 'routes') return <SignalRoutes />;
  if (type === 'comparison') return <SignalComparison />;
  const [family, mode] = type.split(':');
  if (family === 'comparison') return <SignalComparison mode={mode} />;
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
