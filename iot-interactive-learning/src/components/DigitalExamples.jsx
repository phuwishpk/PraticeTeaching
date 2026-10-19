import { useEffect, useReducer } from 'react';
import { ArrowRight, Check, Cpu, Hand, Lightbulb, Pause, Play, RotateCcw, StepForward, Volume2 } from 'lucide-react';
import { digitalScenarios, initialSimulation, simulationReducer } from '../content/digitalSimulation';
import './DigitalExamples.css';

function Scene({ scenario, input, output }) {
  return <svg viewBox="0 0 820 300" className={`example-scene example-scene-${scenario}`} data-input={input} data-output={output} aria-hidden="true">
    <path d="M35 254H785" stroke="#527082" strokeWidth="3" />
    <path d="M50 252V40H770V252" fill="#122735" stroke="#354f62" strokeWidth="3" />
    {[85, 235, 385, 535, 685].map(x => <path key={x} d={`M${x} 254l-45 26`} stroke="#2b4455" strokeWidth="2" />)}
    {scenario === 'switch' ? <g transform="translate(145 58)">
      <rect width="160" height="180" rx="24" fill="#263b50" stroke="#688294" strokeWidth="3" />
      <circle cx="20" cy="20" r="4" fill="#849da9" /><circle cx="140" cy="160" r="4" fill="#849da9" />
      <rect x="42" y="28" width="76" height="120" rx="16" fill="#0b1723" />
      <rect className="example-switch-rocker" x="47" y={input ? 76 : 33} width="66" height="67" rx="12" fill={input ? '#8becbf' : '#99acc6'} />
      <path d="M80 44v14 M73 125a7 7 0 1 0 14 0a7 7 0 1 0-14 0" stroke="#132d36" strokeWidth="3" fill="none" />
    </g> : scenario === 'motion' ? <>
      <g transform="translate(130 65)"><path d="M0 0L280 175H0Z" fill={input ? '#91efbf20' : '#7791b409'} stroke={input ? '#8becbf' : '#3d5765'} strokeDasharray="6 7" /><rect x="-32" y="-20" width="64" height="48" rx="12" fill="#dce6ed" /><circle r="16" fill={input ? '#8becbf' : '#8ba5ba'} /></g>
      <g className="example-person" transform={`translate(${input ? 310 : 590} 120)`} stroke="#cfdbf8" strokeWidth="9" strokeLinecap="round" fill="none"><circle cx="0" cy="-10" r="17" fill="#cfdbf8" stroke="none" /><path d="M0 18v52 M0 33l-24 27 M0 33l28 14 M0 70l-23 44 M0 70l30 40" /></g>
      <path d="M208 226h122m-14-9l14 9-14 9" stroke="#8becbf" strokeWidth="3" fill="none" opacity={input ? 1 : .2} />
    </> : <g transform="translate(145 60)">
      <rect x="-8" y="-8" width="137" height="200" rx="4" fill="#081923" stroke="#7791a4" strokeWidth="5" />
      <path className="example-door" d={input ? 'M0 0L84 28V216L0 183Z' : 'M0 0H120V183H0Z'} fill={input ? '#286355' : '#314b61'} stroke="#92b4c0" strokeWidth="3" />
      <circle cx={input ? 70 : 102} cy={input ? 115 : 95} r="5" fill="#f4d691" />
      <rect x="124" y="18" width="12" height="30" rx="4" fill={input ? '#91efbf' : '#879eb6'} />
    </g>}
    <g transform="translate(405 157)"><path d="M-35 0h90m-14-12l14 12-14 12" stroke={input ? '#90edc4' : '#526c86'} strokeWidth="4" fill="none" strokeDasharray="8 5" className="example-signal-path" /></g>
    {scenario === 'door' ? <g transform="translate(642 138)"><rect x="-46" y="-48" width="92" height="105" rx="18" fill={output ? '#cf685e' : '#34495d'} stroke={output ? '#ffd1aa' : '#8195a9'} strokeWidth="3" /><circle r="27" fill="#152c3b" /><circle r="15" fill={output ? '#ffcf8e' : '#6b829a'} />{output && <g className="example-alarm-waves" stroke="#ffcf8e" fill="none" strokeWidth="4"><path d="M-64-30q-25 30 0 60 M64-30q25 30 0 60 M-80-45q-35 45 0 90 M80-45q35 45 0 90" /></g>}</g> : <g transform="translate(642 132)">
      <circle className="example-lamp-glow" r="85" fill="#ffe3a5" opacity={output ? .12 : 0} /><circle r="65" fill="#ffdc8f" opacity={output ? .1 : 0} />
      <path d="M-16 25C-65-20-30-58 0-58S65-20 16 25V45H-16Z" fill={output ? '#ffe2a0' : '#334b61'} stroke={output ? '#fff2cb' : '#8195a9'} strokeWidth="4" />
      <path d="M-18 34H18 M-18 44H18 M-9 53H9" stroke="#9bb1c1" strokeWidth="5" strokeLinecap="round" />
      {output && <g stroke="#ffe2a0" strokeWidth="4" strokeLinecap="round"><path d="M0-80v-12 M57-56l10-10 M-57-56l-10-10 M76 0h12 M-76 0h-12" /></g>}
    </g>}
  </svg>;
}

