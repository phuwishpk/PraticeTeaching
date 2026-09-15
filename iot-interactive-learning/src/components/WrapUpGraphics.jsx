import { useState } from 'react';
import { Sprout, Cpu, Droplets, Wifi, WifiOff, Smartphone, ArrowRight, ArrowDown, Search, Cable, CircleCheck, Power } from 'lucide-react';
import { SignalComparison } from './SignalGraphics';
import './WrapUpGraphics.css';

function SoilPicture({ dry }) {
  return <svg className="wrap-soil-picture" viewBox="0 0 300 220" role="img" aria-label={`ภาพตัดกระถาง มีหัววัดอยู่ในดิน${dry ? 'แห้ง' : 'ชื้น'}`}>
    <path d="M150 105V35 M150 65Q112 23 91 47Q98 79 150 78 M150 51Q179 17 205 35Q198 64 150 67" fill="#315f45" stroke="#91d6a0" strokeWidth="5" strokeLinejoin="round" />
    <path d="M57 106H243L224 201H76Z" fill={dry ? '#725238' : '#354d53'} stroke="#c79568" strokeWidth="4" />
    <path d="M65 122H235" stroke="#c5a076" strokeWidth="3" />
    {dry ? <path d="M88 145l22 12-9 18 M110 157l22-8 M161 133l-10 25 22 15 M151 158l-16 17" fill="none" stroke="#b99a77" strokeWidth="3" /> : [95, 137, 182].map((x, i) => <path key={x} d={`M${x} ${142 + i % 2 * 18}q-14 18 0 21q14-3 0-21Z`} fill="#76c9df" />)}
    <rect x="208" y="74" width="17" height="26" rx="4" fill="#68d3c6" /><path d="M212 100v57 M221 100v57" stroke="#d7ecea" strokeWidth="4" /><path d="M216 74V56H266" fill="none" stroke="#69d6cf" strokeWidth="3" strokeDasharray="5 4" />
    <circle cx="267" cy="56" r="6" fill="#69d6cf" />
  </svg>;
}

function SoilChoice({ dry, onChange }) {
  return <div className="wrap-choice" role="group" aria-label="เลือกสภาพดินจำลอง">
    <button type="button" aria-pressed={dry} onClick={() => onChange(true)}>ดินแห้ง</button>
    <button type="button" aria-pressed={!dry} onClick={() => onChange(false)}>ดินชื้น</button>
  </div>;
}

function SensingGraphic() {
  const [dry, setDry] = useState(true);
  return <figure className="wrap-graphic wrap-sensing">
    <figcaption><Sprout aria-hidden="true" /><div><span>01 · รับข้อมูล</span><h3>ดูดินจริง แล้วค่อยแปลความหมายของค่า</h3></div></figcaption>
    <SoilChoice dry={dry} onChange={setDry} />
    <div className="wrap-sensing-body"><div><SoilPicture dry={dry} /><p className="wrap-picture-label">หัววัดสัมผัสดินบริเวณราก</p></div>
      <div className="wrap-meter" aria-live="polite"><span>ค่าดิบหลัง ADC · ตัวอย่าง</span><strong>{dry ? '3500' : '1800'}</strong><div className="wrap-meter-track"><i style={{ left: `${(dry ? 3500 : 1800) / 4095 * 100}%` }} /></div><div className="wrap-meter-scale"><span>0</span><span>4095</span></div><b>{dry ? 'ตรงช่วงดินแห้งที่ทดลองไว้' : 'ตรงช่วงดินชื้นที่ทดลองไว้'}</b><p>เทียบกับสภาพดินที่รู้แน่ก่อนตั้งเกณฑ์</p></div>
    </div>
    <p className="wrap-note">สมมติเซ็นเซอร์ที่ดินแห้งให้ค่าสูง ตัวเลขนี้ไม่ใช่เปอร์เซ็นต์ความชื้น และอาจต่างเมื่อเปลี่ยนดินหรือวงจร</p>
  </figure>;
}

function DecisionGraphic() {
  const [dry, setDry] = useState(true);
  return <figure className="wrap-graphic wrap-decision">
    <figcaption><Cpu aria-hidden="true" /><div><span>02 · ตัดสินใจ</span><h3>ตามเส้นทาง IF / ELSE ให้ถึงคำสั่ง</h3></div></figcaption>
    <SoilChoice dry={dry} onChange={setDry} />
    <div className="wrap-decision-tree" aria-live="polite">
      <div className="wrap-input-pill">อ่านค่าดินได้ {dry ? '3500' : '1800'}</div><ArrowDown aria-hidden="true" />
      <div className="wrap-diamond"><div><small>เงื่อนไขบนบอร์ด</small><strong>Soil &gt; 3000?</strong><span>{dry ? '3500 > 3000 → จริง' : '1800 > 3000 → เท็จ'}</span></div></div>
      <div className="wrap-branches"><div className={dry ? 'is-selected' : ''}><span>ใช่ · IF</span><ArrowDown aria-hidden="true" /><div><Droplets aria-hidden="true" /><strong>เริ่มรดน้ำช่วงสั้น</strong><p>บอร์ดสั่งวงจรขับปั๊ม</p></div></div><div className={!dry ? 'is-selected' : ''}><span>ไม่ใช่ · ELSE</span><ArrowDown aria-hidden="true" /><div><Power aria-hidden="true" /><strong>หยุดปั๊ม</strong><p>ดินยังอยู่ในช่วงชื้น</p></div></div></div>
      <p className="wrap-return">↶ หยุดตามเวลาที่กำหนด → รอน้ำซึม → อ่านค่าใหม่</p>
    </div>
    <p className="wrap-note">ค่าเท่ากับ 3000 จะไปทาง ELSE เพราะใช้เครื่องหมาย &gt; เกณฑ์และเวลารดน้ำต้องทดลองให้เหมาะกับงาน</p>
  </figure>;
}

