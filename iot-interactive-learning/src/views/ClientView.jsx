import React, { useState, useRef } from 'react';
import { useRoom } from '../context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Phase 1: Lobby Entry ─────────────────────────────────────────────────────
function ClientLobby() {
  const { roomState, joinRoom, sendFloatingEmoji } = useRoom();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [myName, setMyName] = useState(sessionStorage.getItem('student_name') || '');

  // Already joined (persisted in sessionStorage)
  if (myName) {
    return (
      <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '5rem' }}>🎉</motion.div>
        <h2 className="text-glow-blue" style={{ fontSize: '2rem' }}>สวัสดี, {myName}!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>รอคุณครูเริ่มบทเรียน...</p>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1.5rem' }}>
          {['👍', '💡', '🔥', '❓', '😮'].map(emoji => (
            <motion.button key={emoji} whileTap={{ scale: 0.8 }} className="neu-button"
              onClick={() => sendFloatingEmoji(emoji, myName)}
              style={{ fontSize: '2.5rem', padding: '1rem' }}>
              {emoji}
            </motion.button>
          ))}
        </div>
        <p style={{ color: 'var(--neon-blue)', fontSize: '0.9rem' }}>กดส่ง Emoji ให้ครูรู้ว่าคุณพร้อม!</p>
      </div>
    );
  }

  const handleJoin = (e) => {
    e.preventDefault();
    if (pin.trim() !== roomState.pin) {
      alert('❌ รหัส PIN ไม่ถูกต้อง! ลองใหม่อีกครั้ง');
      return;
    }
    if (!name.trim()) {
      alert('❌ กรุณากรอกชื่อของคุณ');
      return;
    }
    joinRoom(name.trim());
    sessionStorage.setItem('student_name', name.trim());
    setMyName(name.trim());
  };

  return (
    <div className="flex-center full-screen" style={{ background: 'radial-gradient(circle at 30% 50%, #0d1a3a 0%, #0a0f1a 100%)' }}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 80 }}
        className="glass-panel"
        style={{ padding: '3rem 2.5rem', width: '90%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ fontSize: '4rem' }}>🎓</div>
        <h2 className="text-glow-blue" style={{ fontSize: '2rem', textAlign: 'center', margin: 0 }}>เข้าร่วมห้องเรียน</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>IoT Sensors & Signals</p>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>🔐 รหัส PIN</label>
            <input type="text" inputMode="numeric" placeholder="1234" className="neu-input"
              value={pin} onChange={e => setPin(e.target.value)} maxLength={4}
              style={{ textAlign: 'center', fontSize: '2.5rem', letterSpacing: '0.6em', fontFamily: "'Outfit', sans-serif", fontWeight: 800 }} />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>👤 ชื่อของคุณ</label>
            <input type="text" placeholder="เช่น สมชาย" className="neu-input"
              value={name} onChange={e => setName(e.target.value)} maxLength={20} />
          </div>
          <motion.button type="submit" whileTap={{ scale: 0.95 }} className="neu-button"
            style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.2rem', color: 'var(--neon-blue)', width: '100%' }}>
            🚀 เข้าร่วมเลย!
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Phase 2: The Senses ──────────────────────────────────────────────────────
function ClientSenses() {
  const { roomState, activateSense } = useRoom();
  const myName = sessionStorage.getItem('student_name') || '';

  const senses = [
    { id: 'eyes', icon: '👁️', label: 'ตา', desc: 'แสง / ภาพ (Camera, LDR)', color: '#ff6b6b' },
    { id: 'ears', icon: '👂', label: 'หู', desc: 'เสียง (Microphone, Sound)', color: '#4ecdc4' },
    { id: 'hands', icon: '✋', label: 'มือ', desc: 'สัมผัส / อุณหภูมิ (DHT11, Touch)', color: '#a8e063' },
  ];

  const allDone = senses.every(s => roomState.senses[s.id]);

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <h2 className="text-glow-blue" style={{ fontSize: '1.8rem', margin: 0, textAlign: 'center' }}>ส่งสัมผัสให้บอร์ด ESP32!</h2>
      <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>กดปุ่มแต่ละอวัยวะเพื่อเชื่อมต่อเซนเซอร์</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%', maxWidth: 340 }}>
        {senses.map(s => {
          const active = roomState.senses[s.id];
          return (
            <motion.button key={s.id} whileTap={{ scale: 0.93 }}
              onClick={() => activateSense(s.id)}
              style={{
                background: active ? `rgba(${s.id === 'eyes' ? '255,107,107' : s.id === 'ears' ? '78,205,196' : '168,224,99'},0.15)` : 'var(--bg-secondary)',
                border: `2px solid ${active ? s.color : 'transparent'}`,
                borderRadius: 20,
                padding: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1.2rem',
                boxShadow: active ? `0 0 20px ${s.color}44, var(--neumorph-inset)` : 'var(--neumorph-shadow)',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                color: 'var(--text-primary)',
              }}>
              <span style={{ fontSize: '3rem', filter: active ? 'none' : 'grayscale(80%)' }}>{s.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.3rem', color: active ? s.color : 'var(--text-primary)' }}>
                  {s.label} {active && '✅'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
      {allDone && (
        <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-glow-blue"
          style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '1.2rem' }}>
          🎉 เยี่ยม! เชื่อมต่อครบแล้ว รอครูเดินหน้า...
        </motion.p>
      )}
    </div>
  );
}

// ─── Phase 3: Word Cloud ──────────────────────────────────────────────────────
function ClientWordCloud() {
  const { submitWord } = useRoom();
  const [word, setWord] = useState('');
  const [sent, setSent] = useState(false);
  const myName = sessionStorage.getItem('student_name') || '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!word.trim()) return;
    submitWord(word.trim(), myName);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.5 }} style={{ fontSize: '6rem' }}>🚀</motion.div>
        <h2 className="text-glow-blue">ส่งคำตอบแล้ว!</h2>
        <p style={{ color: 'var(--text-secondary)' }}>รอดูผลบนจอครูได้เลย...</p>
      </div>
    );
  }

  return (
    <div className="flex-center full-screen" style={{ background: 'radial-gradient(circle at 50% 0%, #0d1a3a 0%, #0a0f1a 100%)' }}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="glass-panel"
        style={{ padding: '3rem 2.5rem', width: '90%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        <h2 style={{ textAlign: 'center', margin: 0, fontSize: '1.5rem' }}>🤔 เซนเซอร์คุยกับบอร์ดด้วย<span className="text-glow-blue">ภาษาอะไร</span>?</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <input className="neu-input" placeholder="พิมพ์คำตอบ... (จำกัด 15 ตัว)"
            value={word} onChange={e => setWord(e.target.value.slice(0, 15))}
            style={{ fontSize: '1.5rem', textAlign: 'center' }} />
          <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'right', fontSize: '0.85rem' }}>{word.length}/15</p>
          <motion.button type="submit" whileTap={{ scale: 0.95 }} className="neu-button"
            style={{ padding: '1rem', fontSize: '1.2rem', color: 'var(--neon-blue)' }}>
            🚀 ส่งคำตอบ!
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Client View Shell ────────────────────────────────────────────────────────
export default function ClientView() {
  const { roomState } = useRoom();
  const myName = sessionStorage.getItem('student_name');

  // If not joined yet, always show lobby
  const effectivePhase = myName ? roomState.phase : 1;

  const renderScene = () => {
    switch (effectivePhase) {
      case 1: return <ClientLobby />;
      case 2: return <ClientSenses />;
      case 3: return <ClientWordCloud />;
      default:
        return (
          <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '5rem' }}>📱</div>
            <h2 className="text-glow-blue">Phase {roomState.phase}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>รอคุณครูดำเนินการ...</p>
          </div>
        );
    }
  };

  return (
    <div className="full-screen" style={{ overflow: 'hidden' }}>
      {/* Phase indicator */}
      {myName && (
        <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 100, background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', color: 'var(--neon-blue)' }}>
          📡 เชื่อมต่อแล้ว — Phase {roomState.phase}
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={effectivePhase} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}
          style={{ width: '100%', height: '100%' }}>
          {renderScene()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
