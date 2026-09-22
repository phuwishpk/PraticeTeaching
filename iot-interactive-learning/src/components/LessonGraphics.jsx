import { useState } from 'react';
import { Sun, Thermometer, PersonStanding, Sprout, Lightbulb, Volume2, Monitor, Fan, Gauge, Droplets, ToggleRight, Cpu, ArrowRight, CheckCircle2, Radio } from 'lucide-react';
import { devices, sensorIds } from '../content/devices.js';
import { ImageWithModal } from './ImageWithModal';
import ActuatorDemo from './ActuatorDemo';
import SignalGraphic, { SignalComparison } from './SignalGraphics';
import WrapUpGraphic, { WrapUpOverview } from './WrapUpGraphics';

const icons = { sun: Sun, thermometer: Thermometer, person: PersonStanding, sprout: Sprout, light: Lightbulb, volume: Volume2, display: Monitor, fan: Fan, gauge: Gauge, water: Droplets, switch: ToggleRight };

export function DeviceIcon({ device, size = 40 }) {
  if (device.image) {
    return <ImageWithModal src={device.image} alt={device.name} style={{ width: size, height: size, objectFit: 'cover', borderRadius: '4px' }} />;
  }
  const Icon = icons[device.icon];
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}

export function FlowGraphic({ steps, label = 'ภาพสรุปการทำงาน', device }) {
  return (
    <figure className="concept-graphic" aria-label={label}>
      <figcaption>{label}</figcaption>
      <ol className="concept-steps">
        {steps.map((step, index) => {
          let NodeIcon;
          if (index === 0) {
            if (device && device.image) {
              NodeIcon = () => <img src={device.image} alt={device?.name || ""} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, margin: '-10px 0' }} />;
            } else {
              const First = device ? icons[device.icon] : Radio;
              NodeIcon = (props) => <First {...props} />;
            }
          } else if (index === 1) {
            NodeIcon = (props) => <Cpu {...props} />;
          } else {
            NodeIcon = (props) => <CheckCircle2 {...props} />;
          }
          return <li key={step}>
            <div className="concept-node"><NodeIcon size={28} strokeWidth={1.5} aria-hidden="true" /><span>{step}</span></div>
            {index < steps.length - 1 && <ArrowRight className="concept-arrow" size={22} aria-hidden="true" />}
          </li>;
        })}
      </ol>
    </figure>
  );
}

function DeviceLesson({ deviceId }) {
  const device = devices[deviceId];
  const [state, setState] = useState(0);
  const isInput = device.kind === 'input';
  return (
    <div className={`device-lesson ${isInput ? 'is-input' : 'is-output'}`}>
      <div className="device-introduction">
        <div className="device-portrait">
          {device.image ? <ImageWithModal src={device.image} alt={`ลักษณะอุปกรณ์ ${device.name}`} /> : <DeviceIcon device={device} size={72} />}
          <span>{isInput ? 'INPUT · รับข้อมูล' : 'OUTPUT · สร้างผลลัพธ์'}</span>
        </div>
        <div><span className="device-kicker">{isInput ? 'ตรวจวัดอะไร?' : 'ทำอะไรได้?'}</span><p className="device-purpose">{device.measures}</p></div>
      </div>
      <div className="device-facts">
        <section><h3>ทำงานอย่างไร</h3><p>{device.principle}</p></section>
        <section><h3>{isInput ? 'ส่งข้อมูลอะไรให้บอร์ด' : 'รับคำสั่งแบบไหน'}</h3><p>{device.signal}</p></section>
        <section><h3>นำไปใช้ทำอะไรได้บ้าง</h3><ul>{device.uses.map(use => <li key={use}>{use}</li>)}</ul></section>
        <section className="device-limit"><h3>ข้อจำกัดที่ต้องรู้</h3><p>{device.limit}</p></section>
      </div>
      <div className="device-simulation">
        <div className="device-simulation-header"><h3>ลองสลับสถานการณ์</h3><span>แบบจำลองเพื่อเรียนรู้</span></div>
        <div className="device-state-buttons" role="group" aria-label={`สถานการณ์จำลอง ${device.name}`}>
          {device.states.map((steps, index) => <button key={steps[0]} type="button" aria-pressed={state === index} onClick={() => setState(index)}>{steps[0]}</button>)}
        </div>
        <div aria-live="polite"><FlowGraphic steps={device.states[state]} label={isInput ? 'สภาพแวดล้อม → ข้อมูลที่วัด → ผลตามเงื่อนไขของบอร์ด' : 'คำสั่งจากบอร์ด → การทำงานของอุปกรณ์ → ผลที่เกิดขึ้น'} device={device} /></div>
        <p className="device-simulation-note">{device.scenario || (isInput ? 'ผลลัพธ์นี้เกิดจากเงื่อนไขที่เขียนให้บอร์ด เซ็นเซอร์ไม่ได้สั่ง Output ด้วยตัวเอง' : 'ภาพแสดงหลักการทำงาน ไม่ใช่แผนผังต่อวงจร')}</p>
      </div>
      <aside className="section-takeaway"><CheckCircle2 size={22} aria-hidden="true" /><div><h3>จบหัวข้อนี้ ผู้เรียนควร…</h3><p>{device.goal}</p></div></aside>
      {device.source && <p className="lesson-sources">อ่านเพิ่มเติม: <a href={device.source.url} target="_blank" rel="noreferrer">{device.source.label}</a></p>}
    </div>
  );
}

