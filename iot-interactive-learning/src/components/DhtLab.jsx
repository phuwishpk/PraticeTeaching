import { useState, useId, useEffect } from 'react';
import { Thermometer, Droplets, Cpu, Send, RotateCcw, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import './DigitalLabs.css';

export default function DhtLab() {
  const [temp, setTemp] = useState(28);
  const [humidity, setHumidity] = useState(60);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const sliderId = useId();

  const tempInt = Math.min(50, Math.max(15, Math.round(temp)));
  const humInt = Math.min(95, Math.max(20, Math.round(humidity)));

  // 8-bit binary representation of temperature and humidity
  const toBinary = num => num.toString(2).padStart(8, '0');
  const tempBits = toBinary(tempInt);
  const humBits = toBinary(humInt);

  // Trigger pulse animation
  const triggerSend = () => {
    setIsTransmitting(true);
    const timer = setTimeout(() => setIsTransmitting(false), 700);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    setIsTransmitting(true);
    const timer = setTimeout(() => setIsTransmitting(false), 450);
    return () => clearTimeout(timer);
  }, [temp, humidity]);

  // Binary weights for 8 bits: 128, 64, 32, 16, 8, 4, 2, 1
  const weights = [128, 64, 32, 16, 8, 4, 2, 1];

  // SVG Waveform coordinates
  const bitWidth = 72;
  const startX = 55;
  const highY = 32;
  const lowY = 105;
  let wavePath = `M${startX} ${tempBits[0] === '1' ? highY : lowY}`;
  tempBits.split('').forEach((bit, i) => {
    const y = bit === '1' ? highY : lowY;
    if (i > 0) wavePath += ` V${y}`;
    wavePath += ` H${startX + (i + 1) * bitWidth}`;
  });

  return (
    <section className="digital-lab dht-lab" aria-label="จำลองเซนเซอร์ DHT11 ส่งข้อมูล Digital">
      {/* Header */}
      <header className="lab-heading">
        <div>
          <span className="lab-kicker">เข้าใจง่ายใน 1 นาที · DHT11 SENSOR</span>
          <h3 style={{ margin: '4px 0' }}>DHT11 ส่งตัวเลข {tempInt} °C ด้วยสัญญาณ Digital ได้อย่างไร?</h3>
          <p style={{ color: '#b6cee0', fontSize: '.95rem' }}>
            สายไฟมีแค่ 2 สถานะ คือ <b>ไฟติด (1)</b> กับ <b>ไฟดับ (0)</b> แต่ส่งตัวเลขได้ เพราะส่งรหัสเรียงต่อกันเหมือน <i>รหัสมอร์ส</i>
          </p>
        </div>
        <button
          type="button"
          className="lab-reset"
          onClick={() => { setTemp(28); setHumidity(60); }}
        >
          <RotateCcw size={16} aria-hidden="true" />
          รีเซ็ตเป็น 28 °C
        </button>
      </header>

      {/* 3 Simple Steps Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        <div style={{ background: '#132838', border: '1px solid #334d61', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#ffca79', color: '#1a1a1a', width: '28px', height: '28px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
          <div>
            <div style={{ fontSize: '.8rem', color: '#97b1c4' }}>เซนเซอร์วัดค่าได้</div>
            <strong style={{ color: '#ffe2a0', fontSize: '1.05rem' }}>{tempInt} °C</strong>
          </div>
        </div>

        <div style={{ background: '#132838', border: '1px solid #334d61', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#8becbf', color: '#1a1a1a', width: '28px', height: '28px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
          <div>
            <div style={{ fontSize: '.8rem', color: '#97b1c4' }}>แปลงเป็นรหัส 0 กับ 1</div>
            <strong style={{ color: '#bfffe0', fontSize: '1.05rem', fontFamily: 'monospace' }}>{tempBits}</strong>
          </div>
        </div>

        <div style={{ background: '#132838', border: '1px solid #334d61', padding: '12px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#88cdff', color: '#1a1a1a', width: '28px', height: '28px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
          <div>
            <div style={{ fontSize: '.8rem', color: '#97b1c4' }}>ส่งสัญญาณพัลส์เข้าบอร์ด</div>
            <strong style={{ color: '#c2e5ff', fontSize: '1.05rem' }}>บอร์ดอ่านได้ {tempInt} °C</strong>
          </div>
        </div>
      </div>

      {/* Temperature Slider & Quick Controls */}
      <div style={{ background: '#14293a', padding: '16px 20px', borderRadius: '16px', border: '1px solid #37536b', display: 'grid', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '1.05rem', color: '#ffca79', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Thermometer size={20} /> ลองปรับอุณหภูมิ แล้วดูรหัสที่เปลี่ยนไป:
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ color: '#9bb7ca', fontSize: '.9rem' }}>อุณหภูมิที่เลือก:</span>
            <strong style={{ fontSize: '1.8rem', color: '#ffe2a0', lineHeight: 1 }}>{tempInt} °C</strong>
          </div>
        </div>

        <input
          id={`${sliderId}-temp`}
          type="range"
          min="15"
          max="45"
          step="1"
          value={tempInt}
          onChange={e => setTemp(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#ffca79', height: '8px', cursor: 'pointer' }}
          aria-label="ปรับอุณหภูมิ"
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '.82rem', color: '#8da6b8' }}>ตัวอย่างอุณหภูมิ:</span>
          <button
            type="button"
            className="neu-button"
            style={{ fontSize: '.82rem', padding: '5px 12px', borderColor: tempInt === 20 ? '#9dedc8' : undefined }}
            onClick={() => setTemp(20)}
          >
            ❄️ 20°C ห้องแอร์
          </button>
          <button
            type="button"
            className="neu-button"
            style={{ fontSize: '.82rem', padding: '5px 12px', borderColor: tempInt === 28 ? '#9dedc8' : undefined, color: tempInt === 28 ? '#9dedc8' : undefined }}
            onClick={() => setTemp(28)}
          >
            🌤️ 28°C สบาย ๆ (ในบทเรียน)
          </button>
          <button
            type="button"
            className="neu-button"
            style={{ fontSize: '.82rem', padding: '5px 12px', borderColor: tempInt === 36 ? '#9dedc8' : undefined }}
            onClick={() => setTemp(36)}
          >
            ☀️ 36°C กลางแจ้ง
          </button>
        </div>
      </div>

      {/* Visual Sensor to Board Transmission */}
      <div style={{ background: '#0b1a26', padding: '16px 20px', borderRadius: '16px', border: '1px solid #334d61' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: isTransmitting ? '#9dedc8' : '#527289', boxShadow: isTransmitting ? '0 0 10px #9dedc8' : 'none' }} />
            <span style={{ fontSize: '.88rem', color: isTransmitting ? '#9dedc8' : '#8da8bd', fontWeight: 'bold' }}>
              {isTransmitting ? 'กำลังส่งชุดรหัสผ่านสาย DATA...' : 'สายสัญญาณพร้อมส่ง'}
            </span>
          </div>

          <button
            type="button"
            className="neu-button"
            style={{ fontSize: '.85rem', padding: '5px 14px', color: '#ffe2a0', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={triggerSend}
          >
            <Send size={14} /> กดส่งรหัสอีกครั้ง
          </button>
        </div>

        {/* Transmission diagram SVG */}
        <svg viewBox="0 0 700 130" style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="DHT11 ส่งสัญญาณ Digital เข้าบอร์ด">
          {/* DHT11 Sensor */}
          <g transform="translate(30, 15)">
            <rect x="0" y="0" width="110" height="95" rx="10" fill="#1b4d75" stroke="#3d8bc6" strokeWidth="2" />
            <text x="55" y="24" textAnchor="middle" fill="#cbe6fd" fontSize="13" fontWeight="bold">DHT11</text>
            <text x="55" y="55" textAnchor="middle" fill="#ffe2a0" fontSize="16" fontWeight="bold">{tempInt} °C</text>
            <rect x="15" y="68" width="80" height="18" rx="4" fill="#0d2940" />
            <text x="55" y="81" textAnchor="middle" fill="#9dedc8" fontSize="10">แปลงเป็นรหัส 0/1</text>
          </g>

          {/* Wire & Data Flow */}
          <g>
            <path
              d="M140 62 L420 62"
              fill="none"
              stroke={isTransmitting ? '#9dedc8' : '#37576d'}
              strokeWidth="5"
              strokeDasharray={isTransmitting ? '8 8' : 'none'}
            />
            {/* Bits traveling */}
            <g transform={`translate(${isTransmitting ? 320 : 250}, 45)`} style={{ transition: 'transform 0.4s ease' }}>
              <rect x="-45" y="-14" width="90" height="24" rx="12" fill="#143e33" stroke="#9dedc8" strokeWidth="1.5" />
              <text x="0" y="2" textAnchor="middle" fill="#bfffe0" fontSize="11" fontWeight="bold">
                {tempBits.slice(0, 4)}...
              </text>
            </g>
            <text x="280" y="82" textAnchor="middle" fill="#8cb1c9" fontSize="11">
              สายส่งสัญญาณ Digital (ส่งทีละบิต)
            </text>
          </g>

          {/* Microcontroller */}
          <g transform="translate(420, 15)">
            <rect x="0" y="0" width="250" height="95" rx="10" fill="#162c3e" stroke="#486e8c" strokeWidth="2" />
            <text x="25" y="28" fill="#e2effa" fontSize="13" fontWeight="bold">บอร์ดไมโครคอนโทรลเลอร์</text>
            <rect x="20" y="40" width="210" height="42" rx="6" fill="#0b1b28" stroke="#2b475c" />
            <text x="35" y="66" fill="#92b2c9" fontSize="12">ถอดรหัสได้ค่า:</text>
            <text x="145" y="68" fill="#ffe2a0" fontSize="18" fontWeight="bold">{tempInt} °C</text>
          </g>
        </svg>
      </div>

      {/* The 8-Bit Breakdown - Clean and Friendly */}
      <div style={{ background: '#122433', padding: '16px 20px', borderRadius: '16px', border: '1px solid #365066', display: 'grid', gap: '14px' }}>
        <div>
          <h4 style={{ margin: 0, color: '#eef6fc', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#9dedc8" /> รหัส 8 บิตของอุณหภูมิ {tempInt} °C ที่วิ่งอยู่ในสาย:
          </h4>
          <p style={{ margin: '4px 0 0', color: '#97b1c4', fontSize: '.88rem' }}>
            เซนเซอร์ส่งไฟ <b>HIGH (ติด = 1)</b> และ <b>LOW (ดับ = 0)</b> เรียงกัน 8 ครั้ง:
          </p>
        </div>

        {/* 8 Big Clean Bit Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
          {tempBits.split('').map((bit, i) => {
            const isOne = bit === '1';
            const weight = weights[i];
            return (
              <div
                key={i}
                style={{
                  background: isOne ? '#1b4d3d' : '#0d1f2d',
                  border: `2px solid ${isOne ? '#9dedc8' : '#274256'}`,
                  borderRadius: '10px',
                  padding: '10px 4px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: isOne ? '0 0 10px rgba(157,237,200,0.15)' : 'none'
                }}
              >
                <div style={{ fontSize: '.72rem', color: isOne ? '#9dedc8' : '#698599' }}>
                  {isOne ? 'มีไฟ (1)' : 'ดับ (0)'}
                </div>
                <strong style={{ fontSize: '1.6rem', color: isOne ? '#bfffe0' : '#7290a4', display: 'block', margin: '2px 0' }}>
                  {bit}
                </strong>
                <div style={{ fontSize: '.72rem', color: isOne ? '#ffe2a0' : '#4f6c80', fontWeight: isOne ? 'bold' : 'normal' }}>
                  {isOne ? `+${weight}` : '0'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Binary Sum Equation */}
        <div style={{ background: '#0a1722', padding: '10px 16px', borderRadius: '10px', border: '1px solid #233b4e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '1rem', color: '#cfe2f0' }}>
            นำบิตที่เป็น <b>1</b> มารวมกัน:{' '}
            <span style={{ color: '#ffe2a0', fontWeight: 'bold' }}>
              {tempBits.split('').map((b, i) => (b === '1' ? weights[i] : null)).filter(Boolean).join(' + ') || '0'}
            </span>
            {' = '}
            <strong style={{ color: '#9dedc8', fontSize: '1.2rem' }}>{tempInt} °C</strong>
          </div>
          <span style={{ fontSize: '.82rem', color: '#88a6bc' }}>
            (รหัสไบนารี: {tempBits}₂)
          </span>
        </div>

        {/* Digital Waveform */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '.82rem', color: '#8aa8bd', marginBottom: '6px' }}>
            📈 รูปคลื่นไฟฟ้าจริงที่ขาสัญญาณ (ไฟสูง 3.3V / ไฟต่ำ 0V):
          </div>
          <div style={{ overflowX: 'auto' }}>
            <svg
              viewBox="0 0 660 135"
              style={{ width: '100%', minWidth: '550px', height: 'auto', background: '#091520', borderRadius: '10px', border: '1px solid #1e3547' }}
              role="img"
              aria-label={`รูปคลื่น Digital ${tempBits}`}
            >
              <text x="10" y="36" fill="#9dedc8" fontSize="11">HIGH (3.3V)</text>
              <text x="10" y="108" fill="#69879c" fontSize="11">LOW (0V)</text>
              <path d="M80 32 H650 M80 105 H650" stroke="#182e40" strokeWidth="1" strokeDasharray="4 4" />

              {tempBits.split('').map((bit, i) => {
                const x = startX + 25 + i * bitWidth;
                return (
                  <g key={i}>
                    <path d={`M${x} 15 V125`} stroke="#142838" strokeWidth="1" />
                    <text x={x + 36} y="22" textAnchor="middle" fill={bit === '1' ? '#9dedc8' : '#5f7d92'} fontSize="13" fontWeight="bold">
                      {bit}
                    </text>
                  </g>
                );
              })}

              <path d={wavePath} fill="none" stroke="#9dedc8" strokeWidth="3.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Crystal Clear Takeaway */}
      <div className="lab-key-idea" style={{ background: '#16362d', border: '1px solid #84dcb3', padding: '14px 18px', borderRadius: '14px' }}>
        <Lightbulb size={24} color="#a0f8cf" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '.95rem', color: '#e4f7ee', lineHeight: 1.6 }}>
          <b>สรุปให้จำง่าย:</b> เซนเซอร์ทั่วไปส่งได้แค่ <b>&quot;เปิด (1) หรือ ปิด (0)&quot;</b><br />
          แต่ <b>DHT11</b> ส่งรหัส 0 และ 1 ต่อกันเป็นคำเหมือนรหัสมอร์ส บอร์ดจึงรู้ค่าตัวเลข เช่น <b>{tempInt} °C</b> ได้ ทั้งที่สัญญาณในสายก็ยังคงเป็น <b>Digital</b> ล้วน ๆ ครับ!
        </p>
      </div>

      {/* Optional Details (Collapsible for advanced learners) */}
      <details style={{ background: '#102230', border: '1px solid #2d4557', borderRadius: '12px', padding: '10px 16px', color: '#97b1c4', fontSize: '.88rem' }}>
        <summary style={{ cursor: 'pointer', color: '#c7e3f5', fontWeight: 'bold' }}>
          🔍 ดูข้อมูลเพิ่มเติม: DHT11 ของจริงส่งความชื้นด้วยไหม? (กดเพื่อเปิดดู)
        </summary>
        <div style={{ marginTop: '10px', display: 'grid', gap: '8px', lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>
            ของจริง DHT11 ส่งข้อมูลทีละ <b>40 บิต (5 ไบต์)</b> โดยส่งค่าความชื้น <b>{humInt} %</b> (รหัส: <code style={{ color: '#bfffe0' }}>{humBits}</code>) และอุณหภูมิ <b>{tempInt} °C</b> (รหัส: <code style={{ color: '#ffe2a0' }}>{tempBits}</code>) พร้อมรหัสตรวจสอบความถูกต้อง (Checksum) ออกมาในครั้งเดียว
          </p>
        </div>
      </details>
    </section>
  );
}
