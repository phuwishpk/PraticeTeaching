import ProblemActivity from '../components/ProblemActivity';
import ClassroomChoiceActivity from '../components/ClassroomChoiceActivity';
import { SignalActivityReview } from '../components/SignalGraphics';
import { SensorCatalog } from '../components/LessonGraphics';
import React, { useEffect, useState, useMemo } from 'react';
import { useRoom } from '../context/RoomContext';
import { CHAPTER_FLOW, answerProgress, rankStudents } from '../../shared/roomState';
import { formatDuration } from '../format';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import ReactConfetti from 'react-confetti';
import { LessonSlideshow } from '../components/LessonContent';
import { ImageWithModal } from '../components/ImageWithModal';
import { lessons, sensorQuizExplanation } from '../content/lessons';
import { sensorCatalogOptions, sensorCatalogQuestions } from '../content/sensorCatalogActivity';
import CountdownTimer from '../components/CountdownTimer';

// react-use was a 2 MB dependency pulled in for this one hook, and it drags nano-css in
// with it — cost the learners pay on every page load for a confetti canvas the teacher sees.
function useWindowSize() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

// ─── Floating Emojis Overlay ──────────────────────────────────────────────────
// The sideways drift has to be the same on every render. Rolling it fresh each time handed
// framer-motion a new destination for every emoji on screen, so all of them restarted from
// wherever they were — several times a second, on the machine driving the projector.
function driftOf(id = '') {
  let hash = 0;
  for (let index = 0; index < id.length; index++) hash = (hash * 31 + id.charCodeAt(index)) | 0;
  return (Math.abs(hash) % 100) - 50;
}

