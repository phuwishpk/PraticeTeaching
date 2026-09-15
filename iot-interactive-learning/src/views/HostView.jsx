import { WrapUpActivity } from '../components/WrapUpGraphics';
import { SignalActivityReview } from '../components/SignalGraphics';
import { SensorCatalog } from '../components/LessonGraphics';
import React, { useEffect, useState, useMemo } from 'react';
import { useRoom } from '../context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { LessonSlideshow } from '../components/LessonContent';
import { sensorQuizExplanation } from '../content/lessons';
import CountdownTimer from '../components/CountdownTimer';

// ─── Floating Emojis Overlay ──────────────────────────────────────────────────
function FloatingEmojis({ emojis }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      <AnimatePresence>
        {emojis.map(e => (
          <motion.div key={e.id}
            initial={{ y: window.innerHeight, x: e.x, opacity: 1, scale: 0.5 }}
            animate={{ y: -100, x: e.x + (Math.random() * 100 - 50), opacity: 0, scale: 1.5 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            style={{ position: 'absolute', fontSize: '3rem' }}>
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
}

// ─── Scene 1: Lobby ───────────────────────────────────────────────────────────
function HostLobby() {
  const { roomState, setPhase, joinUrl } = useRoom();
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
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignContent: 'flex-start', marginTop: '1rem' }}>
            <AnimatePresence>
              {roomState.students.length === 0 && (
                <p style={{ color: 'var(--text-secondary)' }}>รอเพื่อนๆ สักครู่...</p>
              )}
              {roomState.students.map((student) => (
                <motion.div key={student.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ background: 'rgba(255,255,255,0.05)', padding: '0.8rem 1.5rem', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
                  🧑‍🔬 {student.name}
                </motion.div>
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
    const remaining = 30000 - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime, currentItem]);

  const getPercent = (layer) => totalVotes === 0 ? 0 : Math.round((Object.values(votes).filter(v => v === layer).length / totalVotes) * 100);
  const totalStudents = roomState.students.length;
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  const items = [
    { id: 'esp32', name: 'บอร์ด ESP32', icon: '🎛️', correct: 'device' },
    { id: 'wifi', name: 'Wi-Fi Router', icon: '📶', correct: 'network' },
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
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={70} />
        <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>โหวต: อุปกรณ์นี้อยู่ชั้นไหน?</h1>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '90%', maxWidth: 1200, justifyContent: 'center' }}>
        
        {/* Left: Voting Control */}
        <div className="glass-panel flex-center" style={{ flex: 1, padding: '2rem', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-secondary)', margin: 0 }}>ส่งคำถามให้นักเรียน:</h2>
          <motion.div key={currentItem} initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ fontSize: '8rem', filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.5))' }}>
            {activeItemData.icon}
          </motion.div>
          <h2 style={{ margin: 0, color: 'var(--neon-blue)', fontSize: '2rem' }}>{activeItemData.name}</h2>
          
          <div style={{ marginTop: '1rem', color: showResults ? 'var(--text-secondary)' : 'var(--neon-blue)' }}>
            {showResults ? `โหวตแล้ว: ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
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
  const { roomState } = useRoom();
  const votes = roomState.problemVotes || {};
  const totalVotes = Object.keys(votes).length;
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = 30000 - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  const totalStudents = roomState.students.length;
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  const options = [
    { id: 'wifi', label: 'Wi-Fi Router (ตัวส่งเน็ต)' },
    { id: 'sensor', label: 'Sensor (เซนเซอร์)' },
    { id: 'motor', label: 'Motor (มอเตอร์)' },
    { id: 'usb', label: 'USB Cable (สายเชื่อมต่อ)' }
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={70} />
        <h1 className="text-glow-blue" style={{ fontSize: '2.5rem', margin: 0 }}>
          ปัญหาของบอร์ด ESP32: สมองพร้อม แต่ประสาทสัมผัสล่ะ?
        </h1>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '95%', maxWidth: 1200, minHeight: '60vh', justifyContent: 'center' }}>
        
        {/* Left: Problem Statement */}
        <div className="glass-panel" style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <motion.div animate={{ background: ['rgba(255,0,0,0.1)', 'rgba(255,0,0,0.2)', 'rgba(255,0,0,0.1)'] }} transition={{ repeat: Infinity, duration: 1 }}
            style={{ padding: '2rem', border: '2px solid #ff4d4d', borderRadius: 16, boxShadow: '0 0 20px rgba(255,0,0,0.2)' }}>
            <h3 style={{ color: '#ff6b6b', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>⚠️ สมองที่ตาบอด</h3>
            <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, lineHeight: 1.6, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              ESP32 ประมวลผลได้ แต่มันไม่รู้ว่าห้องร้อนหรือหนาว มืดหรือสว่าง
            </p>
          </motion.div>

          <div className="flex-center" style={{ flex: 1 }}>
            <img src="/images/esp32_board_1789207904514.jpg" alt="ESP32" style={{ width: '80%', maxHeight: 200, objectFit: 'cover', borderRadius: 16, border: '2px solid rgba(255,255,255,0.2)' }} />
          </div>
          
          <h2 style={{ textAlign: 'center', color: 'var(--neon-blue)' }}>คำถาม: อุปกรณ์ใดทำหน้าที่เปรียบเสมือน "ตา หู จมูก" ให้กับบอร์ด?</h2>
        </div>

        {/* Right: Quiz Results */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--neon-purple)', margin: 0 }}>ผลโหวต</h2>
            <div style={{ color: showResults ? 'var(--text-secondary)' : 'var(--neon-blue)' }}>
              {showResults ? `โหวตแล้ว ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            {options.map(opt => {
              const count = Object.values(votes).filter(v => v === opt.id).length;
              const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
              const isCorrect = opt.id === 'sensor';
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
    </div>
  );
}

function HostDigital() {
  const { roomState } = useRoom();
  const votes = roomState.digitalVotes || {};
  const totalVotes = Object.keys(votes).length;
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = 30000 - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  const totalStudents = roomState.students.length;
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  const options = [
    { id: '2_states', label: '2 สถานะ (เช่น 0 กับ 1, ปิดกับเปิด)' },
    { id: '10_states', label: '10 สถานะ (เช่น 0 ถึง 9)' },
    { id: 'infinite', label: 'นับไม่ถ้วน (ค่าต่อเนื่อง)' },
    { id: 'none', label: 'ไม่มีสถานะที่แน่นอน' }
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={70} />
        <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>สัญญาณภาษาเครื่อง (Digital)</h1>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '95%', maxWidth: 1200, minHeight: '60vh', justifyContent: 'center' }}>
        
        {/* Left: Theory */}
        <div className="glass-panel" style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ padding: '2rem', border: '2px solid var(--neon-blue)', borderRadius: 16, background: 'rgba(0,240,255,0.05)' }}>
            <h3 style={{ color: 'var(--neon-blue)', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>1. สัญญาณ Digital</h3>
            <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, lineHeight: 1.6 }}>
              ภาษาไฟฟ้าที่เป็นพื้นฐานที่สุดของคอมพิวเตอร์และเซนเซอร์ทั่วไป
            </p>
          </div>
          <h2 style={{ textAlign: 'center', color: 'var(--neon-blue)' }}>คำถาม: สัญญาณ Digital มีกี่สถานะ?</h2>
        </div>

        {/* Right: Activity */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--neon-green)', margin: 0 }}>ผลโหวต</h2>
            <div style={{ color: showResults ? 'var(--text-secondary)' : 'var(--neon-blue)' }}>
              {showResults ? `โหวตแล้ว ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
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
    const remaining = 30000 - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  const totalStudents = roomState.students.length;
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
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
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={70} />
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
            <div style={{ color: showResults ? 'var(--text-secondary)' : 'var(--neon-blue)' }}>
              {showResults ? `โหวตแล้ว ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
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
  return <SensorCatalog />;
}

// ─── Scene 7: Sensor Quiz ──────────────────────────────────────────────────
function HostQuiz() {
  const { roomState, revealQuiz } = useRoom();
  const votes = roomState.quizVotes || {};
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  useEffect(() => {
    setIsTimeUp(false);
    const remaining = 30000 - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);
  
  const options = [
    { id: 'ldr', label: 'LDR (แสง)', color: '#ffb86c' },
    { id: 'dht', label: 'DHT11 (อุณหภูมิ)', color: '#ff79c6' },
    { id: 'pir', label: 'PIR (เคลื่อนไหว)', color: '#8be9fd' },
    { id: 'soil', label: 'Soil Moisture (ดิน)', color: '#50fa7b' }
  ];

  const total = Object.keys(votes).length || 1; // prevent div/0
  const totalStudents = roomState.students.length;
  const isAllAnswered = totalStudents > 0 && Object.keys(votes).length >= totalStudents;
  const isRevealed = roomState.quizRevealed || isTimeUp || isAllAnswered;

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={70} />
        <h1 className="text-glow-blue" style={{ fontSize: '2.5rem', margin: 0, textAlign: 'center' }}>
          "อยากทำระบบเปิดไฟหน้าบ้านอัตโนมัติตอนกลางคืน ต้องใช้เซนเซอร์อะไร?"
        </h1>
      </div>
      
      <div className="glass-panel" style={{ width: '80%', maxWidth: 800, padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ color: isRevealed ? 'var(--text-secondary)' : 'var(--neon-blue)', textAlign: 'center' }}>
          {isRevealed ? `โหวตแล้ว ${Object.keys(votes).length} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
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
    const remaining = 30000 - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);
  
  const options = [
    { id: 'dark', label: 'ถ้า "แสงมืด" (LDR < 500)' },
    { id: 'dry', label: 'ถ้า "ดินแห้ง" (Soil > 3000)' },
    { id: 'motion', label: 'ถ้า "มีคนเดินผ่าน" (PIR == 1)' },
    { id: 'hot', label: 'ถ้า "อากาศร้อน" (Temp > 30)' }
  ];

  const total = Object.keys(votes).length || 1;
  const totalStudents = roomState.students.length;
  const isAllAnswered = totalStudents > 0 && Object.keys(votes).length >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={70} />
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
            <div style={{ color: showResults ? 'var(--text-secondary)' : 'var(--neon-blue)' }}>
              {showResults ? `โหวตแล้ว ${Object.keys(votes).length} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
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

// ─── Scene 9: Summary & Wrap-up ─────────────────────────────────────────────
function HostWrapUp() {
  const { roomState } = useRoom();
  const emojis = roomState.floatingEmojis || [];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem', position: 'relative', overflow: 'hidden' }}>
      
      {/* Floating Emojis */}
      <AnimatePresence>
        {emojis.map((e) => (
          <motion.div key={e.id}
            initial={{ y: 900, x: `${e.x}vw`, opacity: 1, scale: 2 }}
            animate={{ y: -100, opacity: 0 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            style={{ position: 'absolute', fontSize: '4rem', zIndex: 0 }}
          >
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <WrapUpActivity />
    </div>
  );
}

// ─── Scene 10: Podium ──────────────────────────────────────────────────────
// ─── Confetti Particles ──────────────────────────────────────────────────────
function Confetti() {
  const particles = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: ['#ffd700', '#ff4d4d', '#50fa7b', '#8be9fd', '#ff79c6', '#ffb86c'][Math.floor(Math.random() * 6)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  })), []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {particles.map(p => (
        <motion.div key={p.id}
          initial={{ y: -20, x: `${p.x}%`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: p.rotation + 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', repeat: Infinity, repeatDelay: Math.random() * 3 }}
          style={{ position: 'absolute', width: p.size, height: p.size * 0.6, background: p.color, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

function HostPodium() {
  const { roomState } = useRoom();
  const students = roomState.students || [];
  const scores = roomState.scores || {};
  const [revealStep, setRevealStep] = useState(0);

  const sortedStudents = [...students].sort((a, b) => (scores[b.name] || 0) - (scores[a.name] || 0));
  const top3 = sortedStudents.slice(0, 3);
  const rest = sortedStudents.slice(3);

  // Dramatic reveal: 3rd → 2nd → 1st
  useEffect(() => {
    if (students.length === 0) return;
    const timers = [
      setTimeout(() => setRevealStep(1), 500),   // reveal 3rd
      setTimeout(() => setRevealStep(2), 1800),  // reveal 2nd
      setTimeout(() => setRevealStep(3), 3200),  // reveal 1st + confetti
    ];
    return () => timers.forEach(clearTimeout);
  }, [students.length]);

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
              const score = student ? (scores[student.name] || 0) : 0;

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
                    <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>{scores[s.name] || 0} pts</span>
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
const PHASES = ['Lobby', 'Architecture', 'The Problem', 'Digital Signal', 'Analog', 'Sensors', 'Sensor Quiz', 'Logic', 'Wrap-up', 'Podium'];

// Controlled slideshow for teacher — slide syncs with roomState.presentation
function HostLessonSlideshow({ phase, quizRevealed }) {
  const { roomState, setPresentation } = useRoom();
  const currentSlide = roomState.presentation?.slide ?? 0;

  const handleSlideChange = (idx) => {
    setPresentation({ mode: 'lesson', slide: idx });
  };

  return (
    <LessonSlideshow
      key={phase}
      phase={phase}
      quizRevealed={quizRevealed}
      controlledSlide={currentSlide}
      onSlideChange={handleSlideChange}
    />
  );
}

export default function HostView() {
  const { roomState, setPhase, resetRoom, setPresentation } = useRoom();
  const lessonMode = roomState.presentation?.mode === 'lesson';

  const handleTabChange = (mode) => {
    setPresentation({ mode });
  };

  return (
    <div className="host-learning-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <FloatingEmojis emojis={roomState.floatingEmojis} />

      {/* Navbar */}
      <div className="glass-panel host-navbar" style={{ margin: '10px 14px 0', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 100, flexShrink: 0 }}>
        <h2 className="text-glow-blue" style={{ marginRight: 'auto', fontSize: '1.2rem' }}>🖥️ Host Dashboard</h2>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PHASES.slice(0, 10).map((name, i) => (
            <button key={i} onClick={() => setPhase(i + 1)}
              className="neu-button"
              style={{ padding: '5px 12px', fontSize: '0.75rem', color: roomState.phase === i + 1 ? 'var(--neon-blue)' : 'inherit', boxShadow: roomState.phase === i + 1 ? 'var(--neumorph-inset)' : 'var(--neumorph-shadow)' }}>
              {i + 1}. {name}
            </button>
          ))}
        </div>
        <button onClick={resetRoom} style={{ background: 'transparent', border: '1px solid rgba(255,0,100,0.4)', color: '#ff6b6b', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
          🔄 Reset
        </button>
      </div>

      {/* Mode tab bar */}
      <div className="lesson-mode-bar" role="group" aria-label="รูปแบบการสอน" style={{ flexShrink: 0 }}>
        <button
          id="host-tab-lesson"
          className="lesson-mode-button"
          aria-pressed={lessonMode}
          onClick={() => handleTabChange('lesson')}
        >
          📖 เนื้อหา — นักเรียนเห็นหน้าเดียวกัน
        </button>
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
              <HostLessonSlideshow phase={roomState.phase} quizRevealed={roomState.quizRevealed} />
            </motion.div>
          ) : (
            <motion.div key="activity" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="host-activity" style={{ flex: 1, overflow: 'auto' }}>
              {roomState.phase === 1 && <HostLobby />}
              {roomState.phase === 2 && <HostArchitecture />}
              {roomState.phase === 3 && <HostProblem />}
              {roomState.phase === 4 && <HostDigital />}
              {roomState.phase === 5 && <HostAnalog />}
              {roomState.phase === 6 && <HostCatalog />}
              {roomState.phase === 7 && <HostQuiz />}
              {roomState.phase === 8 && <HostLogic />}
              {roomState.phase === 9 && <HostWrapUp />}
              {roomState.phase === 10 && <HostPodium />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