function NetworkGraphic() {
  const [online, setOnline] = useState(true);
  return <figure className="wrap-graphic wrap-network">
    <figcaption><Wifi aria-hidden="true" /><div><span>03 · เชื่อมต่อ</span><h3>บอร์ดทำงานที่หน้างาน แอปรับข้อมูลผ่านเครือข่าย</h3></div></figcaption>
    <button type="button" className="wrap-network-toggle" aria-pressed={!online} onClick={() => setOnline(!online)}>{online ? 'ลองตัดการเชื่อมต่อ' : 'เชื่อมต่ออีกครั้ง'}</button>
    <div className="wrap-network-layout">
      <div className="wrap-board"><Cpu size={46} aria-hidden="true" /><strong>ESP32</strong><span>อ่านดิน + ควบคุมปั๊ม</span><b>เงื่อนไขในบอร์ดยังทำงาน</b></div>
      <div className={`wrap-wireless ${online ? 'is-online' : ''}`}>{online ? <Wifi size={36} aria-hidden="true" /> : <WifiOff size={36} aria-hidden="true" />}<span>{online ? 'ส่งค่าดินและสถานะ' : 'ส่งข้อมูลไม่ได้'}</span><ArrowRight aria-hidden="true" /></div>
      <div className="wrap-phone" aria-live="polite"><div className="wrap-phone-camera" /><span>สวนของฉัน · ข้อมูลตัวอย่าง</span><Sprout size={34} aria-hidden="true" /><strong>3500</strong><span>ค่าดินที่แอปได้รับล่าสุด</span><p>{online ? 'เชื่อมต่ออยู่' : 'ออฟไลน์ · ค่านี้อาจเก่าแล้ว'}</p><small>คำสั่งล่าสุด: เริ่มรดน้ำ</small></div>
    </div>
    <p className="wrap-note">เมื่อเครือข่ายขาด เงื่อนไขที่อยู่บนบอร์ดยังทำงานได้ถ้าอุปกรณ์และไฟเลี้ยงปกติ ส่วนแอปอาจแสดงค่าเก่า คำสั่งเปิดปั๊มไม่ได้ยืนยันว่าน้ำไหลจริง</p>
  </figure>;
}

const checks = [
  { title: 'ข้อมูลเข้า — มีค่าจากเซ็นเซอร์หรือยัง?', Icon: Sprout, detail: 'ดูค่าที่บอร์ดอ่าน แล้วลองเปลี่ยนสภาพดิน หากค่าไม่เปลี่ยน ให้ตรวจหัววัด ขาสัญญาณ และวิธีอ่านข้อมูลก่อน', result: 'สิ่งที่ต้องแยกให้ออก: อ่านค่าไม่ได้ หรืออ่านได้แต่ตีความผิด' },
  { title: 'เงื่อนไข — ค่านี้ควรสั่งเปิดจริงไหม?', Icon: Cpu, detail: 'ลองแทนค่าลงในเงื่อนไข เช่น 3500 > 3000 เป็นจริง แต่ 3000 > 3000 เป็นเท็จ แล้วตรวจว่ามีคำสั่งหยุดในโปรแกรมหรือไม่', result: 'สิ่งที่ต้องแยกให้ออก: โปรแกรมทำตามกฎ หรือกฎไม่ตรงกับงาน' },
  { title: 'อุปกรณ์ — วงจรขับและปั๊มตอบสนองไหม?', Icon: Cable, detail: 'ถ้าบอร์ดส่งคำสั่งถูกแล้ว ให้ตรวจวงจรขับและแหล่งจ่าย ถ้าปั๊มหมุนแต่น้ำไม่ออก ให้ตรวจน้ำต้นทางและท่อ', result: 'สิ่งที่ต้องแยกให้ออก: ส่งคำสั่งแล้ว ไม่เท่ากับเกิดผลจริงแล้ว' },
  { title: 'แอป — ค่าล่าสุดส่งถึงผู้ใช้หรือยัง?', Icon: Smartphone, detail: 'หากบอร์ดยังควบคุมปั๊มได้ แต่แอปไม่อัปเดต ให้ตรวจการเชื่อมต่อและบริการ พร้อมดูว่าข้อมูลบนแอปเป็นค่าเก่าหรือไม่', result: 'สิ่งที่ต้องแยกให้ออก: ปัญหาหน้างาน หรือปัญหาการส่งข้อมูล' },
];