export function SectionExplanation({ section }) {
  if (section.deviceId) return <DeviceLesson key={section.deviceId} deviceId={section.deviceId} />;
  return <div className="section-explanation">
    <p className="lesson-slide-section-text">{section.text}</p>
    {section.detail && <p className="section-detail">{section.detail}</p>}
    {section.graphicType === 'actuator-demo' && <ActuatorDemo />}
    {section.signalGraphic && <SignalGraphic type={section.signalGraphic} />}
    {section.wrapGraphic && <WrapUpGraphic type={section.wrapGraphic} />}
    {!section.signalGraphic && !section.wrapGraphic && section.diagram && <FlowGraphic steps={section.diagram} label="ภาพสรุปท้ายหัวข้อ" device={section.diagramDevice ? devices[section.diagramDevice] : null} />}
    {section.image && <ImageWithModal src={section.image} alt={section.title || "Graphic"} style={{ width: '100%', borderRadius: '8px', margin: '1rem 0' }} />}
    {section.activity && <section className="lesson-discussion" aria-label={section.activity.title}>
      <h3>{section.activity.title}</h3>
      <ol>{section.activity.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <p><strong>คำถามชวนคิด:</strong> {section.activity.question}</p>
      <details><summary>เปิดแนวคำตอบหลังอภิปราย</summary><p>{section.activity.answer}</p></details>
    </section>}
    {section.takeaway && <aside className="section-takeaway"><CheckCircle2 size={22} aria-hidden="true" /><div><h3>ใจความสำคัญ</h3><p>{section.takeaway}</p></div></aside>}
  </div>;
}

export function LessonRecap({ lesson }) {
  return <section className="lesson-recap" aria-label="สรุปและจุดประสงค์การเรียนรู้ท้ายเนื้อหา">
    <span className="lesson-eyebrow">ทบทวนก่อนจบ</span>
    <h2 className="lesson-slide-section-title">{lesson.recap.title}</h2>
    {lesson.wrapOverview ? <WrapUpOverview /> : lesson.recap.signalGraphic ? <SignalGraphic type={lesson.recap.signalGraphic} /> : lesson.signalComparison ? <SignalComparison /> : lesson.recap.image ? <ImageWithModal src={lesson.recap.image} alt={lesson.recap.title || "Recap"} style={{ width: '100%', borderRadius: '8px', margin: '1rem 0' }} /> : <FlowGraphic steps={lesson.recap.diagram} label="ภาพรวมที่ควรจำ" device={lesson.recap.diagramDevice ? devices[lesson.recap.diagramDevice] : null} />}
    {lesson.deviceIds && <div className="device-recap-grid">{lesson.deviceIds.map(id => {
      const device = devices[id];
      return <div className="device-recap-item" key={id}><DeviceIcon device={device} size={28} /><div><strong>{device.name}</strong><span>{device.subtitle}</span></div></div>;
    })}</div>}
    <div className="lesson-outcomes"><h3>จุดประสงค์ของผู้เรียนเมื่อจบเนื้อหานี้</h3><p>ลองอธิบายด้วยคำของตัวเอง หากยังตอบไม่ได้ ให้ย้อนกลับไปดูหัวข้อที่เกี่ยวข้อง</p><ul>{lesson.goals.map(goal => <li key={goal}><CheckCircle2 size={20} aria-hidden="true" /><span>{goal}</span></li>)}</ul></div>
  </section>;
}

export function SensorCatalog() {
  return <div className="sensor-catalog" lang="th">
    <h2 className="text-glow-blue">เซ็นเซอร์แต่ละตัวทำอะไรได้บ้าง?</h2>
    <p>เลือกดูรายละเอียดเพื่อรู้หน้าที่ ตัวอย่างใช้งาน และลองสลับสถานการณ์</p>
    {sensorIds.map(id => <details className="catalog-device" key={id}><summary><DeviceIcon device={devices[id]} size={28} /><span><strong>{devices[id].name}</strong> · {devices[id].subtitle}</span></summary><DeviceLesson deviceId={id} /></details>)}
  </div>;
}
