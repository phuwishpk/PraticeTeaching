import { useId, useState } from 'react';
import { Sun, Sprout, ArrowRight, Binary, SlidersHorizontal, Thermometer } from 'lucide-react';
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
            <span style={{color: pressed ? '#ffca79' : '#888', fontSize: '1rem', fontWeight: 'bold'}}>ไฟเข้า: {pressed ? '3.3V' : '0V'}</span>
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
            <span style={{color: !pressed ? '#ffca79' : '#888', fontSize: '1rem', fontWeight: 'bold'}}>ไฟเข้า: {pressed ? '0V' : '3.3V'}</span>
            <div style={{ width: '80%', height: 12, background: '#222', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: pressed ? '0%' : '100%', height: '100%', background: '#ffca79', transition: 'width 0.2s ease-in-out' }} />
            </div>
          </div>
          <p>กด = LOW · ปล่อย = HIGH</p>
        </div>
      </div>
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
  const [dryValue, setDryValue] = useState(3400);
  const [wetValue, setWetValue] = useState(1200);
  const sliderId = useId();
  const maxCode = 2 ** bits - 1;
  // Ideal unipolar ADC: equal-width bins; the top endpoint saturates at maxCode.
  const code = adcCode(level, bits);
  const voltage = (level / 100 * 3.2).toFixed(2);
  const raw = adcCode(level, 12);
  return <section className="signal-lab analog-lab" aria-label={mode === 'wave' ? 'กราฟิก Analog' : 'กราฟิก Analog ผ่าน ADC'}>
    <header className="signal-heading"><SlidersHorizontal aria-hidden="true" /><div><span>{mode === 'wave' ? 'ANALOG · เปลี่ยนระดับต่อเนื่อง' : 'ANALOG → ADC → ตัวเลข'}</span><h3>{mode === 'wave' ? 'ค่อย ๆ เปลี่ยนแสง เห็นระดับระหว่างกลาง' : mode === 'raw' ? 'ตัวเลขที่อ่านได้ ยังไม่ใช่หน่วยของสิ่งที่วัด' : 'แยกแรงดันก่อนแปลง กับรหัสหลังแปลง'}</h3></div></header>
    <div className="analog-console">
      <div className="light-orb" style={{ '--light-level': level / 100 }}>{mode === 'raw' ? <Sprout size={56} strokeWidth={1.5} aria-hidden="true" /> : <Sun size={56} strokeWidth={1.5} aria-hidden="true" />}<span>{mode === 'wave' ? 'แสงจำลอง' : mode === 'raw' ? 'เซ็นเซอร์ดิน' : 'แรงดันเข้าจำลอง'}</span></div>
      <div className="analog-slider"><label htmlFor={sliderId}>{mode === 'wave' ? 'เลื่อนปรับระดับแสง' : mode === 'raw' ? 'จำลองแรงดันที่เซ็นเซอร์ดินส่งมา' : 'เลื่อนปรับแรงดันขาเข้า'}</label><input id={sliderId} type="range" min="0" max="100" step="0.1" value={level} aria-valuetext={`${voltage} โวลต์ ในวงจรสมมติ`} onChange={event => setLevel(Number(event.target.value))} /><div className="range-labels"><span>{mode === 'wave' ? 'แสงน้อย' : '0 V'}</span><span>{mode === 'wave' ? 'แสงมาก' : '3.20 V'}</span></div></div>
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
      <p className="signal-note">เส้นขั้นบันไดนี้คือรหัสหลัง ADC ไม่ใช่สัญญาณ Analog ต้นทาง ลอง 3 บิตแล้วขยับทีละน้อย: แรงดันเปลี่ยนได้แม้ยังได้รหัสเดิม เมื่อใช้ 12 บิต ขั้นจะเล็กจนมองแยกยากในภาพนี้</p>
    </> : <>
      <div className="raw-reading" aria-live="polite"><span>แรงดัน {voltage} V → ADC 12 บิต</span><strong>{raw}</strong><span>ค่าดิบ · ไม่มีหน่วย °C หรือ % ความชื้น</span></div>
      <div className="calibration-demo">
        <header>
          <Sprout size={32} aria-hidden="true" />
          <div>
            <h4>จำลองการแปลงค่าดิบเป็นความชื้นดิน (Calibration)</h4>
            <p style={{fontSize: '0.9rem', color: '#c3d1db', marginTop: 4}}>สมมติว่าทดลองวัดจริงแล้วพบว่า: <b>ดินแห้งสนิท = 3400</b> และ <b>ดินเปียกชุ่ม = 1200</b><br/>ลองเลื่อนสมมติสภาพดินด้านบน เพื่อดูว่าค่าดิบ <b>{raw}</b> จะถูกแปลงเป็นกี่เปอร์เซ็นต์</p>
          </div>
        </header>
        <div className="map-result">
          <span>ค่าดิบ: {raw}</span>
          <ArrowRight aria-hidden="true" />
          <strong>
            {(() => {
              let pct = Math.round(((raw - dryValue) * 100) / (wetValue - dryValue));
              if (isNaN(pct)) return 0;
              return Math.max(0, Math.min(100, pct));
            })()}%
          </strong>
          <span>ความชื้นดิน (โดยประมาณ)</span>
        </div>
      </div>
      <p className="signal-emphasis">ค่าดิบเดียวกันแปลความหมายได้ต่างกัน ขึ้นอยู่กับการตั้งค่า (Calibration) ของอุปกรณ์นั้นๆ</p>
    </>}
    {mode !== 'wave' && <p className="signal-note">จำลอง ADC อุดมคติ ช่วง 0–3.20 V เพื่อให้เห็นหลักการ ไม่ใช่พิกัดแรงดันของบอร์ดจริง ตัวเลื่อนและตัวเลขบนเว็บมีความละเอียดจำกัด ส่วนสัญญาณ Analog จริงต่อเนื่องในช่วงทำงาน</p>}
  </section>;
}