function TroubleshootingGraphic() {
  return <figure className="wrap-graphic wrap-troubleshoot">
    <figcaption><Search aria-hidden="true" /><div><span>04 · ตรวจสอบ</span><h3>ไล่ตรวจทีละจุด แทนการเดาว่าเซ็นเซอร์เสีย</h3></div></figcaption>
    <div className="wrap-inspection-list">{checks.map(({ title, Icon, detail, result }, index) => <details key={title} open={index === 0 ? true : undefined}><summary><span className="wrap-check-number">{index + 1}</span><Icon aria-hidden="true" /><span>{title}</span></summary><div><p>{detail}</p><strong>{result}</strong></div></details>)}</div>
    <p className="wrap-note">แตะแต่ละจุดเพื่อเปิดวิธีตรวจ เลือกจุดเริ่มจากอาการที่เห็น แล้วตามเส้นทางข้อมูลไปยังส่วนถัดไป</p>
  </figure>;
}

export function WrapUpOverview() {
  const [dry, setDry] = useState(true);
  return <figure className="wrap-graphic wrap-overview">
    <figcaption><CircleCheck aria-hidden="true" /><div><span>ภาพรวม · ระบบรดน้ำหนึ่งระบบ</span><h3>รับรู้ → ตัดสินใจ → ลงมือทำ → ผู้ใช้ติดตาม</h3></div></figcaption>
    <SoilChoice dry={dry} onChange={setDry} />
    <div className="wrap-device-layer" aria-live="polite"><span className="wrap-layer-label">DEVICE · อุปกรณ์ที่หน้างาน</span>
      <div className="wrap-system-devices"><div className="wrap-system-sensor"><SoilPicture dry={dry} /><strong>Sensor · วัดดิน</strong><span>ค่าตัวอย่าง {dry ? '3500' : '1800'}</span></div><ArrowRight className="wrap-system-arrow" aria-hidden="true" /><div className="wrap-system-controller"><Cpu size={42} aria-hidden="true" /><strong>Controller</strong><span>Soil &gt; 3000?</span><b>{dry ? 'จริง → สั่งเริ่มรดน้ำ' : 'เท็จ → สั่งหยุด'}</b></div><ArrowRight className="wrap-system-arrow" aria-hidden="true" /><div className={`wrap-system-pump ${dry ? 'is-running' : ''}`}><div className="wrap-pump-circle"><Droplets size={44} aria-hidden="true" /></div><strong>Output · ปั๊มน้ำ</strong><span>รับคำสั่งผ่านวงจรขับ</span><b>{dry ? 'จ่ายน้ำช่วงสั้นตามคำสั่ง' : 'หยุดจ่ายน้ำ'}</b></div></div>
    </div>
    <div className="wrap-network-band"><Wifi aria-hidden="true" /><span><b>NETWORK</b> · ส่งค่าดินและสถานะคำสั่งจากบอร์ด</span><ArrowDown aria-hidden="true" /></div>
    <div className="wrap-service-band"><Smartphone size={34} aria-hidden="true" /><div><b>SERVICE · แอปของผู้ใช้</b><p>ค่าดิน {dry ? '3500' : '1800'} · คำสั่งล่าสุด: {dry ? 'เริ่มรดน้ำ' : 'หยุดปั๊ม'}</p></div></div>
    <p className="wrap-note">แบบจำลองสมมติว่าดินแห้งให้ค่าสูงและเครือข่ายเชื่อมต่ออยู่ ปั๊มทำงานตามเงื่อนไขบนบอร์ด ต้องกำหนดเวลาหยุดและวัดดินซ้ำหลังน้ำซึม</p>
  </figure>;
}

export function WrapUpActivity() {
  return <div className="wrap-activity" lang="th"><header><span>WRAP-UP · เชื่อมสิ่งที่เรียน</span><h2>แต่ละส่วนทำหน้าที่ต่างกัน</h2><p>ลองเปลี่ยนสภาพดิน แล้วตามดูข้อมูล คำสั่ง และผลที่ผู้ใช้เห็น</p></header><WrapUpOverview /><SignalComparison /><aside className="wrap-final-goal"><CircleCheck aria-hidden="true" /><p>เมื่อจบบทนี้ ควรบอกได้ว่าเซ็นเซอร์วัดอะไร บอร์ดตัดสินใจอย่างไร และ Output แต่ละตัวทำให้เกิดผลอะไร</p></aside></div>;
}

export default function WrapUpGraphic({ type }) {
  if (type === 'sensing') return <SensingGraphic />;
  if (type === 'decision') return <DecisionGraphic />;
  if (type === 'network') return <NetworkGraphic />;
  return <TroubleshootingGraphic />;
}