// Memoised because it now maintains its own state and doesn't depend on roomState
const FloatingEmojis = React.memo(function FloatingEmojis() {
  const [emojis, setEmojis] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const p = e.detail;
      setEmojis(prev => [...prev, { id: p.id, emoji: p.emoji, name: p.name || '', x: p.x }].slice(-30));
      setTimeout(() => {
        setEmojis(prev => prev.filter(em => em.id !== p.id));
      }, 3000);
    };
    window.addEventListener('room-emoji', handler);
    return () => window.removeEventListener('room-emoji', handler);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      <AnimatePresence>
        {emojis.map(e => (
          <motion.div key={e.id}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: '-100vh', x: driftOf(e.id), opacity: 0, scale: 1.5 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            style={{ position: 'absolute', bottom: 0, left: `${e.x}%`, fontSize: '3rem' }}>
            <div style={{ position: 'relative' }}>
              {e.emoji}
              <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', fontSize: '1rem', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                {e.name}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  );
});

// ─── Scene 1: Lobby ───────────────────────────────────────────────────────────
function HostLobby() {
  const { roomState, joinUrl, setJoinOpen, removeStudent } = useRoom();
  const qrUrl = `${joinUrl}?pin=${roomState.pin}`;
  
  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel"
        style={{ padding: '3rem', width: '80%', maxWidth: 1000, display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'center' }}>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: '0 0 1rem 0', textAlign: 'center' }}>Welcome to IoT Lab 🚀</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem' }}>สแกน QR Code หรือเข้าเว็บเพื่อเข้าห้องเรียน</p>
          
          <div style={{ background: '#fff', padding: '1rem', borderRadius: 16, marginBottom: '2rem' }}>
            <QRCodeSVG value={qrUrl} size={200} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,240,255,0.1)', padding: '1rem 2rem', borderRadius: 20, border: '1px solid rgba(0,240,255,0.3)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>PIN:</span>
            <span style={{ color: 'var(--neon-blue)', fontSize: '3rem', fontWeight: 800, letterSpacing: '0.2em' }}>{roomState.pin}</span>
          </div>
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '3rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: 'var(--neon-purple)' }}>นักเรียนที่เข้าร่วมแล้ว: {roomState.students.length} คน</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: roomState.joinOpen ? 'var(--neon-green)' : '#ffb86c', fontSize: '0.9rem' }}>
              {roomState.joinOpen ? '🔓 เปิดรับนักเรียนเข้าห้อง' : '🔒 ปิดรับนักเรียนใหม่'}
            </span>
            <button type="button" className="neu-button" onClick={() => setJoinOpen(!roomState.joinOpen)}
              style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
              {roomState.joinOpen ? 'ปิดรับ' : 'เปิดรับอีกครั้ง'}
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: '0.5rem 0 0 0' }}>
            กดชื่อเพื่อนำนักเรียนคนนั้นออกจากห้อง (ทำได้จากแถบ PIN ด้านบนทุกขั้นตอนเช่นกัน)
          </p>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignContent: 'flex-start', marginTop: '1rem' }}>
            <AnimatePresence>
              {roomState.students.length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>รอเพื่อนๆ สักครู่...</p>
              )}
              {roomState.students.map((student) => (
                <motion.button type="button" key={student.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  title={`นำ "${student.name}" ออกจากห้อง`}
                  onClick={() => { if (window.confirm(`นำ "${student.name}" ออกจากห้อง?\n\nคะแนนและคำตอบจะยังถูกเก็บไว้`)) removeStudent(student.name); }}
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: '0.8rem 1.5rem', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                  🧑‍🔬 {student.name}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Scene 2: 3-Layer Architecture (Polling) ──────────────────────────────────
function HostArchitecture() {
  const { roomState, setVoteItem } = useRoom();
  const currentItem = roomState.currentVoteItem;
  const votes = roomState.architectureVotes?.[currentItem] || {};
  const totalVotes = Object.keys(votes).length;
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = (roomState.questionDurationMs ?? 30000) - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime, roomState.questionDurationMs, currentItem]);

  const getPercent = (layer) => totalVotes === 0 ? 0 : Math.round((Object.values(votes).filter(v => v === layer).length / totalVotes) * 100);
  const { total: totalStudents, allAnswered: isAllAnswered } = answerProgress(roomState, votes);
  const showResults = isTimeUp || isAllAnswered;

  const items = [
    { id: 'esp32', name: 'บอร์ด ESP32', icon: '🎛️', image: '/images/esp32_board_1789207904514.jpg', correct: 'device' },
    { id: 'wifi', name: 'Wi-Fi Router', icon: '📶', image: '/wifi_router_1789451961348.jpg', correct: 'network' },
    { id: 'cloud', name: 'Cloud Server', icon: '☁️', correct: 'service' }
  ];
  
  const activeItemData = items.find(i => i.id === currentItem);
  const currentIndex = items.findIndex(i => i.id === currentItem);

  const handleNextItem = () => {
    if (currentIndex < items.length - 1) {
      setVoteItem(items[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={(roomState.questionDurationMs ?? 30000) / 1000} size={70} stopped={isAllAnswered} />
        <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>โหวต: อุปกรณ์นี้อยู่ชั้นไหน?</h1>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '90%', maxWidth: 1200, justifyContent: 'center' }}>
        
        {/* Left: Voting Control */}
        <div className="glass-panel flex-center" style={{ flex: 1, padding: '2rem', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-secondary)', margin: 0 }}>ส่งคำถามให้นักเรียน:</h2>
          {activeItemData.image ? (
            <div style={{ margin: '2rem 0' }}>
              <ImageWithModal src={activeItemData.image} alt={activeItemData.name} style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)' }} />
            </div>
          ) : (
            <motion.div key={currentItem} initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{ fontSize: '8rem', filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.5))' }}>
              {activeItemData.icon}
            </motion.div>
          )}
          <h2 style={{ margin: 0, color: 'var(--neon-blue)', fontSize: '2rem' }}>{activeItemData.name}</h2>
          
          <div style={{ marginTop: '1rem', color: showResults ? (isAllAnswered ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)', fontWeight: 'bold' }}>
            {showResults
              ? (isAllAnswered ? `✅ ตอบครบทุกคนแล้ว (${totalVotes}/${totalStudents} คน)` : `⏰ หมดเวลา (${totalVotes}/${totalStudents} คน)`)
              : `⏳ กำลังรอคำตอบ... (${totalVotes}/${totalStudents} คน)`}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {currentIndex < items.length - 1 && (
              <button className="neu-button" onClick={handleNextItem} style={{ padding: '1rem 2rem', color: 'var(--neon-green)' }}>
                ถัดไป: {items[currentIndex + 1].name} ▶
              </button>
            )}
          </div>
        </div>

        {/* Right: The 3 Layers & Results */}
        <div className="glass-panel" style={{ flex: 2, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Layer 3: Service */}
          <div style={{ border: `2px solid rgba(188,19,254,0.3)`, borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(188,19,254,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: 'var(--neon-purple)', margin: '0 0 0.5rem 0' }}>Layer 3: Service (ชั้นบริการ)</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>คลาวด์/แอปพลิเคชัน/แสดงผล</p>
              </div>
              {showResults && <span style={{ fontSize: '2rem', color: 'var(--neon-purple)', fontWeight: 'bold' }}>{getPercent('service')}%</span>}
            </div>
            {showResults && (
              <div style={{ width: '100%', height: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${getPercent('service')}%` }} style={{ height: '100%', background: 'var(--neon-purple)' }} />
              </div>
            )}
          </div>

          {/* Layer 2: Network */}
          <div style={{ border: `2px solid rgba(4,217,255,0.3)`, borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(4,217,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: 'var(--neon-green)', margin: '0 0 0.5rem 0' }}>Layer 2: Network (ชั้นเครือข่าย)</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>ถนน/Wi-Fi/4G</p>
              </div>
              {showResults && <span style={{ fontSize: '2rem', color: 'var(--neon-green)', fontWeight: 'bold' }}>{getPercent('network')}%</span>}
            </div>
            {showResults && (
              <div style={{ width: '100%', height: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${getPercent('network')}%` }} style={{ height: '100%', background: 'var(--neon-green)' }} />
              </div>
            )}
          </div>

          {/* Layer 1: Device */}
          <div style={{ border: `2px solid rgba(0,240,255,0.3)`, borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,240,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: 'var(--neon-blue)', margin: '0 0 0.5rem 0' }}>Layer 1: Device (ชั้นอุปกรณ์)</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>หน้างาน/เซนเซอร์/ESP32</p>
              </div>
              {showResults && <span style={{ fontSize: '2rem', color: 'var(--neon-blue)', fontWeight: 'bold' }}>{getPercent('device')}%</span>}
            </div>
            {showResults && (
              <div style={{ width: '100%', height: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${getPercent('device')}%` }} style={{ height: '100%', background: 'var(--neon-blue)' }} />
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

// ─── Scene 3: The Problem ─────────────────────────────────────────────────────
function HostProblem() {
  return <ProblemActivity audience="teacher" />;
}

function HostDigital() {
  const { roomState } = useRoom();
  const votes = roomState.digitalVotes || {};
  const totalVotes = Object.keys(votes).length;
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = (roomState.questionDurationMs ?? 30000) - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime, roomState.questionDurationMs]);

  const { total: totalStudents, allAnswered: isAllAnswered } = answerProgress(roomState, votes);
  const showResults = isTimeUp || isAllAnswered;

  const options = [
    { id: '2_states', label: '2 ระดับลอจิก (LOW/0 และ HIGH/1)' },
    { id: '10_states', label: '10 สถานะ (เช่น 0 ถึง 9)' },
    { id: 'infinite', label: 'นับไม่ถ้วน (ค่าต่อเนื่อง)' },
    { id: 'none', label: 'ไม่มีสถานะที่แน่นอน' }
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={(roomState.questionDurationMs ?? 30000) / 1000} size={70} stopped={isAllAnswered} />
        <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>สัญญาณ Digital แบบไบนารี</h1>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '95%', maxWidth: 1200, minHeight: '60vh', justifyContent: 'center' }}>
        
        {/* Left: Theory */}
        <div className="glass-panel" style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ padding: '2rem', border: '2px solid var(--neon-blue)', borderRadius: 16, background: 'rgba(0,240,255,0.05)' }}>
            <h3 style={{ color: 'var(--neon-blue)', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>1. สัญญาณ Digital</h3>
            <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, lineHeight: 1.6 }}>
              พิจารณาระดับลอจิกของแต่ละบิต แยกจากจำนวนค่าที่ข้อมูลหลายบิตสามารถแทนได้
            </p>
          </div>
          <h2 style={{ textAlign: 'center', color: 'var(--neon-blue)' }}>คำถาม: Digital แบบไบนารีใช้กี่ระดับลอจิก?</h2>
        </div>

        {/* Right: Activity */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--neon-green)', margin: 0 }}>ผลโหวต</h2>
            <div style={{ color: showResults ? (isAllAnswered ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)', fontWeight: 'bold' }}>
              {showResults
                ? (isAllAnswered ? `✅ ตอบครบทุกคนแล้ว (${totalVotes}/${totalStudents} คน)` : `⏰ หมดเวลา (${totalVotes}/${totalStudents} คน)`)
                : `⏳ กำลังรอคำตอบ... (${totalVotes}/${totalStudents} คน)`}
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            {options.map(opt => {
              const count = Object.values(votes).filter(v => v === opt.id).length;
              const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
              const isCorrect = opt.id === '2_states';
              return (
                <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.2rem', color: showResults && isCorrect ? 'var(--neon-green)' : 'white' }}>
                      {opt.label} {showResults && isCorrect && '🎯'}
                    </span>
                    {showResults && <span style={{ fontSize: '1.2rem' }}>{count} โหวต ({pct}%)</span>}
                  </div>
                  {showResults && (
                    <div style={{ width: '100%', height: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} style={{ height: '100%', background: isCorrect ? 'var(--neon-green)' : 'var(--neon-blue)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
      <SignalActivityReview kind="digital" revealed={showResults} />
    </div>
  );
}

function HostAnalog() {
  const { roomState } = useRoom();
  const votes = roomState.analogVotes || {};
  const totalVotes = Object.keys(votes).length;
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = (roomState.questionDurationMs ?? 30000) - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime, roomState.questionDurationMs]);

  const { total: totalStudents, allAnswered: isAllAnswered } = answerProgress(roomState, votes);
  const showResults = isTimeUp || isAllAnswered;

  const options = [
    { id: 'binary', label: 'มีแค่สถานะเปิดกับปิด (0 กับ 1)' },
    { id: 'continuous', label: 'มีค่าต่อเนื่อง เช่น แรงดันที่ค่อย ๆ เปลี่ยน' },
    { id: 'faster', label: 'ส่งข้อมูลได้เร็วกว่ามาก' },
    { id: 'less_wires', label: 'ใช้สายไฟน้อยกว่า' }
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={(roomState.questionDurationMs ?? 30000) / 1000} size={70} stopped={isAllAnswered} />
        <h1 className="signal-analog-title" style={{ fontSize: '3rem', margin: 0 }}>สัญญาณค่าต่อเนื่อง (Analog)</h1>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '95%', maxWidth: 1200, minHeight: '60vh', justifyContent: 'center' }}>
        
        {/* Left: Theory */}
        <div className="glass-panel" style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ padding: '2rem', border: '2px solid #ffd08a', borderRadius: 16, background: 'rgba(255,196,106,0.06)' }}>
            <h3 style={{ color: '#ffd08a', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>2. สัญญาณ Analog</h3>
            <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, lineHeight: 1.6 }}>
              สัญญาณแบบนี้เหมาะกับสิ่งที่เปลี่ยนแปลงตลอดเวลา เช่น ความสว่าง หรือ อุณหภูมิ
            </p>
          </div>
          <h2 style={{ textAlign: 'center', color: '#ffd08a' }}>คำถาม: สัญญาณ Analog แตกต่างจาก Digital อย่างไร?</h2>
        </div>

        {/* Right: Activity */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--neon-green)', margin: 0 }}>ผลโหวต</h2>
            <div style={{ color: showResults ? (isAllAnswered ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)', fontWeight: 'bold' }}>
              {showResults
                ? (isAllAnswered ? `✅ ตอบครบทุกคนแล้ว (${totalVotes}/${totalStudents} คน)` : `⏰ หมดเวลา (${totalVotes}/${totalStudents} คน)`)
                : `⏳ กำลังรอคำตอบ... (${totalVotes}/${totalStudents} คน)`}
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            {options.map(opt => {
              const count = Object.values(votes).filter(v => v === opt.id).length;
              const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
              const isCorrect = opt.id === 'continuous';
              return (
                <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.2rem', color: showResults && isCorrect ? 'var(--neon-green)' : 'white' }}>
                      {opt.label} {showResults && isCorrect && '🎯'}
                    </span>
                    {showResults && <span style={{ fontSize: '1.2rem' }}>{count} โหวต ({pct}%)</span>}
                  </div>
                  {showResults && (
                    <div style={{ width: '100%', height: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} style={{ height: '100%', background: isCorrect ? 'var(--neon-green)' : 'var(--neon-blue)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
      <SignalActivityReview kind="analog" revealed={showResults} />
    </div>
  );
}


// ─── Scene 6: Sensor Catalog ────────────────────────────────────────────────
function HostCatalog() {
  const { roomState, setCatalogQuestion } = useRoom();
  const qIndex = roomState.catalogCurrentQuestion || 1;
  const votes = roomState.catalogVotes?.[qIndex] || {};
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = (roomState.questionDurationMs ?? 30000) - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime, roomState.questionDurationMs, qIndex]);

  const { answered: totalVotesCount, total: totalStudents, allAnswered: isAllAnswered } = answerProgress(roomState, votes);
  const isRevealed = isTimeUp || isAllAnswered;
  const currentQ = sensorCatalogQuestions[qIndex];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem', position: 'relative' }}>
      {/* Navigation Buttons for Teacher */}
      <div style={{ display: 'flex', gap: '1rem', zIndex: 10, marginBottom: '-10px' }}>
        <button className="neu-button" disabled={qIndex <= 1} onClick={() => setCatalogQuestion(qIndex - 1)}>
          ⬅️ ข้อก่อนหน้า
        </button>
        <div style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)' }}>
          คำถามที่ {qIndex} / 4
        </div>
        <button className="neu-button" disabled={qIndex >= 4} onClick={() => setCatalogQuestion(qIndex + 1)}>
          ข้อต่อไป ➡️
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={(roomState.questionDurationMs ?? 30000) / 1000} size={70} stopped={isAllAnswered} />
        <h1 className="text-glow-blue" style={{ fontSize: '2.2rem', margin: 0, textAlign: 'center', maxWidth: '800px', lineHeight: '1.4' }}>
          {currentQ.prompt}
        </h1>
      </div>
      
      <div style={{ fontSize: '1.2rem', color: isRevealed ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
        โหวตแล้ว: {totalVotesCount} / {totalStudents} คน
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%', maxWidth: 800 }}>
        {sensorCatalogOptions.map(opt => {
          const count = Object.values(votes).filter(v => v === opt.id).length;
          const pct = totalVotesCount === 0 ? 0 : Math.round((count / totalVotesCount) * 100);
          const isCorrect = opt.id === currentQ.correct;

          return (
            <div key={opt.id} className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: isRevealed && isCorrect ? '3px solid #50fa7b' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{opt.icon}</div>
              <h3 style={{ margin: '0 0 1rem 0', color: opt.color }}>{opt.label}</h3>
              {isRevealed ? (
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: isCorrect ? '#50fa7b' : 'white' }}>
                    {count} คน ({pct}%)
                  </div>
                  {isCorrect && <div style={{ color: '#50fa7b', fontSize: '1.2rem', marginTop: '10px' }}>✅ คำตอบที่ถูกต้อง!</div>}
                </div>
              ) : (
                <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>...</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scene 7: Sensor Quiz ──────────────────────────────────────────────────
function HostQuiz() {
  const { roomState, revealQuiz } = useRoom();
  const votes = roomState.quizVotes || {};
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = (roomState.questionDurationMs ?? 30000) - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime, roomState.questionDurationMs]);
  
  const options = [
    { id: 'ldr', label: 'LDR (แสง)', color: '#ffb86c' },
    { id: 'dht', label: 'DHT11 (อุณหภูมิ)', color: '#ff79c6' },
    { id: 'pir', label: 'PIR (เคลื่อนไหว)', color: '#8be9fd' },
    { id: 'soil', label: 'Soil Moisture (ดิน)', color: '#50fa7b' }
  ];

  const total = Object.keys(votes).length || 1; // prevent div/0
  const { total: totalStudents, allAnswered: isAllAnswered } = answerProgress(roomState, votes);
  const isRevealed = roomState.quizRevealed || isTimeUp || isAllAnswered;

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={(roomState.questionDurationMs ?? 30000) / 1000} size={70} stopped={isAllAnswered || roomState.quizRevealed} />
        <h1 className="text-glow-blue" style={{ fontSize: '2.5rem', margin: 0, textAlign: 'center' }}>
          "อยากทำระบบเปิดไฟหน้าบ้านอัตโนมัติตอนกลางคืน ต้องใช้เซนเซอร์อะไร?"
        </h1>
      </div>
      
      <div className="glass-panel" style={{ width: '80%', maxWidth: 800, padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ color: isRevealed ? (isAllAnswered ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)', textAlign: 'center', fontWeight: 'bold' }}>
          {isRevealed
            ? (isAllAnswered ? `✅ ตอบครบทุกคนแล้ว (${Object.keys(votes).length}/${totalStudents} คน)` : `⏰ หมดเวลา (${Object.keys(votes).length}/${totalStudents} คน)`)
            : `⏳ กำลังรอคำตอบ... (${Object.keys(votes).length}/${totalStudents} คน)`}
        </div>
        
        {options.map(opt => {
          const count = Object.values(votes).filter(v => v === opt.id).length;
          const pct = Math.round((count / total) * 100) || 0;
          const isCorrect = opt.id === 'ldr';

          return (
            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ width: 200, textAlign: 'right', fontWeight: 'bold', color: (isRevealed && isCorrect) ? 'var(--neon-green)' : 'white' }}>
                {opt.label} {(isRevealed && isCorrect) && '✅'}
              </span>
              {isRevealed && (
                <div style={{ flex: 1, height: 30, background: 'rgba(255,255,255,0.1)', borderRadius: 15, overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    style={{ height: '100%', background: opt.color }}
                  />
                </div>
              )}
              {isRevealed && <span style={{ width: 100 }}>{count} โหวต</span>}
            </div>
          );
        })}

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          {isRevealed && <p className="quiz-explanation" aria-live="polite">{sensorQuizExplanation}</p>}
          {!isTimeUp && !isAllAnswered && (
            <button className="neu-button" onClick={() => revealQuiz(!roomState.quizRevealed)} style={{ color: roomState.quizRevealed ? '#ff4d4d' : 'var(--neon-green)', padding: '1rem 2rem', fontSize: '1.2rem' }}>
              {roomState.quizRevealed ? 'ซ่อนเฉลย' : 'เฉลยคำตอบทันที!'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Scene 8: Logic Building ────────────────────────────────────────────────
function HostLogic() {
  const { roomState } = useRoom();
  const votes = roomState.logicVotes || {};
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = (roomState.questionDurationMs ?? 30000) - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime, roomState.questionDurationMs]);
  
  const options = [
    { id: 'dark', label: 'ถ้า "แสงมืด" (LDR < 500)' },
    { id: 'dry', label: 'ถ้า "ดินแห้ง" (Soil > 3000)' },
    { id: 'motion', label: 'ถ้า "มีคนเดินผ่าน" (PIR == 1)' },
    { id: 'hot', label: 'ถ้า "อากาศร้อน" (Temp > 30)' }
  ];

  const total = Object.keys(votes).length || 1;
  const { total: totalStudents, allAnswered: isAllAnswered } = answerProgress(roomState, votes);
  const showResults = isTimeUp || isAllAnswered;

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={(roomState.questionDurationMs ?? 30000) / 1000} size={70} stopped={isAllAnswered} />
        <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>ประกอบร่าง Logic (ตรรกะ)</h1>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '90%', maxWidth: 1000, justifyContent: 'center' }}>
        
        {/* Left: Logic Code */}
        <div className="glass-panel" style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: 16, borderLeft: '8px solid var(--neon-purple)', fontFamily: 'monospace', fontSize: '2rem', color: '#ffb86c', lineHeight: 1.8 }}>
            IF ( <span style={{ color: 'var(--neon-blue)', borderBottom: '2px dashed var(--neon-blue)' }}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> ) {'{'}
            <br/>&nbsp;&nbsp;<span style={{ color: '#50fa7b' }}>รดน้ำต้นไม้();</span>
            <br/>{'}'}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '2rem', fontSize: '1.2rem', textAlign: 'center' }}>
            IF ให้บอร์ดเลือกคำสั่งตามเงื่อนไขที่เราเขียน ตัวอย่างนี้สมมติว่าดินแห้งให้ค่าสูง เกณฑ์ 3000 ต้องปรับจากการทดลองจริง
          </p>
        </div>

        {/* Right: Votes */}
        <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: 'var(--neon-green)', margin: '0 0 1rem 0' }}>ผลโหวตเติมคำในช่องว่าง</h2>
            <div style={{ color: showResults ? (isAllAnswered ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)', fontWeight: 'bold' }}>
              {showResults
                ? (isAllAnswered ? `✅ ตอบครบทุกคนแล้ว (${Object.keys(votes).length}/${totalStudents} คน)` : `⏰ หมดเวลา (${Object.keys(votes).length}/${totalStudents} คน)`)
                : `⏳ กำลังรอคำตอบ... (${Object.keys(votes).length}/${totalStudents} คน)`}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {options.map(opt => {
              const count = Object.values(votes).filter(v => v === opt.id).length;
              const pct = Math.round((count / total) * 100) || 0;
              const isCorrect = opt.id === 'dry';
              
              return (
                <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: showResults && isCorrect ? 'var(--neon-green)' : 'white' }}>
                      {opt.label} {showResults && isCorrect && '🎯'}
                    </span>
                    {showResults && <span>{count} โหวต</span>}
                  </div>
                  {showResults && (
                    <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} style={{ height: '100%', background: isCorrect ? 'var(--neon-green)' : 'var(--neon-blue)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Scene 10: Podium ──────────────────────────────────────────────────────
// ─── Confetti Particles ──────────────────────────────────────────────────────
function Confetti() {
  const { width, height } = useWindowSize();
  return <ReactConfetti width={width} height={height} numberOfPieces={400} gravity={0.15} recycle={false} style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0 }} />;
}

function HostPodium() {
  const { roomState } = useRoom();
  const students = roomState.students || [];
  const [revealStep, setRevealStep] = useState(0);

  // Same ranking the learners' own screens show: points first, then how fast those
  // points were earned, so an equal score is never settled by who joined first.
  const sortedStudents = rankStudents(roomState);
  const top3 = sortedStudents.slice(0, 3);
  const rest = sortedStudents.slice(3);
  const hasStudents = students.length > 0;

  // Dramatic reveal: 3rd → 2nd → 1st. Keyed off "anyone at all" rather than the head
  // count, so a learner arriving mid-ceremony cannot restart the animation.
  useEffect(() => {
    if (!hasStudents) return;
    const timers = [
      setTimeout(() => setRevealStep(1), 500),   // reveal 3rd
      setTimeout(() => setRevealStep(2), 1800),  // reveal 2nd
      setTimeout(() => setRevealStep(3), 3200),  // reveal 1st + confetti
    ];
    return () => timers.forEach(clearTimeout);
  }, [hasStudents]);

  const podiumConfig = [
    // [displayOrder, podiumIndex, height, gradient, delay]
    { place: 2, height: 140, gradient: 'linear-gradient(180deg, #c0c0c0 0%, #808080 100%)', medal: '🥈', shadow: 'rgba(192,192,192,0.4)', revealAt: 2 },
    { place: 1, height: 200, gradient: 'linear-gradient(180deg, #ffd700 0%, #ff8c00 100%)', medal: '🥇', shadow: 'rgba(255,215,0,0.5)', revealAt: 3 },
    { place: 3, height: 100, gradient: 'linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)', medal: '🥉', shadow: 'rgba(205,127,50,0.4)', revealAt: 1 },
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {revealStep >= 3 && <Confetti />}
      
      <motion.h1 className="text-glow-blue" style={{ fontSize: '3.5rem', margin: 0, zIndex: 1 }}
        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        🏆 Hall of Fame 🏆
      </motion.h1>

      {students.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', zIndex: 1 }}>ยังไม่มีนักเรียนในห้อง</p>
      ) : (
        <>
          {/* Podium */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', zIndex: 1, marginTop: '1rem' }}>
            {podiumConfig.map((cfg, i) => {
              const student = top3[cfg.place - 1];
              const isRevealed = revealStep >= cfg.revealAt;
              const score = student?.score || 0;

              return (
                <div key={cfg.place} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: cfg.place === 1 ? 200 : 160 }}>
                  {/* Student info */}
                  <AnimatePresence>
                    {isRevealed && student && (
                      <motion.div
                        initial={{ scale: 0, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                        style={{ textAlign: 'center' }}
                      >
                        <div style={{ fontSize: cfg.place === 1 ? '4rem' : '3rem' }}>{cfg.medal}</div>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: cfg.place === 1 ? '1.5rem' : '1.2rem' }}>
                          {student.name}
                        </div>
                        <div style={{ color: 'var(--neon-blue)', fontWeight: 800, fontSize: cfg.place === 1 ? '1.8rem' : '1.3rem' }}>
                          {score} pts
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          ตอบถูก {student.correctCount} ข้อ · {formatDuration(student.correctCount ? student.totalTimeMs : null)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Podium block */}
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={isRevealed ? { height: cfg.height, opacity: 1 } : {}}
                    transition={{ type: 'spring', bounce: 0.3, duration: 1 }}
                    style={{
                      width: '100%',
                      background: cfg.gradient,
                      borderRadius: '12px 12px 0 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 -5px 25px ${cfg.shadow}`,
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>
                      {cfg.place}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Rest of students */}
          {rest.length > 0 && revealStep >= 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="glass-panel" style={{ width: '90%', maxWidth: 600, padding: '1.5rem', zIndex: 1 }}>
              <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 1rem 0', textAlign: 'center', fontSize: '1rem' }}>อันดับที่ 4+</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rest.map((s, i) => (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{i + 4}. {s.name}</span>
                    <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>
                      {s.score} pts <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>· {formatDuration(s.correctCount ? s.totalTimeMs : null)}</span>
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Host View Shell ──────────────────────────────────────────────────────────
const STEP_LABELS = {
  lobby: 'เข้าห้องเรียน',
  architecture: 'ภาพรวมระบบ IoT',
  roles: 'Output',
  sensors: 'Input',
  problem: 'วิเคราะห์โจทย์',
  digital: 'Digital: 0 และ 1',
  analog: 'Analog และ ADC',
  signalmatch: 'เทียบสัญญาณสองแบบ',
  digitaldata: 'Digital หลายบิต',
  adcmeaning: 'ตีความค่าดิบ',
  signaldesign: 'เลือกวิธีอ่าน',
  logic: 'เงื่อนไข IF / ELSE',
  wrapup: 'สรุประบบ IoT',
  ideation: 'ออกแบบระบบ IoT',
  podium: 'สรุปคะแนน',
};

// Controlled slideshow for teacher — slide syncs with roomState.presentation
function HostLessonSlideshow({ chapter, step, quizRevealed }) {
  const { roomState, setPresentation } = useRoom();
  const currentSlide = roomState.presentation?.slide ?? 0;

  const handleSlideChange = (idx) => {
    setPresentation({ mode: 'lesson', slide: idx });
  };

  return (
    <LessonSlideshow
      key={`${chapter}-${step}`}
      phase={CHAPTER_FLOW[chapter][step].lessonId}
      quizRevealed={quizRevealed}
      controlledSlide={currentSlide}
      onSlideChange={handleSlideChange}
    />
  );
}

// The PIN, the door and the register in one place the teacher can reach from any step —
// sending the whole class back to the lobby just to remove one name interrupts the lesson.
const roomClock = savedAt => new Date(savedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

function RoomRoster() {
  const { roomState, setJoinOpen, removeStudent, restoreRoom, listRooms } = useRoom();
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const students = rankStudents(roomState);

  // Read when the panel opens, and again whenever the room itself changes.
  useEffect(() => {
    if (!open) return;
    let live = true;
    listRooms().then(found => { if (live) setRooms(found); });
    return () => { live = false; };
  }, [open, listRooms, roomState.pin]);

  const kick = student => {
    if (!window.confirm(`นำ "${student.name}" ออกจากห้อง?\n\nคะแนนและคำตอบของเขาจะยังถูกเก็บไว้ ถ้ากลับเข้ามาด้วยชื่อเดิมจะได้คืนทั้งหมด`)) return;
    removeStudent(student.name);
  };

  return (
    <div style={{ position: 'relative', marginRight: 'auto' }}>
      <button type="button" onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        title="ดูรายชื่อนักเรียน เปิด/ปิดรับเข้าห้อง และนำนักเรียนออก"
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 10, cursor: 'pointer',
          background: 'rgba(0,240,255,.08)', border: '1px solid rgba(0,240,255,.25)', font: 'inherit' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '.75rem' }}>PIN</span>
        <span style={{ color: 'var(--neon-blue)', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '.12em' }}>{roomState.pin}</span>
        <span style={{ fontSize: '.85rem' }}>{roomState.joinOpen ? '🔓' : '🔒'}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '.75rem' }}>{roomState.students.length} คน ▾</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
          <div className="glass-panel" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 201,
            width: 320, maxHeight: '60vh', display: 'flex', flexDirection: 'column', padding: 14, gap: 10 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: roomState.joinOpen ? 'var(--neon-green)' : '#ffb86c', fontSize: '.85rem' }}>
                {roomState.joinOpen ? '🔓 เปิดรับนักเรียน' : '🔒 ปิดรับนักเรียนใหม่'}
              </span>
              <button type="button" className="neu-button" onClick={() => setJoinOpen(!roomState.joinOpen)}
                style={{ padding: '4px 12px', fontSize: '.78rem' }}>
                {roomState.joinOpen ? 'ปิดรับ' : 'เปิดรับ'}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {students.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '.85rem', margin: 0 }}>ยังไม่มีนักเรียนในห้อง</p>
              )}
              {students.map(student => (
                <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  borderRadius: 10, background: 'rgba(255,255,255,.04)' }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.88rem' }}>
                    🧑‍🔬 {student.name}
                  </span>
                  <span style={{ color: 'var(--neon-blue)', fontSize: '.78rem', fontWeight: 700 }}>{student.score}</span>
                  <button type="button" onClick={() => kick(student)} aria-label={`นำ ${student.name} ออกจากห้อง`}
                    title={`นำ ${student.name} ออกจากห้อง`}
                    style={{ background: 'transparent', border: '1px solid rgba(255,0,100,.35)', color: '#ff6b6b',
                      borderRadius: 8, padding: '2px 8px', cursor: 'pointer', font: 'inherit', fontSize: '.78rem' }}>
                    เตะออก
                  </button>
                </div>
              ))}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '.72rem', margin: 0, lineHeight: 1.6 }}>
              นักเรียนที่ถูกนำออกจะเห็นข้อความบนจอทันที คะแนนยังเก็บไว้ ถ้าจะให้กลับเข้ามาต้องกด "เปิดรับ" ก่อน
            </p>

            {rooms.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '.78rem' }}>ห้องก่อนหน้า (เก็บไว้ 1 วัน)</span>
                {rooms.map(room => (
                  <div key={room.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                    borderRadius: 10, background: 'rgba(176,38,255,.08)', border: '1px solid rgba(176,38,255,.2)' }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: '.82rem' }}>
                      PIN {room.pin} · {room.students} คน
                      <span style={{ color: 'var(--text-secondary)' }}> · {roomClock(room.savedAt)}</span>
                    </span>
                    <button type="button"
                      onClick={() => {
                        if (!window.confirm(`กลับเข้าห้อง PIN ${room.pin} (${room.students} คน)?\n\nห้องปัจจุบันจะถูกเก็บไว้ให้กลับมาได้เหมือนกัน`)) return;
                        setOpen(false);
                        restoreRoom(room.id);
                      }}
                      style={{ background: 'transparent', border: '1px solid rgba(176,38,255,.45)', color: '#d8adff',
                        borderRadius: 8, padding: '2px 10px', cursor: 'pointer', font: 'inherit', fontSize: '.78rem' }}>
                      กลับเข้าห้อง
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Reloading to recover is something the teacher just asked for, so the are-you-sure guard
// below must not interrupt it.
let reloadingOnPurpose = false;

function ConnectionBanner() {
  const { connected, error } = useRoom();

  if (!connected) {
    return (
      <div role="alert" style={{ flexShrink: 0, margin: '8px 14px 0', padding: '10px 16px', borderRadius: 10,
        background: 'rgba(255,77,77,.12)', border: '1px solid rgba(255,77,77,.45)', color: '#ff9b9b',
        display: 'flex', alignItems: 'center', gap: 10, fontSize: '.9rem' }}>
        <span style={{ fontSize: '1.1rem' }}>🔌</span>
        <span style={{ flex: 1 }}>
          <strong>ขาดการเชื่อมต่อกับห้องเรียน</strong> — กำลังต่อใหม่อัตโนมัติ คำสั่งที่กดตอนนี้จะยังไม่ถึงนักเรียน
          <br />
          <span style={{ color: 'var(--text-secondary)', fontSize: '.82rem' }}>
            ห้องยังอยู่ครบบนเซิร์ฟเวอร์ ถ้ารอแล้วไม่กลับมา ให้โหลดหน้านี้ใหม่ได้เลย นักเรียนไม่หลุด
          </span>
        </span>
        <button type="button" className="neu-button"
          onClick={() => { reloadingOnPurpose = true; window.location.reload(); }}
          style={{ padding: '6px 14px', fontSize: '.82rem', whiteSpace: 'nowrap' }}>
          โหลดใหม่
        </button>
      </div>
    );
  }

  if (!error) return null;
  return (
    <div role="alert" style={{ flexShrink: 0, margin: '8px 14px 0', padding: '8px 16px', borderRadius: 10,
      background: 'rgba(255,184,108,.1)', border: '1px solid rgba(255,184,108,.4)', color: '#ffb86c', fontSize: '.85rem' }}>
      ⚠️ {error}
    </div>
  );
}

export default function HostView() {
  const { roomState, setChapter, setStep, resetRoom, setPresentation, connected } = useRoom();
  const currentChapterFlow = CHAPTER_FLOW[roomState.chapter];
  const currentStepData = currentChapterFlow[roomState.step];
  const [pendingChapter, setPendingChapter] = useState(null);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (reloadingOnPurpose) return;
      if (roomState.students.length > 0) {
        e.preventDefault();
        e.returnValue = 'มีนักเรียนอยู่ในห้อง คุณแน่ใจหรือไม่ที่จะออกจากระบบ?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomState.students.length]);

  const requestChapterChange = (newChapter) => {
    if (newChapter === roomState.chapter) return;
    if (roomState.students.length > 0) {
      setPendingChapter(newChapter);
    } else {
      setChapter(newChapter);
    }
  };

  const confirmChapterChange = () => {
    setChapter(pendingChapter);
    setPendingChapter(null);
  };
  const lessonMode = roomState.presentation?.mode === 'lesson';

  const handleTabChange = (mode) => {
    setPresentation({ mode });
  };

  return (
    <div className="host-learning-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <FloatingEmojis />
      <ConnectionBanner />

      {/* Navbar */}
      <div className="glass-panel host-navbar" style={{ margin: '10px 14px 0', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 100, flexShrink: 0 }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.2rem' }}>🖥️ Host Dashboard</h2>
        <RoomRoster />
        <span title={connected ? 'เชื่อมต่อกับห้องเรียนอยู่' : 'ขาดการเชื่อมต่อ'}
          aria-label={connected ? 'เชื่อมต่ออยู่' : 'ขาดการเชื่อมต่อ'}
          style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: connected ? 'var(--neon-green)' : '#ff4d4d',
            boxShadow: `0 0 8px ${connected ? 'var(--neon-green)' : '#ff4d4d'}` }} />
        {/* Chapter Dropdown */}
        <select 
          className="neu-button" 
          value={roomState.chapter} 
          onChange={(e) => requestChapterChange(Number(e.target.value))}
          style={{ padding: '8px', fontSize: '1rem', fontWeight: 'bold', background: 'var(--glass-bg)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
          <option value={1} style={{color: 'black'}}>พื้นฐานและเซนเซอร์</option>
          <option value={2} style={{color: 'black'}}>สัญญาณ Digital/Analog</option>
          <option value={3} style={{color: 'black'}}>Logic และ ไอเดีย</option>
        </select>

        {/* Steps for current Chapter */}
        <nav aria-label="หัวข้อในบทเรียน" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
          {currentChapterFlow.map((step, i) => (
            <button key={step.id || step.type} type="button" onClick={() => setStep(i)}
              aria-current={roomState.step === i ? 'step' : undefined}
              title={step.type === 'activity' ? lessons[step.lessonId]?.title : STEP_LABELS[step.type]}
              className="neu-button"
              style={{ padding: '8px 12px', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'nowrap', color: roomState.step === i ? 'var(--neon-blue)' : 'inherit', boxShadow: roomState.step === i ? 'var(--neumorph-inset)' : 'var(--neumorph-shadow)' }}>
              {STEP_LABELS[step.id || step.type] || lessons[step.lessonId]?.title}
            </button>
          ))}
        </nav>
        <button title="ล้างข้อมูลห้องเรียนและเริ่มใหม่" onClick={() => { if (window.confirm('ล้างคะแนน คำตอบ และรายชื่อนักเรียนทั้งหมด แล้วสร้าง PIN ใหม่?')) resetRoom(); }} style={{ background: 'transparent', border: '1px solid rgba(255,0,100,0.4)', color: '#ff6b6b', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
          🔄 เริ่มห้องใหม่
        </button>
      </div>

      {/* Mode tab bar */}
      <div className="lesson-mode-bar" role="group" aria-label="รูปแบบการสอน" style={{ flexShrink: 0 }}>
        {/* The lobby is where the class gathers — there is no lesson to show there yet. */}
        {currentStepData.type !== 'lobby' && (
          <button
            id="host-tab-lesson"
            className="lesson-mode-button"
            aria-pressed={lessonMode}
            onClick={() => handleTabChange('lesson')}
          >
            📖 เนื้อหา
          </button>
        )}
        <button
          id="host-tab-activity"
          className="lesson-mode-button"
          aria-pressed={!lessonMode}
          onClick={() => handleTabChange('activity')}
        >
          🎮 กิจกรรมในห้องเรียน
        </button>
      </div>

      {/* Main Content — fills remaining height */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <AnimatePresence mode="wait">
          {lessonMode ? (
            <motion.div key="lesson" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <HostLessonSlideshow chapter={roomState.chapter} step={roomState.step} quizRevealed={roomState.quizRevealed} />
            </motion.div>
          ) : (
            <motion.div key="activity" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="host-activity" style={{ flex: 1, overflow: 'auto' }}>
              {currentStepData.type === 'lobby' && <HostLobby />}
              {currentStepData.id === 'architecture' && <HostArchitecture />}
              {currentStepData.id === 'roles' && <ClassroomChoiceActivity activityId="roles" audience="teacher" />}
              {currentStepData.id === 'sensors' && <HostCatalog />}
              {currentStepData.id === 'problem' && <HostProblem />}
              {currentStepData.id === 'digital' && <HostDigital />}
              {currentStepData.id === 'analog' && <HostAnalog />}
              {currentStepData.id === 'logic' && <HostLogic />}
              {currentStepData.id === 'digitaldata' && <ClassroomChoiceActivity activityId="digitaldata" audience="teacher" />}
              {currentStepData.id === 'adcmeaning' && <ClassroomChoiceActivity activityId="adcmeaning" audience="teacher" />}
              {currentStepData.id === 'signaldesign' && <ClassroomChoiceActivity activityId="signaldesign" audience="teacher" />}
              {currentStepData.id === 'signalmatch' && <ClassroomChoiceActivity activityId="signalmatch" audience="teacher" />}
              {currentStepData.id === 'wrapup' && <ClassroomChoiceActivity activityId="wrapup" audience="teacher" />}
              {currentStepData.id === 'ideation' && <ClassroomChoiceActivity activityId="ideation" audience="teacher" />}
              {currentStepData.type === 'podium' && <HostPodium />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {pendingChapter !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', maxWidth: '400px' }}>
            <h3 style={{ color: '#ff6b6b' }}>ยืนยันการเปลี่ยนบทเรียน?</h3>
            <p style={{ margin: '15px 0' }}>ขณะนี้มีนักเรียนในห้อง {roomState.students.length} คน การเปลี่ยนบทเรียนจะทำให้หน้าจอของทุกคนเปลี่ยนตามทันที</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
              <button className="neu-button" onClick={() => setPendingChapter(null)}>ยกเลิก</button>
              <button className="neu-button" onClick={confirmChapterChange} style={{ color: '#ff6b6b' }}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