export function SignalComparison({ mode }) {
  const [level, setLevel] = useState(50);
  const sliderId = useId();

  if (mode === 'aodo' || mode === 'multibit') {
    const isAoDo = mode === 'aodo';
    const analogY = 65 - (level / 100) * 50;
    const thresholdY = level > 50 ? 15 : 65;
    
    return <section className="signal-lab analog-lab" style={{'--signal-accent': '#a4e58b'}}>
      <header className="signal-heading">
        <SlidersHorizontal aria-hidden="true" />
        <div>
          <span>{isAoDo ? 'เทียบสัญญาณ AO กับ DO' : 'เทียบสัญญาณ Analog กับ Digital หลายบิต'}</span>
          <h3>{isAoDo ? 'โมดูลเดียวกัน แต่ออกคนละแบบ' : 'ต้องการตัวเลข ไม่ได้แปลว่าต้องใช้ Analog'}</h3>
        </div>
      </header>
      <div className="analog-console" style={{gridTemplateColumns: '1fr', gap: 16}}>
        <div className="analog-slider">
          <label htmlFor={sliderId}>จำลองสภาพแวดล้อม (เช่น {isAoDo ? 'ความสว่าง หรือ ความชื้น' : `อุณหภูมิ ${Math.round(level)}°C`})</label>
          <input id={sliderId} type="range" min="0" max="100" value={level} onChange={e => setLevel(Number(e.target.value))} />
        </div>
      </div>
      <div className="signal-comparison">
        <div className="comparison-analog" style={{background: '#0a1824', border: '1px solid #3e7184'}}>
          <span>{isAoDo ? 'ขา AO (Analog Output)' : 'เซ็นเซอร์ Analog (เช่น LM35)'}</span>
          <h3 style={{margin: '4px 0 10px'}}>{isAoDo ? 'ระดับแรงดันเปลี่ยนต่อเนื่อง' : 'ส่งแรงดันตามอุณหภูมิ'}</h3>
          <svg viewBox="0 0 260 85" className="signal-chart" role="img" aria-label="แอนะล็อกเปลี่ยนแปลงต่อเนื่อง">
            <path d={`M10 65 L 125 ${analogY} L 250 ${analogY}`} className="signal-line analog-line" />
            <circle cx="125" cy={analogY} r="6" fill="#ffca79" />
          </svg>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: 12, marginTop: 12, marginBottom: 12}}>
            {isAoDo ? (
              <>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <div style={{width: 24, height: 24, borderRadius: '50%', background: `rgba(255, 202, 121, ${level/100})`, boxShadow: `0 0 12px rgba(255, 202, 121, ${level/100})`, border: '2px solid #ffca79'}}></div>
                    <span style={{color: '#ffca79', fontSize: '0.95rem', fontWeight: 600}}>สว่าง/ทำงานแปรผันตามระดับ</span>
                  </div>
                  <span style={{color: '#ffca79', fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace', marginTop: 4, background: 'rgba(255, 202, 121, 0.1)', padding: '2px 8px', borderRadius: 4}}>ไฟเข้าบอร์ด: {(level * 3.3 / 100).toFixed(2)} V</span>
                </div>
              </>
            ) : (
              <>
                <Thermometer color="#ffca79" size={24} />
                <div style={{flex: 1, height: 6, background: '#333', borderRadius: 3, position: 'relative', overflow: 'hidden'}}>
                  <div style={{position: 'absolute', height: '100%', width: `${level}%`, background: '#ffca79'}} />
                </div>
                <span style={{color: '#ffca79', fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace'}}>{(level * 3.3 / 100).toFixed(2)} V</span>
              </>
            )}
          </div>
          {isAoDo ? (
            <div style={{marginTop: 14, fontSize: '0.9rem', lineHeight: 1.7, color: '#c3d1db'}}>
              <p style={{marginBottom: 8}}>ส่งแรงดันไฟฟ้าจากตัวเซ็นเซอร์มาให้บอร์ดโดยตรง แรงดันจะค่อยๆ สวิงขึ้นลงตามสภาพแวดล้อมจริงแบบต่อเนื่อง</p>
              <p style={{color: '#f6cd8f', background: 'rgba(246, 205, 143, 0.08)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #f6cd8f'}}><b>การนำไปใช้:</b> ต้องต่อเข้าขา <b>Analog (ADC)</b> เพื่อแปลงแรงดันเป็นตัวเลข บอร์ดจะรู้ระดับเป๊ะๆ ทำให้เราเขียนโค้ดตั้งเกณฑ์ได้หลายระดับในโปรแกรมเดียว</p>
            </div>
          ) : (
            <p style={{marginTop: 10, fontSize: '0.9rem', lineHeight: 1.6}}>{'ส่งสัญญาณเป็นระดับแรงดัน 1 ค่า (เช่น 1.5V) บอร์ดที่รับสัญญาณต้องนำไปเข้าวงจร ADC แปลงกลับเป็นรหัสตัวเลขและเข้าสูตรคำนวณอีกครั้ง จึงจะได้ค่าที่ต้องการ'}</p>
          )}
        </div>
        <div className="comparison-digital" style={{background: '#102b39', border: '1px solid #437d94'}}>
          <span>{isAoDo ? 'ขา DO (Digital Output)' : 'เซ็นเซอร์ Digital (เช่น DHT11)'}</span>
          <h3 style={{margin: '4px 0 10px'}}>{isAoDo ? 'สถานะตัดที่เกณฑ์ (Threshold)' : 'ส่งตัวเลขเป็นข้อมูลดิจิทัล'}</h3>
          <svg viewBox="0 0 260 85" className="signal-chart" role="img" aria-label="ดิจิทัลสถานะ">
            {isAoDo ? (
               <>
                 <path d={`M10 65 H 125 V ${thresholdY} H 250`} className="signal-line digital-line" />
                 <path d="M 10 40 H 250" stroke="#ff4444" strokeWidth="2" strokeDasharray="6 4" fill="none" />
                 <text x="130" y="32" fill="#ff4444" fontSize="13" textAnchor="middle">เกณฑ์ที่ตั้งบนโมดูล</text>
                 <circle cx="125" cy={thresholdY} r="6" fill="#6de4fa" />
               </>
            ) : (
               <>
                 {(() => {
                   const binStr = Math.round(level).toString(2).padStart(8, '0');
                   const bitWidth = 24;
                   
                   // 12 data bits + 4 idle/gap bits = 16 bits per packet.
                   const singlePacket = [0, 1, ...binStr.split('').map(Number), 0, 1, 0, 0, 0, 0];
                   const patternWidth = singlePacket.length * bitWidth; // 384px
                   
                   // We need 2 packets to seamlessly loop within a 260px viewBox
                   let allBits = [...singlePacket, ...singlePacket];
                   
                   let pathD = 'M 0 65';
                   let currentX = 0;
                   let labels = [];
                   
                   allBits.forEach((bit, i) => {
                     const y = bit === 1 ? 25 : 65;
                     pathD += ` V ${y} H ${currentX + bitWidth}`;
                     
                     // Label only the data bits, skip gap bits (indices 12-15)
                     const bitInPacket = i % singlePacket.length;
                     if (bitInPacket < 12) {
                       labels.push(
                         <text key={i} x={currentX + bitWidth/2} y={bit === 1 ? 15 : 80} fill="#6de4fa" fontSize="12" textAnchor="middle" opacity="0.8">{bit}</text>
                       );
                     }
                     currentX += bitWidth;
                   });
                   
                   return (
                     <g className="data-packet-group" style={{'--shift': `-${patternWidth}px`}}>
                       <path d={pathD} className="signal-line digital-line" fill="none" strokeWidth="2.5" />
                       {labels}
                       {/* Background text labels per packet */}
                       <text x={patternWidth / 2} y="48" fill="#6de4fa" fontSize="18" textAnchor="middle" fontWeight="bold" opacity="0.25">DATA: {Math.round(level)}°C</text>
                       <text x={patternWidth + patternWidth / 2} y="48" fill="#6de4fa" fontSize="18" textAnchor="middle" fontWeight="bold" opacity="0.25">DATA: {Math.round(level)}°C</text>
                     </g>
                   );
                 })()}
               </>
            )}
          </svg>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: 12, marginTop: 12, marginBottom: 12}}>
            {isAoDo ? (
              <>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                    <div style={{width: 24, height: 24, borderRadius: '50%', background: level > 50 ? '#6de4fa' : '#222', boxShadow: level > 50 ? '0 0 15px #6de4fa' : 'none', border: '2px solid #6de4fa', transition: 'all 0.1s'}}></div>
                    <span style={{color: '#6de4fa', fontSize: '0.95rem', fontWeight: 600}}>{level > 50 ? 'ติดสว่างเต็มที่ (HIGH)' : 'ดับสนิท (LOW)'}</span>
                  </div>
                  <span style={{color: '#6de4fa', fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace', marginTop: 4, background: 'rgba(109, 228, 250, 0.1)', padding: '2px 8px', borderRadius: 4}}>ไฟเข้าบอร์ด: {level > 50 ? '3.30 V' : '0.00 V'}</span>
                </div>
              </>
            ) : (
              <>
                <Thermometer color="#6de4fa" size={24} />
                <div style={{flex: 1, height: 6, background: '#222', borderRadius: 3, position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden'}}>
                  <span style={{color: '#6de4fa', fontSize: '0.65rem', letterSpacing: 3, marginLeft: 4, fontFamily: 'monospace', opacity: 0.8}}>01011001</span>
                </div>
                <span style={{color: '#6de4fa', fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace'}}>{Math.round(level)}°C</span>
              </>
            )}
          </div>
          {isAoDo ? (
            <div style={{marginTop: 14, fontSize: '0.9rem', lineHeight: 1.7, color: '#c3d1db'}}>
              <p style={{marginBottom: 8}}>มีวงจรเปรียบเทียบ (Op-Amp) บนโมดูลคอยตัดสินใจแทนว่า ถึง "เกณฑ์" (Threshold) ที่เราใช้ไขควงหมุนตั้งไว้แล้วหรือยัง</p>
              <p style={{color: '#9bdcf1', background: 'rgba(109, 228, 250, 0.08)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #6de4fa'}}><b>การนำไปใช้:</b> ต่อเข้าขา <b>Digital</b> ธรรมดาได้เลย บอร์ดจะไม่รู้ระดับจริงๆ รู้แค่ <b>"ถึงเกณฑ์ (HIGH)"</b> หรือ <b>"ยังไม่ถึง (LOW)"</b> เหมาะกับงานเช็คเงื่อนไขที่ต้องการความรวดเร็วโดยไม่ต้องใช้ ADC</p>
            </div>
          ) : (
            <p style={{marginTop: 10, fontSize: '0.9rem', lineHeight: 1.6}}>{'ภายในเซ็นเซอร์มีชิปประมวลผลช่วยแปลงค่าและบรรจุเป็นข้อมูล (Data Packet) ส่งผ่านสายสัญญาณเป็นชุดบิต 0 และ 1 บอร์ดสามารถรับและถอดรหัสตัวเลขไปใช้งานได้ทันที'}</p>
          )}
        </div>
      </div>
      {isAoDo && (
        <div style={{gridColumn: '1 / -1', marginTop: 12, padding: '14px 18px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid #435064', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start'}}>
          <div style={{fontSize: '1.2rem'}}>💡</div>
          <div>
            <b style={{color: '#e7eff7', display: 'block', marginBottom: 4, fontSize: '0.95rem'}}>ข้อสังเกตเพื่อป้องกันการสับสน</b>
            <p style={{margin: 0, fontSize: '0.9rem', color: '#bacbd9', lineHeight: 1.6}}>ทั้งสองขานี้ <b>ดึงข้อมูลมาจากตัวรับรู้ (Sensor) ตัวเดียวกันเป๊ะๆ บนแผ่นโมดูล</b> การเลือกใช้ไม่ได้เกี่ยวว่าอันไหนแม่นยำกว่า แต่ขึ้นอยู่กับว่าบอร์ดคุณต้องการข้อมูลแบบ <b>"ดิบๆ เอาไปประมวลผลต่อ"</b> (AO) หรือ <b>"สำเร็จรูปพร้อมสั่งงาน"</b> (DO)</p>
          </div>
        </div>
      )}
    </section>;
  }

  return <section className="signal-comparison" aria-label="เปรียบเทียบ Analog และ Digital">
    <div className="comparison-digital"><span>DIGITAL</span><h3>แยกเป็นสองระดับลอจิก</h3><svg viewBox="0 0 260 85" role="img" aria-label="ดิจิทัลรูปคลื่นสี่เหลี่ยม ระดับ 0 และ 1"><text x="2" y="20">1</text><text x="2" y="70">0</text><path d="M25 65H65V15H110V65H155V15H205V65H250" className="signal-line digital-line" /></svg><p>อ่าน LOW / HIGH เป็น 0 / 1<br />หลายบิตรวมกันส่งตัวเลขได้</p><b>นึกถึงสวิตช์: สองสถานะ</b></div>
    <div className="comparison-analog"><span>ANALOG</span><h3>มีระดับระหว่างกลางต่อเนื่อง</h3><svg viewBox="0 0 260 85" role="img" aria-label="แอนะล็อกเส้นโค้งต่อเนื่องหลายระดับ"><path d="M10 60C35 60 35 15 65 15S95 65 125 65S155 20 185 20S220 55 250 35" className="signal-line analog-line" /></svg><p>แรงดันอาจค่อย ๆ เพิ่มหรือลด<br />ผ่าน ADC แล้วจึงได้ค่าจำนวนเต็ม</p><b>นึกถึงการหรี่แสง: ค่อย ๆ เปลี่ยนระดับ</b></div>
    <p className="comparison-footnote">ดูชนิดของสัญญาณที่ส่ง ไม่ใช่สิ่งที่วัดอย่างเดียว เช่น อุณหภูมิเปลี่ยนต่อเนื่อง แต่ DHT11 ส่งค่าด้วยสัญญาณ Digital ได้</p>
  </section>;
}

export default function SignalGraphic({ type }) {
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
