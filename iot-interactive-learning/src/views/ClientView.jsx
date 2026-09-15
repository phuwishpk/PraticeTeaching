import { WrapUpActivity } from '../components/WrapUpGraphics';
import { SignalActivityReview } from '../components/SignalGraphics';
import { SensorCatalog } from '../components/LessonGraphics';
import { Rocket, User, Cpu, Wifi, Cloud, AlertTriangle, Target, Trophy, Medal, BookOpen, Gamepad2, CheckCircle2, Timer, Lock, Unlock, Flame, Sun, Radio, Zap, Lightbulb, Thermometer, Smartphone, PartyPopper, Heart, XCircle, Activity, Sprout, PersonStanding, ThumbsUp } from 'lucide-react';
import { ImageWithModal } from '../components/ImageWithModal';
import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { CHAPTER_FLOW } from '../../shared/roomState';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentLessonNotes, LessonSlideshow } from '../components/LessonContent';
import { sensorQuizExplanation } from '../content/lessons';
import CountdownTimer from '../components/CountdownTimer';

// ─── Shared Mini Progress Bar ─────────────────────────────────────────────────
function MiniBar({ value, max, color = 'var(--neon-blue)', label, count }) {
  const pct = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ color }}>{count} คน ({pct}%)</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div animate={{ width: `${pct}%` }} style={{ height: '100%', background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─── Scene 1: Lobby ───────────────────────────────────────────────────────────
function ClientLobby() {
  const { roomState, joinRoom, sendFloatingEmoji } = useRoom();
  const [pin, setPin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pin') || '';
  });
  const [pinVerified, setPinVerified] = useState(false);
  const [name, setName] = useState('');
  const [pinError, setPinError] = useState('');
  const myName = sessionStorage.getItem('student_name') || '';

  if (myName) {
    return (
      <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '5rem' }}>🎉</motion.div>
        <h2 className="text-glow-blue" style={{ fontSize: '2rem' }}>สวัสดี, {myName}!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>รอคุณครูเริ่มเนื้อหา...</p>

        {/* เพื่อนในห้อง */}
        {roomState.students.length > 1 && (
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', maxWidth: 360, width: '90%' }}>
            <p style={{ color: 'var(--neon-green)', margin: '0 0 0.75rem 0', fontSize: '0.85rem', textAlign: 'center' }}>
              🧑‍🔬 เพื่อนร่วมห้อง {roomState.students.length} คน
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {roomState.students.map(s => (
                <span key={s.id} style={{
                  background: s.name === myName ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${s.name === myName ? 'var(--neon-blue)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 20, padding: '4px 12px', fontSize: '0.85rem',
                  color: s.name === myName ? 'var(--neon-blue)' : 'var(--text-primary)'
                }}>
                  {s.name === myName ? '👤' : '🧑‍🔬'} {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem' }}>
          {['👍', '💡', '❤️', '🔥'].map(emoji => (
            <motion.button key={emoji} whileTap={{ scale: 0.8 }} className="neu-button"
              onClick={() => sendFloatingEmoji(emoji, myName)}
              style={{ fontSize: '2.5rem', padding: '1rem' }}>
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 1: ใส่ PIN ─────────────────────────────────────────────────────────
  const handlePinCheck = (e) => {
    e.preventDefault();
    if (pin.trim().length !== 4) {
      setPinError('กรุณากรอก PIN 4 หลัก');
      return;
    }
    if (pin.trim() !== roomState.pin) {
      setPinError('❌ รหัส PIN ไม่ถูกต้อง!');
      return;
    }
    setPinError('');
    setPinVerified(true);
  };

  // ── Step 2: กรอกชื่อแล้วเข้าร่วม ───────────────────────────────────────────
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('❌ กรุณากรอกชื่อของคุณ');
      return;
    }
    const success = await joinRoom(name.trim(), pin.trim());
    if (success) {
      sessionStorage.setItem('student_name', name.trim());
      window.location.reload();
    }
  };

  // ── Step 1 UI: ใส่ PIN ──────────────────────────────────────────────────────
  if (!pinVerified) {
    return (
      <div className="flex-center full-screen" style={{ background: 'radial-gradient(circle at 30% 50%, #0d1a3a 0%, #0a0f1a 100%)' }}>
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="glass-panel"
          style={{ padding: '3rem 2.5rem', width: '90%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ fontSize: '4rem' }}>🔐</div>
          <h2 className="text-glow-blue" style={{ fontSize: '2rem', textAlign: 'center', margin: 0 }}>ใส่รหัสเข้าห้องเรียน</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', textAlign: 'center', margin: 0 }}>
            กรอก PIN 4 หลักจากหน้าจอคุณครู
          </p>
          <form onSubmit={handlePinCheck} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
            <input type="text" inputMode="numeric" placeholder="● ● ● ●" className="neu-input"
              value={pin} onChange={e => { setPin(e.target.value); setPinError(''); }} maxLength={4}
              autoFocus
              style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.4em' }} />
            {pinError && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                style={{ color: '#ff6b6b', textAlign: 'center', margin: 0, fontSize: '0.9rem' }}>
                {pinError}
              </motion.p>
            )}
            <motion.button type="submit" whileTap={{ scale: 0.95 }} className="neu-button"
              style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.2rem', color: 'var(--neon-blue)', width: '100%' }}>
              🔓 ยืนยัน PIN
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Step 2 UI: กรอกชื่อ ─────────────────────────────────────────────────────
  return (
    <div className="flex-center full-screen" style={{ background: 'radial-gradient(circle at 30% 50%, #0d1a3a 0%, #0a0f1a 100%)' }}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="glass-panel"
        style={{ padding: '3rem 2.5rem', width: '90%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ fontSize: '4rem' }}>🚀</div>
        <h2 className="text-glow-blue" style={{ fontSize: '2rem', textAlign: 'center', margin: 0 }}>Welcome to IoT Lab</h2>
        <p style={{ color: 'var(--neon-green)', fontSize: '0.9rem', margin: 0 }}>✅ PIN ถูกต้อง!</p>
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
          <input type="text" placeholder="ชื่อเล่นนักเรียน" className="neu-input"
            value={name} onChange={e => setName(e.target.value)} maxLength={20}
            autoFocus
            style={{ textAlign: 'center', fontSize: '1.2rem' }} />
          <motion.button type="submit" whileTap={{ scale: 0.95 }} className="neu-button"
            style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.2rem', color: 'var(--neon-blue)', width: '100%' }}>
            🚀 เริ่มการทดลอง
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Scene 2: 3-Layer Architecture (Polling) ──────────────────────────────────
function ClientArchitecture() {
  const { roomState, submitVote } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  const currentItem = roomState.currentVoteItem;
  const allVotes = roomState.architectureVotes?.[currentItem] || {};
  const myVote = allVotes[myName];
  const totalVotes = Object.keys(allVotes).length;
  const totalStudents = roomState.students.length;

  const correctMap = { esp32: 'device', wifi: 'network', cloud: 'service' };
  const correctAnswer = correctMap[currentItem];
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  // Track timer expiry
  useEffect(() => {
    setIsTimeUp(false);
    const timer = setTimeout(() => setIsTimeUp(true), 30000 - (Date.now() - roomState.questionStartTime));
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  const layers = [
    { id: 'service', label: 'Layer 3: Service', color: 'var(--neon-purple)', emoji: '☁️' },
    { id: 'network', label: 'Layer 2: Network', color: 'var(--neon-green)', emoji: '📶' },
    { id: 'device',  label: 'Layer 1: Device',  color: 'var(--neon-blue)', emoji: '🎛️' },
  ];

  const itemInfo = {
    esp32: { name: 'บอร์ด ESP32', icon: '🎛️' },
    wifi:  { name: 'Wi-Fi Router', icon: '📶' },
    cloud: { name: 'Cloud Server', icon: '☁️' }
  };
  const activeItem = itemInfo[currentItem] || itemInfo.esp32;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 420, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* อุปกรณ์ที่กำลังโหวต */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={50} />
        <motion.div key={currentItem} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '3rem' }}>
          {activeItem.icon}
        </motion.div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>อุปกรณ์ที่กำลังโหวต</div>
          <div style={{ fontWeight: 'bold', color: 'var(--neon-blue)', fontSize: '1.1rem' }}>{activeItem.name}</div>
          <div style={{ fontSize: '0.75rem', color: isTimeUp ? (totalVotes >= totalStudents ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)' }}>
            {isTimeUp ? `โหวตแล้ว ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
          </div>
        </div>
      </div>

      {/* ปุ่มโหวต */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {layers.map(layer => {
          const count = Object.values(allVotes).filter(v => v === layer.id).length;
          const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          const isMyVote = myVote === layer.id;
          const isCorrectAnswer = layer.id === correctAnswer;
          return (
            <motion.button key={layer.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => !myVote && !isTimeUp && submitVote(currentItem, layer.id, myName)}
              disabled={!!myVote || isTimeUp}
              style={{
                background: showResults && isCorrectAnswer ? 'rgba(80,250,123,0.15)'
                  : isMyVote ? `${layer.color}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${showResults && isCorrectAnswer ? '#50fa7b' : isMyVote ? layer.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '1rem', cursor: myVote || isTimeUp ? 'default' : 'pointer',
                position: 'relative', overflow: 'hidden', textAlign: 'left'
              }}
            >
              {/* progress bar — only show after results revealed */}
              {showResults && (
                <motion.div initial={{ width: '0%' }} animate={{ width: `${pct}%` }}
                  style={{ position: 'absolute', inset: 0, background: `${layer.color}18`, borderRadius: 12 }}
                />
              )}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{layer.emoji}</span>
                  <span style={{ color: showResults && isCorrectAnswer ? '#50fa7b' : isMyVote ? layer.color : 'white', fontWeight: isMyVote || (showResults && isCorrectAnswer) ? 'bold' : 'normal', fontSize: '1rem' }}>
                    {layer.label} {isMyVote && '✅'} {showResults && isCorrectAnswer && '🎯'}
                  </span>
                </div>
                {showResults && totalVotes > 0 && (
                  <span style={{ color: layer.color, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {pct}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {myVote && !showResults && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: 'var(--neon-blue)', fontSize: '0.9rem', padding: '0.5rem' }}>
          ⏳ บันทึกคำตอบแล้ว — รอสรุปผลเมื่อหมดเวลา
        </motion.div>
      )}
      {showResults && myVote && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: myVote === correctAnswer ? 'var(--neon-green)' : '#ff6b6b', fontSize: '0.9rem', padding: '0.5rem' }}>
          {myVote === correctAnswer ? '🎉 ถูกต้อง!' : '❌ ไม่ถูก — คำตอบที่ถูกคือ ' + layers.find(l => l.id === correctAnswer)?.label}
        </motion.div>
      )}
      {showResults && !myVote && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#ff6b6b', fontSize: '0.9rem' }}>
          ⏰ หมดเวลา! คำตอบที่ถูกคือ {layers.find(l => l.id === correctAnswer)?.label}
        </motion.div>
      )}
    </div>
  );
}

// ─── Scene 3: The Problem ─────────────────────────────────────────
function ClientProblem() {
  const { roomState, voteProblem } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  const allVotes = roomState.problemVotes || {};
  const myVote = allVotes[myName];
  const totalVotes = Object.keys(allVotes).length;
  const totalStudents = roomState.students.length;

  const correctAnswer = 'sensor';
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  useEffect(() => {
    setIsTimeUp(false);
    const timer = setTimeout(() => setIsTimeUp(true), 30000 - (Date.now() - roomState.questionStartTime));
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  const options = [
    { id: 'wifi', label: 'Wi-Fi Router (ตัวส่งเน็ต)', color: '#ffb86c', image: '/images/wifi.jpg' },
    { id: 'sensor', label: 'Sensor (เซนเซอร์)', color: '#50fa7b', image: '/images/sensor.jpg' },
    { id: 'motor', label: 'Motor (มอเตอร์)', color: '#ff79c6', image: '/images/motor.jpg' },
    { id: 'usb', label: 'USB Cable (สายเชื่อมต่อ)', color: '#8be9fd', image: '/images/usb.jpg' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={50} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>คำถาม</div>
          <div style={{ fontWeight: 'bold', color: 'var(--neon-blue)', fontSize: '1rem' }}>อุปกรณ์ใดคือ "ตา หู จมูก"?</div>
          <div style={{ fontSize: '0.75rem', color: isTimeUp ? (totalVotes >= totalStudents ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)' }}>
            {isTimeUp ? `โหวตแล้ว ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {options.map(opt => {
          const count = Object.values(allVotes).filter(v => v === opt.id).length;
          const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          const isMyVote = myVote === opt.id;
          const isCorrectAnswer = opt.id === correctAnswer;
          
          return (
            <motion.button key={opt.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => !myVote && !isTimeUp && voteProblem(opt.id, myName)}
              disabled={!!myVote || isTimeUp}
              style={{
                background: showResults && isCorrectAnswer ? '#50fa7b'
                  : showResults && !isCorrectAnswer ? 'rgba(255,255,255,0.1)'
                  : isMyVote ? `${opt.color}dd` : opt.color,
                color: showResults && !isCorrectAnswer ? 'var(--text-secondary)' : '#1a1a2e',
                border: `3px solid ${isMyVote ? 'white' : 'transparent'}`,
                borderRadius: 14, padding: '1rem', cursor: myVote || isTimeUp ? 'default' : 'pointer',
                position: 'relative', overflow: 'hidden', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                minHeight: '140px',
                boxShadow: isMyVote ? '0 0 15px rgba(255,255,255,0.5)' : '0 4px 6px rgba(0,0,0,0.3)',
                transform: isMyVote ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s'
              }}
            >
              {showResults && (
                <motion.div initial={{ height: '0%' }} animate={{ height: `${pct}%` }}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.1)', zIndex: 1 }}
                />
              )}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
                {opt.image && <img src={opt.image} alt={opt.label} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '2px solid rgba(0,0,0,0.1)', pointerEvents: 'none' }} />}
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.2' }}>
                  {opt.label}
                </span>
                {showResults && totalVotes > 0 && (
                  <span style={{ fontWeight: '900', fontSize: '1.2rem', marginTop: '0.2rem' }}>
                    {pct}%
                  </span>
                )}
                {showResults && isCorrectAnswer && (
                  <span style={{ position: 'absolute', top: -30, right: -30, fontSize: '1.5rem', background: 'white', borderRadius: '50%', padding: '2px' }}>🎯</span>
                )}
                {isMyVote && !showResults && (
                  <span style={{ position: 'absolute', top: -30, left: -30, fontSize: '1.5rem', background: 'white', borderRadius: '50%', padding: '2px' }}>✅</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {myVote && !showResults && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: 'var(--neon-blue)', fontSize: '0.9rem', padding: '0.5rem' }}>
          ⏳ บันทึกคำตอบแล้ว — รอสรุปผลเมื่อหมดเวลา
        </motion.div>
      )}
      {showResults && myVote && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: myVote === correctAnswer ? 'var(--neon-green)' : '#ff6b6b', fontSize: '0.9rem', padding: '0.5rem' }}>
          {myVote === correctAnswer ? '🎉 ถูกต้อง!' : '❌ ไม่ถูก — คำตอบที่ถูกคือ ' + options.find(o => o.id === correctAnswer)?.label}
        </motion.div>
      )}
      {showResults && !myVote && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#ff6b6b', fontSize: '0.9rem' }}>
          ⏰ หมดเวลา! คำตอบที่ถูกคือ {options.find(o => o.id === correctAnswer)?.label}
        </motion.div>
      )}
    </div>
  );
}

// ─── Scene 4: Digital Signal ────────────────────────────────────────────────
function ClientDigital() {
  const { roomState, voteDigital } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  const allVotes = roomState.digitalVotes || {};
  const myVote = allVotes[myName];
  const totalVotes = Object.keys(allVotes).length;
  const totalStudents = roomState.students.length;

  const correctAnswer = '2_states';
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  useEffect(() => {
    setIsTimeUp(false);
    const timer = setTimeout(() => setIsTimeUp(true), 30000 - (Date.now() - roomState.questionStartTime));
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  const options = [
    { id: '2_states', label: '2 สถานะ (เช่น 0 กับ 1, ปิดกับเปิด)', color: '#ff4d4d' },
    { id: '10_states', label: '10 สถานะ (เช่น 0 ถึง 9)', color: '#8be9fd' },
    { id: 'infinite', label: 'นับไม่ถ้วน (ค่าต่อเนื่อง)', color: '#ffb86c' },
    { id: 'none', label: 'ไม่มีสถานะที่แน่นอน', color: '#ff79c6' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={50} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>คำถาม</div>
          <div style={{ fontWeight: 'bold', color: 'var(--neon-blue)', fontSize: '1rem' }}>สัญญาณ Digital มีกี่สถานะ?</div>
          <div style={{ fontSize: '0.75rem', color: isTimeUp ? (totalVotes >= totalStudents ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)' }}>
            {isTimeUp ? `โหวตแล้ว ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {options.map(opt => {
          const count = Object.values(allVotes).filter(v => v === opt.id).length;
          const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          const isMyVote = myVote === opt.id;
          const isCorrectAnswer = opt.id === correctAnswer;
          
          return (
            <motion.button key={opt.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => !myVote && !isTimeUp && voteDigital(opt.id, myName)}
              disabled={!!myVote || isTimeUp}
              style={{
                background: showResults && isCorrectAnswer ? 'rgba(80,250,123,0.15)'
                  : isMyVote ? `${opt.color}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${showResults && isCorrectAnswer ? '#50fa7b' : isMyVote ? opt.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '1rem', cursor: myVote || isTimeUp ? 'default' : 'pointer',
                position: 'relative', overflow: 'hidden', textAlign: 'left'
              }}
            >
              {showResults && (
                <motion.div initial={{ width: '0%' }} animate={{ width: `${pct}%` }}
                  style={{ position: 'absolute', inset: 0, background: `${opt.color}18`, borderRadius: 12 }}
                />
              )}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: showResults && isCorrectAnswer ? '#50fa7b' : isMyVote ? opt.color : 'white', fontWeight: isMyVote || (showResults && isCorrectAnswer) ? 'bold' : 'normal', fontSize: '1rem' }}>
                  {opt.label} {isMyVote && '✅'} {showResults && isCorrectAnswer && '🎯'}
                </span>
                {showResults && totalVotes > 0 && (
                  <span style={{ color: opt.color, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {pct}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {myVote && !showResults && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: 'var(--neon-blue)', fontSize: '0.9rem', padding: '0.5rem' }}>
          ⏳ บันทึกคำตอบแล้ว — รอสรุปผลเมื่อหมดเวลา
        </motion.div>
      )}
      {showResults && myVote && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: myVote === correctAnswer ? 'var(--neon-green)' : '#ff6b6b', fontSize: '0.9rem', padding: '0.5rem' }}>
          {myVote === correctAnswer ? '🎉 ถูกต้อง!' : '❌ ไม่ถูก — คำตอบที่ถูกคือ ' + options.find(o => o.id === correctAnswer)?.label}
        </motion.div>
      )}
      {showResults && !myVote && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#ff6b6b', fontSize: '0.9rem' }}>
          ⏰ หมดเวลา! คำตอบที่ถูกคือ {options.find(o => o.id === correctAnswer)?.label}
        </motion.div>
      )}
      <SignalActivityReview kind="digital" revealed={showResults} />
    </div>
  );
}

// ─── Scene 5: Analog Signal ────────────────────────────────────────────────
function ClientAnalog() {
  const { roomState, voteAnalog } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  const allVotes = roomState.analogVotes || {};
  const myVote = allVotes[myName];
  const totalVotes = Object.keys(allVotes).length;
  const totalStudents = roomState.students.length;

  const correctAnswer = 'continuous';
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  useEffect(() => {
    setIsTimeUp(false);
    const timer = setTimeout(() => setIsTimeUp(true), 30000 - (Date.now() - roomState.questionStartTime));
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  const options = [
    { id: 'binary', label: 'มีแค่สถานะเปิดกับปิด (0 กับ 1)', color: '#ffb86c' },
    { id: 'continuous', label: 'มีค่าต่อเนื่อง เช่น แรงดันที่ค่อย ๆ เปลี่ยน', color: '#ffc46a' },
    { id: 'faster', label: 'ส่งข้อมูลได้เร็วกว่ามาก', color: '#ff79c6' },
    { id: 'less_wires', label: 'ใช้สายไฟน้อยกว่า', color: '#8be9fd' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={50} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>คำถาม</div>
          <div style={{ fontWeight: 'bold', color: '#ffd08a', fontSize: '1rem' }}>สัญญาณ Analog แตกต่างจาก Digital อย่างไร?</div>
          <div style={{ fontSize: '0.75rem', color: isTimeUp ? (totalVotes >= totalStudents ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)' }}>
            {isTimeUp ? `โหวตแล้ว ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {options.map(opt => {
          const count = Object.values(allVotes).filter(v => v === opt.id).length;
          const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          const isMyVote = myVote === opt.id;
          const isCorrectAnswer = opt.id === correctAnswer;
          
          return (
            <motion.button key={opt.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => !myVote && !isTimeUp && voteAnalog(opt.id, myName)}
              disabled={!!myVote || isTimeUp}
              style={{
                background: showResults && isCorrectAnswer ? 'rgba(80,250,123,0.15)'
                  : isMyVote ? `${opt.color}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${showResults && isCorrectAnswer ? '#50fa7b' : isMyVote ? opt.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '1rem', cursor: myVote || isTimeUp ? 'default' : 'pointer',
                position: 'relative', overflow: 'hidden', textAlign: 'left'
              }}
            >
              {showResults && (
                <motion.div initial={{ width: '0%' }} animate={{ width: `${pct}%` }}
                  style={{ position: 'absolute', inset: 0, background: `${opt.color}18`, borderRadius: 12 }}
                />
              )}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: showResults && isCorrectAnswer ? '#50fa7b' : isMyVote ? opt.color : 'white', fontWeight: isMyVote || (showResults && isCorrectAnswer) ? 'bold' : 'normal', fontSize: '1rem' }}>
                  {opt.label} {isMyVote && '✅'} {showResults && isCorrectAnswer && '🎯'}
                </span>
                {showResults && totalVotes > 0 && (
                  <span style={{ color: opt.color, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {pct}%
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {myVote && !showResults && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: 'var(--neon-blue)', fontSize: '0.9rem', padding: '0.5rem' }}>
          ⏳ บันทึกคำตอบแล้ว — รอสรุปผลเมื่อหมดเวลา
        </motion.div>
      )}
      {showResults && myVote && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: myVote === correctAnswer ? 'var(--neon-green)' : '#ff6b6b', fontSize: '0.9rem', padding: '0.5rem' }}>
          {myVote === correctAnswer ? '🎉 ถูกต้อง!' : '❌ ไม่ถูก — คำตอบที่ถูกคือ ' + options.find(o => o.id === correctAnswer)?.label}
        </motion.div>
      )}
      {showResults && !myVote && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#ff6b6b', fontSize: '0.9rem' }}>
          ⏰ หมดเวลา! คำตอบที่ถูกคือ {options.find(o => o.id === correctAnswer)?.label}
        </motion.div>
      )}
      <SignalActivityReview kind="analog" revealed={showResults} />
    </div>
  );
}

// ─── Scene 6: Sensor Catalog ────────────────────────────────────────────────
function ClientCatalog() {
  const { roomState, voteCatalog } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  const qIndex = roomState.catalogCurrentQuestion || 1;
  const allVotes = roomState.catalogVotes?.[qIndex] || {};
  const myVote = allVotes[myName];
  const totalVotes = Object.keys(allVotes).length;
  const totalStudents = roomState.students.length;

  const correctAnswers = { 1: 'ldr', 2: 'dht11', 3: 'pir', 4: 'ultrasonic' };
  const correctAnswer = correctAnswers[qIndex];
  const isAllAnswered = totalStudents > 0 && totalVotes >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  useEffect(() => {
    setIsTimeUp(false);
    const timer = setTimeout(() => setIsTimeUp(true), 30000 - (Date.now() - roomState.questionStartTime));
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime, qIndex]);

  const questions = {
    1: { prompt: "อุปกรณ์ใดใช้วัดความสว่างของแสง?" },
    2: { prompt: "อุปกรณ์ใดใช้วัดอุณหภูมิและความชื้นในอากาศ?" },
    3: { prompt: "เซนเซอร์ใดใช้ตรวจจับการเคลื่อนไหวของสิ่งมีชีวิต?" },
    4: { prompt: "เซนเซอร์ใดใช้วัดระยะทางด้วยคลื่นเสียง?" },
  };
  const currentQ = questions[qIndex];

  const options = [
    { id: 'ldr', label: 'LDR (เซนเซอร์แสง)', color: '#ffb86c', icon: '☀️' },
    { id: 'dht11', label: 'DHT11 (อุณหภูมิ/ความชื้น)', color: '#ff79c6', icon: '🌡️' },
    { id: 'pir', label: 'PIR (ตรวจจับความเคลื่อนไหว)', color: '#8be9fd', icon: '🚶' },
    { id: 'ultrasonic', label: 'Ultrasonic (วัดระยะทาง)', color: '#50fa7b', icon: '🦇' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={50} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>คำถามที่ {qIndex} / 4</div>
          <div style={{ fontWeight: 'bold', color: 'var(--neon-blue)', fontSize: '1rem', lineHeight: '1.3' }}>{currentQ.prompt}</div>
          <div style={{ fontSize: '0.75rem', color: isTimeUp ? (totalVotes >= totalStudents ? 'var(--neon-green)' : 'var(--text-secondary)') : 'var(--neon-blue)' }}>
            {isTimeUp ? `โหวตแล้ว ${totalVotes} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {options.map(opt => {
          const count = Object.values(allVotes).filter(v => v === opt.id).length;
          const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          const isMyVote = myVote === opt.id;
          const isCorrectAnswer = opt.id === correctAnswer;
          
          return (
            <motion.button key={opt.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => !myVote && !isTimeUp && voteCatalog(opt.id, myName)}
              disabled={!!myVote || isTimeUp}
              style={{
                background: showResults && isCorrectAnswer ? '#50fa7b'
                  : showResults && !isCorrectAnswer ? 'rgba(255,255,255,0.1)'
                  : isMyVote ? `${opt.color}dd` : opt.color,
                color: showResults && !isCorrectAnswer ? 'var(--text-secondary)' : '#1a1a2e',
                border: `3px solid ${isMyVote ? 'white' : 'transparent'}`,
                borderRadius: 14, padding: '1rem', cursor: myVote || isTimeUp ? 'default' : 'pointer',
                position: 'relative', overflow: 'hidden', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                minHeight: '140px',
                boxShadow: isMyVote ? '0 0 15px rgba(255,255,255,0.5)' : '0 4px 6px rgba(0,0,0,0.3)',
                transform: isMyVote ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s'
              }}
            >
              {showResults && (
                <motion.div initial={{ height: '0%' }} animate={{ height: `${pct}%` }}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.1)', zIndex: 1 }}
                />
              )}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
                <span style={{ fontSize: '2.5rem' }}>{opt.icon}</span>
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.2' }}>
                  {opt.label}
                </span>
                {showResults && totalVotes > 0 && (
                  <span style={{ fontWeight: '900', fontSize: '1.2rem', marginTop: '0.2rem' }}>
                    {pct}%
                  </span>
                )}
                {showResults && isCorrectAnswer && (
                  <span style={{ position: 'absolute', top: -30, right: -30, fontSize: '1.5rem', background: 'white', borderRadius: '50%', padding: '2px' }}>🎯</span>
                )}
                {isMyVote && !showResults && (
                  <span style={{ position: 'absolute', top: -30, left: -30, fontSize: '1.5rem', background: 'white', borderRadius: '50%', padding: '2px' }}>✅</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scene 7: Sensor Quiz ──────────────────────────────────────────────────
function ClientQuiz() {
  const { roomState, voteQuiz } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const myVote = roomState.quizVotes?.[myName];
  const allVotes = roomState.quizVotes || {};
  const totalVoted = Object.keys(allVotes).length;
  const totalStudents = roomState.students.length;
  const [isTimeUp, setIsTimeUp] = useState(false);

  const options = [
    { id: 'ldr',  label: 'เซนเซอร์แสง (LDR)',        emoji: '☀️', color: '#ffb86c' },
    { id: 'dht',  label: 'เซนเซอร์อุณหภูมิ (DHT11)', emoji: '🌡️', color: '#ff79c6' },
    { id: 'pir',  label: 'จับการเคลื่อนไหว (PIR)',    emoji: '🚶', color: '#8be9fd' },
    { id: 'soil', label: 'ความชื้นดิน',               emoji: '🌱', color: '#50fa7b' },
  ];
  const isRevealed = roomState.quizRevealed;
  const isAllAnswered = totalStudents > 0 && totalVoted >= totalStudents;
  const showResults = isTimeUp || isRevealed || isAllAnswered;

  useEffect(() => {
    setIsTimeUp(false);
    const remaining = 30000 - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={45} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          โจทย์อยู่บนหน้าจอครู! เลือกเซนเซอร์ที่เหมาะสมที่สุด
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {options.map(opt => {
          const count = Object.values(allVotes).filter(v => v === opt.id).length;
          const pct = totalVoted === 0 ? 0 : Math.round((count / totalVoted) * 100);
          const isMyVote = myVote === opt.id;
          const isCorrect = opt.id === 'ldr';
          return (
            <motion.button key={opt.id} whileTap={{ scale: 0.96 }}
              onClick={() => !myVote && !isRevealed && !isTimeUp && voteQuiz(opt.id, myName)}
              style={{
                position: 'relative', overflow: 'hidden',
                background: showResults && isCorrect ? 'rgba(80,250,123,0.15)' : isMyVote ? `${opt.color}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${showResults && isCorrect ? '#50fa7b' : isMyVote ? opt.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '0.9rem 0.75rem', cursor: myVote || isRevealed || isTimeUp ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem'
              }}
            >
              {/* bar background — only after reveal */}
              {showResults && totalVoted > 0 && (
                <motion.div initial={{ height: '0%' }} animate={{ height: `${pct}%` }}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `${opt.color}18` }} />
              )}
              <span style={{ position: 'relative', fontSize: '2rem' }}>{opt.emoji}</span>
              <span style={{ position: 'relative', fontSize: '0.78rem', textAlign: 'center', color: showResults && isCorrect ? '#50fa7b' : isMyVote ? opt.color : 'var(--text-primary)', fontWeight: showResults && isCorrect ? 'bold' : 'normal' }}>
                {opt.label} {isMyVote && '✅'} {showResults && isCorrect && '🎯'}
              </span>
              {showResults && totalVoted > 0 && (
                <span style={{ position: 'relative', fontSize: '0.75rem', color: opt.color, fontWeight: 'bold' }}>
                  {count} คน ({pct}%)
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: showResults ? 'var(--text-secondary)' : 'var(--neon-blue)' }}>
        {showResults ? `โหวตแล้ว ${totalVoted} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
      </div>

      {myVote && !showResults && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: 'var(--neon-blue)', fontSize: '0.9rem', padding: '0.25rem' }}>
          ⏳ บันทึกคำตอบแล้ว — รอสรุปผลเมื่อหมดเวลา
        </motion.div>
      )}

      {showResults && myVote && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: myVote === 'ldr' ? 'var(--neon-green)' : '#ff6b6b', fontSize: '0.9rem', padding: '0.25rem' }}>
          {myVote === 'ldr' ? '🎉 ถูกต้อง!' : '❌ ไม่ถูก — คำตอบที่ถูกคือ เซนเซอร์แสง (LDR)'}
        </motion.div>
      )}
      {showResults && !myVote && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#ff6b6b', fontSize: '0.9rem' }}>
          ⏰ หมดเวลา! คำตอบที่ถูกคือ เซนเซอร์แสง (LDR)
        </motion.div>
      )}

      {isRevealed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'rgba(80,250,123,0.1)', border: '1px solid #50fa7b', borderRadius: 12, padding: '1rem', fontSize: '0.85rem', lineHeight: 1.6, color: 'white' }}>
          {sensorQuizExplanation}
        </motion.div>
      )}
    </div>
  );
}

// ─── Scene 8: Logic Building ────────────────────────────────────────────────
function ClientLogic() {
  const { roomState, voteLogic } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const myVote = roomState.logicVotes?.[myName];
  const allVotes = roomState.logicVotes || {};
  const totalVoted = Object.keys(allVotes).length;
  const totalStudents = roomState.students.length;
  const [isTimeUp, setIsTimeUp] = useState(false);

  const correctId = 'dry';
  const isAllAnswered = totalStudents > 0 && totalVoted >= totalStudents;
  const showResults = isTimeUp || isAllAnswered;

  useEffect(() => {
    setIsTimeUp(false);
    const remaining = 30000 - (Date.now() - roomState.questionStartTime);
    if (remaining <= 0) { setIsTimeUp(true); return; }
    const timer = setTimeout(() => setIsTimeUp(true), remaining);
    return () => clearTimeout(timer);
  }, [roomState.questionStartTime]);

  const conditions = [
    { id: 'dark',   label: 'ถ้า "แสงมืด" (LDR < 500)',        color: '#8be9fd' },
    { id: 'dry',    label: 'ถ้า "ดินแห้ง" (Soil > 3000)',      color: '#50fa7b' },
    { id: 'motion', label: 'ถ้า "มีคนเดินผ่าน" (PIR == 1)',   color: '#ff79c6' },
    { id: 'hot',    label: 'ถ้า "อากาศร้อน" (Temp > 30)',      color: '#ffb86c' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Timer + Code preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <CountdownTimer startTime={roomState.questionStartTime} duration={30} size={50} />
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: 10, borderLeft: '4px solid var(--neon-purple)', fontFamily: 'monospace', fontSize: '0.95rem', color: '#ffb86c', lineHeight: 1.8 }}>
        IF ( <span style={{ color: 'var(--neon-blue)', borderBottom: myVote ? `2px solid var(--neon-blue)` : '2px dashed rgba(0,240,255,0.4)' }}>
          {myVote ? conditions.find(c => c.id === myVote)?.label : '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'}
        </span> ) {'{'}
        <br />&nbsp;&nbsp;<span style={{ color: '#50fa7b' }}>รดน้ำต้นไม้();</span>
        <br />{'}'}
        </div>
      </div>

      {/* ตัวเลือก */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {conditions.map(c => {
          const count = Object.values(allVotes).filter(v => v === c.id).length;
          const pct = totalVoted === 0 ? 0 : Math.round((count / totalVoted) * 100);
          const isMyVote = myVote === c.id;
          const isCorrectAnswer = c.id === correctId;
          return (
            <motion.button key={c.id} whileTap={{ scale: 0.98 }}
              onClick={() => !myVote && !isTimeUp && voteLogic(c.id, myName)}
              style={{
                position: 'relative', overflow: 'hidden',
                background: showResults && isCorrectAnswer ? 'rgba(80,250,123,0.15)'
                  : isMyVote ? `${c.color}18` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${showResults && isCorrectAnswer ? '#50fa7b' : isMyVote ? c.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10, padding: '0.85rem 1rem', cursor: myVote || isTimeUp ? 'default' : 'pointer',
                textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              {/* bar — only after reveal */}
              {showResults && (
                <motion.div initial={{ width: '0%' }} animate={{ width: `${pct}%` }}
                  style={{ position: 'absolute', inset: 0, background: `${c.color}14` }} />
              )}
              <span style={{ position: 'relative', color: showResults && isCorrectAnswer ? '#50fa7b' : isMyVote ? c.color : 'white', fontSize: '0.9rem', fontWeight: isMyVote || (showResults && isCorrectAnswer) ? 'bold' : 'normal' }}>
                {isMyVote && '✅ '}{c.label} {showResults && isCorrectAnswer && '🎯'}
              </span>
              {showResults && totalVoted > 0 && (
                <span style={{ position: 'relative', color: c.color, fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                  {count} ({pct}%)
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: showResults ? 'var(--text-secondary)' : 'var(--neon-blue)' }}>
        {showResults ? `ตอบแล้ว ${totalVoted} / ${totalStudents} คน` : 'กำลังเปิดรับคำตอบ... ⏳'}
      </div>

      {myVote && !showResults && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: 'var(--neon-blue)', fontSize: '0.9rem', padding: '0.5rem' }}>
          ⏳ บันทึกคำตอบแล้ว — รอสรุปผลเมื่อหมดเวลา
        </motion.div>
      )}

      {showResults && myVote && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: myVote === correctId ? 'var(--neon-green)' : '#ff6b6b', fontSize: '0.9rem' }}>
          {myVote === correctId ? '🎉 ถูกต้อง!' : '❌ ไม่ถูก — คำตอบที่ถูกคือ ถ้า "ดินแห้ง" (Soil > 3000)'}
        </motion.div>
      )}
      {showResults && !myVote && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#ff6b6b', fontSize: '0.9rem' }}>
          {'⏰ หมดเวลา! คำตอบที่ถูกคือ ถ้า "ดินแห้ง" (Soil > 3000)'}
        </motion.div>
      )}
    </div>
  );
}

// ─── Scene 9 & 10: Conclusion & Podium ──────────────────────────────────────
function ClientWrapUp() {
  const { roomState, addFloatingEmoji } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const scores = (roomState.chapterScores && roomState.chapterScores[roomState.chapter]) || {};
  const students = roomState.students || [];
  const sortedStudents = [...students].sort((a, b) => (scores[b.name] || 0) - (scores[a.name] || 0));
  const myRank = sortedStudents.findIndex(s => s.name === myName) + 1;
  const myScore = scores[myName] || 0;
  const medals = ['', '🥇', '🥈', '🥉'];
  
  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: 400, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.8rem', margin: 0 }}>ยินดีด้วย! 🎉</h2>
        
        {/* My rank */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          style={{ background: myRank <= 3 ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2))' : 'rgba(255,255,255,0.05)', border: myRank <= 3 ? '2px solid rgba(255,215,0,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ fontSize: '3rem' }}>{medals[myRank] || '🏅'}</div>
          <div style={{ color: 'var(--neon-blue)', fontSize: '2rem', fontWeight: 800 }}>{myScore} pts</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>อันดับที่ {myRank} จาก {students.length} คน</div>
        </motion.div>

        {/* Top 3 mini leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {sortedStudents.slice(0, 5).map((s, i) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', borderRadius: 10, background: s.name === myName ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)', border: s.name === myName ? '1px solid var(--neon-blue)' : 'none' }}>
              <span style={{ color: s.name === myName ? 'var(--neon-blue)' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {medals[i + 1] || `${i + 1}.`} {s.name}
              </span>
              <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold', fontSize: '0.85rem' }}>{scores[s.name] || 0}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => addFloatingEmoji('🎉')} style={{ fontSize: '3rem', background: 'none', border: 'none', cursor: 'pointer' }}>🎉</motion.button>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => addFloatingEmoji('👏')} style={{ fontSize: '3rem', background: 'none', border: 'none', cursor: 'pointer' }}>👏</motion.button>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => addFloatingEmoji('❤️')} style={{ fontSize: '3rem', background: 'none', border: 'none', cursor: 'pointer' }}>❤️</motion.button>
        </div>
      </div>
    </div>
  );
}




// ─── Client View Shell ────────────────────────────────────────────────────────

const TAB_ACTIVITY = 'activity';
const TAB_LESSON   = 'lesson';

export default function ClientView() {
  const { roomState } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const [tab, setTab] = useState(TAB_ACTIVITY);
  const myScore = ((roomState.chapterScores && roomState.chapterScores[roomState.chapter]) || {})[myName] || 0;

  const currentChapterFlow = CHAPTER_FLOW[roomState.chapter] || CHAPTER_FLOW[1];
  const currentStepData = currentChapterFlow[roomState.step] || currentChapterFlow[0];

  // Auto-follow teacher's presentation mode
  useEffect(() => {
    if (!myName) return;
    const mode = roomState.presentation?.mode;
    if (mode === 'lesson') setTab(TAB_LESSON);
    else if (mode === 'activity') setTab(TAB_ACTIVITY);
  }, [roomState.presentation?.mode, myName]);

  const renderScene = () => {
    if (!myName) return <ClientLobby />;
    
    switch (currentStepData.type) {
      case 'lobby': return <ClientLobby />;
      case 'podium': return <ClientWrapUp />;
      case 'activity':
        switch (currentStepData.id) {
          case 'architecture': return <ClientArchitecture />;
          case 'problem': return <ClientProblem />;
          case 'digital': return <ClientDigital />;
          case 'analog': return <ClientAnalog />;
          case 'catalog': return <ClientCatalog />;
          case 'quiz': return <ClientQuiz />;
          case 'logic': return <ClientLogic />;
          case 'wrapup': return <ClientWrapUp />;
          case 'ideation': return <div className="flex-center full-screen" style={{ flexDirection: 'column' }}><h2>รอกิจกรรมออกแบบไอเดีย...</h2></div>;
          default: return <div>Unknown Activity</div>;
        }
      default:
        return (
          <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '5rem' }}>📱</div>
            <h2 className="text-glow-blue">รอคุณครูดำเนินการ...</h2>
          </div>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
    }}>

      {/* ── Top status / tab bar ── */}
      {myName && (
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'rgba(10,15,26,.97)',
          borderBottom: '1px solid rgba(255,255,255,.07)',
          zIndex: 100,
        }}>
          <span style={{ fontSize: '.72rem', color: 'var(--neon-blue)', display: 'flex', alignItems: 'center', gap: 5 }}>
            📡 {myName} &nbsp;|&nbsp; 🏆 {myScore} pts
          </span>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              id="client-tab-activity"
              onClick={() => setTab(TAB_ACTIVITY)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: tab === TAB_ACTIVITY
                  ? '1.5px solid var(--neon-blue)'
                  : '1.5px solid rgba(255,255,255,.14)',
                background: tab === TAB_ACTIVITY ? 'rgba(0,240,255,.12)' : 'transparent',
                color: tab === TAB_ACTIVITY ? 'var(--neon-blue)' : 'var(--text-secondary)',
                font: '600 .78rem Outfit, sans-serif',
                cursor: 'pointer',
                transition: '.2s ease',
              }}
            >
              ⚡ กิจกรรม
            </button>
            <button
              id="client-tab-lesson"
              onClick={() => setTab(TAB_LESSON)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: tab === TAB_LESSON
                  ? '1.5px solid var(--neon-purple)'
                  : '1.5px solid rgba(255,255,255,.14)',
                background: tab === TAB_LESSON ? 'rgba(176,38,255,.12)' : 'transparent',
                color: tab === TAB_LESSON ? '#d8adff' : 'var(--text-secondary)',
                font: '600 .78rem Outfit, sans-serif',
                cursor: 'pointer',
                transition: '.2s ease',
              }}
            >
              📖 เนื้อหา
            </button>
          </div>
        </div>
      )}

      {/* ── Main area: fills remaining height ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence mode="wait">
          {tab === TAB_ACTIVITY ? (
            <motion.div
              key={`activity-${effectivePhase}`}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
              style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
            >
              {renderScene()}
            </motion.div>
          ) : (
            <motion.div
              key={`lesson-${effectivePhase}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <LessonSlideshow
                key={effectivePhase}
                phase={effectivePhase}
                quizRevealed={roomState.quizRevealed}
                controlledSlide={roomState.presentation?.slide ?? 0}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