function History({ history }) {
  const step = 76;
  let path = `M70 ${history[0] ? 28 : 94}`;
  history.forEach((bit, i) => { if (i) path += `V${bit ? 28 : 94}`; path += `H${70 + (i + 1) * step}`; });
  return <div className="example-history"><div><b>กราฟที่บอร์ดอ่านได้</b><span>เพิ่มหนึ่งช่องเมื่อบอร์ดรับค่า · ขวาสุดคือล่าสุด</span></div><svg viewBox="0 0 700 140" role="img" aria-label={`ค่าที่บอร์ดอ่านตามลำดับ: ${history.join(', ')}`}><text x="6" y="33">1 HIGH</text><text x="6" y="99">0 LOW</text><path d="M70 28H685 M70 94H685" className="example-history-grid" /><path d={path} className="example-history-wave" />{history.map((bit, i) => <text key={i} x={70 + (i + .5) * step} y="129" textAnchor="middle">{bit}</text>)}</svg></div>;
}

export default function DigitalExamples({ initialScenario = 'switch', showScenarioPicker = true }) {
  const [state, dispatch] = useReducer(simulationReducer, initialScenario, initialSimulation);
  const { scenario, input, readBit, output, phase, running, automatic, history } = state;
  const example = digitalScenarios[scenario];
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => dispatch({ type: 'tick' }), 1000);
    return () => clearTimeout(timer);
  }, [running, phase, input, scenario]);
  const toggle = () => dispatch({ type: 'toggle' });
  const nextAction = input ? example.off : example.on;
  return <section className="digital-examples" aria-label="จำลองสถานการณ์ Digital">
    <header className="example-heading"><div><span>DIGITAL IN ACTION · กดแล้วเห็นผล</span><h2>ลองทำให้โลกจริง ส่งค่า 0 และ 1</h2><p>เลือกตัวอย่าง แล้วกดที่ภาพหรือปุ่มด้านล่าง</p></div><button type="button" className="example-reset" onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={19} aria-hidden="true" />เริ่มใหม่</button></header>
    {showScenarioPicker && <div className="example-scenarios" role="group" aria-label="เลือกสถานการณ์จำลอง">{Object.entries(digitalScenarios).map(([id, item], i) => <button type="button" key={id} aria-pressed={scenario === id} onClick={() => dispatch({ type: 'scenario', scenario: id })}><span>0{i + 1}</span>{item.title}</button>)}</div>}
    <div className="example-stage">
      <div className="example-stage-labels"><span>{example.input}: <b>{input ? example.active : example.idle}</b></span><span className={output ? 'example-output-on' : ''}>{output ? <Lightbulb size={19} aria-hidden="true" /> : null}{output ? example.resultOn : example.resultOff}</span></div>
      <button type="button" className="example-scene-button" aria-label={`กดที่ภาพ: ${nextAction}`} aria-pressed={input} onClick={toggle}><Scene scenario={scenario} input={input} output={output} /><span className="example-scene-hint"><Hand size={18} aria-hidden="true" />กดที่ภาพเพื่อ{nextAction}</span></button>
    </div>
    <div className="example-controls"><button type="button" className="example-trigger" onClick={toggle}><Hand size={24} aria-hidden="true" />{nextAction}<ArrowRight size={22} aria-hidden="true" /></button><div className="example-playback"><div role="group" aria-label="วิธีแสดงการจำลอง"><button type="button" aria-pressed={automatic} onClick={() => dispatch({ type: 'mode', automatic: true })}>ภาพเคลื่อนไหว</button><button type="button" aria-pressed={!automatic} onClick={() => dispatch({ type: 'mode', automatic: false })}>อธิบายทีละขั้น</button></div>{phase < 3 ? automatic ? <button type="button" className="example-play-control" onClick={() => dispatch({ type: running ? 'pause' : 'play' })}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'หยุดชั่วคราว' : 'เล่นต่อ'}</button> : <button type="button" className="example-play-control" onClick={() => dispatch({ type: 'step' })}><StepForward size={18} />ขั้นถัดไป</button> : <button type="button" className="example-play-control" onClick={() => dispatch({ type: 'replay' })}><RotateCcw size={18} />ดูขั้นตอนซ้ำ</button>}</div></div>
    <ol className="example-steps" aria-label="ลำดับการทำงาน"><li data-current={phase === 1}><span className="example-step-number">1</span><div><b>เหตุการณ์เกิดขึ้น</b><p>{input ? example.active : example.idle}</p></div></li><li data-current={phase === 2}><Cpu size={30} aria-hidden="true" /><div><b>บอร์ดอ่านขาสัญญาณ</b><p>{phase === 1 ? 'รออ่านค่าใหม่…' : <><strong>{readBit}</strong> · {readBit ? 'HIGH' : 'LOW'}</>}</p></div></li><li data-current={phase === 3}>{scenario === 'door' ? <Volume2 size={30} aria-hidden="true" /> : <Lightbulb size={30} aria-hidden="true" />}<div><b>โปรแกรมสั่ง Output</b><p>{phase < 3 ? 'ยังคงผลเดิม รอประมวลผล…' : output ? example.resultOn : example.resultOff}</p></div></li></ol>
    <p className="example-status" role="status">{phase === 1 ? `ขั้นที่ 1: ${input ? example.active : example.idle} → ต่อไปบอร์ดจะอ่านค่า` : phase === 2 ? `ขั้นที่ 2: บอร์ดอ่านได้ ${readBit} (${readBit ? 'HIGH' : 'LOW'}) → ต่อไปโปรแกรมสั่ง ${example.output}` : `ครบแล้ว: อ่านได้ ${readBit} → ${output ? example.resultOn : example.resultOff}`}</p>
    <div className="example-rule"><Check size={22} aria-hidden="true" /><p><b>กติกาของโปรแกรมนี้:</b> {example.rule}</p></div>
    <History history={history} />
    <p className="example-note">{example.note} การทำงานของ Output เกิดจากโปรแกรมในบอร์ด ไม่ได้เกิดจากเซนเซอร์สั่งโดยตรง ภาพชะลอแต่ละขั้นเพื่อการสอน ไม่ใช่เวลาตอบสนองจริง</p>
  </section>;
}
