import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentLessonNotes, LessonSlideshow } from '../components/LessonContent';
import { sensorQuizExplanation } from '../content/lessons';

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
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>รอคุณครูเริ่มบทเรียน...</p>

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
          <input type="text" placeholder="ชื่อเล่นนักวิจัย" className="neu-input"
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
  
  const currentItem = roomState.currentVoteItem;
  const allVotes = roomState.architectureVotes?.[currentItem] || {};
  const myVote = allVotes[myName];
  const totalVotes = Object.keys(allVotes).length;
  const totalStudents = roomState.students.length;

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
        <motion.div key={currentItem} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '3rem' }}>
          {activeItem.icon}
        </motion.div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>อุปกรณ์ที่กำลังโหวต</div>
          <div style={{ fontWeight: 'bold', color: 'var(--neon-blue)', fontSize: '1.1rem' }}>{activeItem.name}</div>
          <div style={{ fontSize: '0.75rem', color: totalVotes >= totalStudents ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
            โหวตแล้ว {totalVotes} / {totalStudents} คน
          </div>
        </div>
      </div>

      {/* ปุ่มโหวต */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {layers.map(layer => {
          const count = Object.values(allVotes).filter(v => v === layer.id).length;
          const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
          const isMyVote = myVote === layer.id;
          return (
            <motion.button key={layer.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => !myVote && submitVote(currentItem, layer.id, myName)}
              disabled={!!myVote}
              style={{
                background: isMyVote ? `${layer.color}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isMyVote ? layer.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '1rem', cursor: myVote ? 'default' : 'pointer',
                position: 'relative', overflow: 'hidden', textAlign: 'left'
              }}
            >
              {/* live progress bar behind button */}
              <motion.div animate={{ width: `${pct}%` }}
                style={{ position: 'absolute', inset: 0, background: `${layer.color}18`, borderRadius: 12, width: '0%' }}
              />
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{layer.emoji}</span>
                  <span style={{ color: isMyVote ? layer.color : 'white', fontWeight: isMyVote ? 'bold' : 'normal', fontSize: '1rem' }}>
                    {layer.label} {isMyVote && '✅'}
                  </span>
                </div>
                <span style={{ color: layer.color, fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {totalVotes > 0 ? `${pct}%` : ''}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {myVote && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '0.5rem' }}>
          ✅ คุณโหวตแล้ว! รอผลจากเพื่อน {totalVotes}/{totalStudents} คน
        </motion.div>
      )}
    </div>
  );
}

// ─── Scene 3: The Problem (Word Cloud) ─────────────────────────────────────────
function ClientProblem() {
  const { roomState, submitWord } = useRoom();
  const [word, setWord] = useState('');
  const myName = sessionStorage.getItem('student_name');

  const hasSubmitted = roomState.wordSubmissions?.some(w => w.name === myName);
  const allWords = roomState.wordSubmissions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ background: 'rgba(0,240,255,0.08)', border: '2px solid rgba(0,240,255,0.3)', borderRadius: 14, padding: '1.25rem' }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.1rem', textAlign: 'center', margin: '0 0 0.5rem 0' }}>❓ ระดมสมองช่วยบอร์ด ESP32!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          อุปกรณ์อะไรเป็น <span style={{ color: 'var(--neon-purple)', fontWeight: 'bold' }}>ตา หู จมูก ผิวหนัง</span> ให้บอร์ด?
        </p>
      </div>

      {!hasSubmitted ? (
        <form onSubmit={e => { e.preventDefault(); if (word.trim()) { submitWord(word, myName); setWord(''); } }}
          style={{ display: 'flex', gap: '0.75rem' }}>
          <input type="text" placeholder="เช่น เซนเซอร์แสง, กล้อง..." value={word}
            onChange={e => setWord(e.target.value)} className="neu-input"
            style={{ flex: 1, fontSize: '1rem', textAlign: 'center' }} maxLength={30} required />
          <motion.button whileTap={{ scale: 0.95 }} type="submit" className="neu-button"
            style={{ color: 'var(--neon-green)', padding: '0.75rem 1.25rem', fontSize: '1rem' }}>
            ส่ง 🚀
          </motion.button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--neon-green)', fontSize: '0.9rem', padding: '0.5rem' }}>
          ✅ ส่งไอเดียแล้ว!
        </div>
      )}

      {/* ไอเดียของทุกคน */}
      {allWords.length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 0 0.75rem 0' }}>
            💡 ไอเดียจากทั้งห้อง ({allWords.length} ไอเดีย)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <AnimatePresence>
              {allWords.map(item => (
                <motion.span key={item.id}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{
                    background: item.name === myName ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${item.name === myName ? 'var(--neon-blue)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 20, padding: '4px 12px', fontSize: '0.85rem',
                    color: item.name === myName ? 'var(--neon-blue)' : 'var(--text-primary)'
                  }}>
                  {item.word} <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>({item.name})</span>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scene 4: Digital Signal ────────────────────────────────────────────────
function ClientDigital() {
  const { roomState, updateDigital } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const [pressing, setPressing] = useState(false);

  const presses = roomState.digitalPresses || [];
  const val = roomState.digitalValue || 0;
  const totalStudents = roomState.students.length;

  const handleDown = () => { setPressing(true); updateDigital(1, myName); };
  const handleUp = () => { setPressing(false); updateDigital(0, myName); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 420, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>ทดสอบสัญญาณ Digital (0 / 1)</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          กดปุ่มค้างไว้เพื่อส่งสัญญาณ <b>HIGH (1)</b>
        </p>
      </div>

      {/* สัญญาณรวมของห้อง */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>สัญญาณรวมของห้อง</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: val ? '#ff4d4d' : 'var(--text-secondary)' }}>
            {val ? '1 (HIGH)' : '0 (LOW)'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>กดค้างอยู่</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end', marginTop: 4, maxWidth: 180 }}>
            {roomState.students.map(s => (
              <span key={s.id} style={{
                padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem',
                background: presses.includes(s.name) ? 'rgba(255,77,77,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${presses.includes(s.name) ? '#ff4d4d' : 'rgba(255,255,255,0.1)'}`,
                color: presses.includes(s.name) ? '#ff8888' : 'var(--text-secondary)'
              }}>
                {s.name} {presses.includes(s.name) ? '●' : '○'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ปุ่มกด */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.5rem' }}>
        <motion.button
          onPointerDown={handleDown}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          animate={{ scale: pressing ? 0.9 : 1, boxShadow: pressing ? '0 5px 15px rgba(255,0,0,0.9)' : '0 10px 30px rgba(255,0,0,0.4)' }}
          style={{
            width: 180, height: 180, borderRadius: '50%',
            background: pressing
              ? 'radial-gradient(circle, #ff8080 0%, #cc0000 100%)'
              : 'radial-gradient(circle, #ff4d4d 0%, #aa0000 100%)',
            color: 'white', fontSize: '1.5rem', fontWeight: 'bold',
            border: '4px solid #ffb3b3', cursor: 'pointer', WebkitUserSelect: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4
          }}
        >
          <span>{pressing ? '⚡ HIGH' : 'กดค้าง!'}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{pressing ? '1' : '0'}</span>
        </motion.button>
      </div>
    </div>
  );
}

// ─── Scene 5: Analog Signal ────────────────────────────────────────────────
function ClientAnalog() {
  const { roomState, updateAnalog } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const val = roomState.analogValues?.[myName] ?? 0;

  const allVals = roomState.analogValues || {};
  const others = Object.entries(allVals).filter(([n]) => n !== myName);
  const total = Object.values(allVals).reduce((s, v) => s + v, 0);
  const avg = Object.keys(allVals).length > 0 ? Math.round(total / Object.keys(allVals).length) : 0;

  const hue = (v) => 200 - (v / 4095) * 200;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 420, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>ทดสอบสัญญาณ Analog</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>เลื่อนจำลองค่า ADC 12 บิต (0 – 4095)</p>
      </div>

      {/* Slider ของตัวเอง */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ค่าของฉัน</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: `hsl(${hue(val)}, 100%, 55%)` }}>{val}</span>
        </div>
        <input type="range" min="0" max="4095" value={val}
          onChange={e => updateAnalog(parseInt(e.target.value), myName)}
          style={{ width: '100%', height: 36, accentColor: `hsl(${hue(val)}, 100%, 55%)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <span>0 (มืด/เย็น)</span><span>4095 (สว่าง/ร้อน)</span>
        </div>
      </div>

      {/* ค่าเฉลี่ยห้อง + เพื่อน */}
      {Object.keys(allVals).length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>🏠 ค่าเฉลี่ยของห้อง</span>
            <span style={{ fontWeight: 'bold', fontSize: '1.3rem', color: `hsl(${hue(avg)}, 100%, 55%)` }}>{avg}</span>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${(avg / 4095) * 100}%`, background: `hsl(${hue(avg)}, 100%, 55%)` }} style={{ height: '100%' }} />
          </div>
          {others.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
              {others.map(([n, v]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ width: 60, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${(v / 4095) * 100}%` }} style={{ height: '100%', background: `hsl(${hue(v)}, 100%, 55%)`, borderRadius: 3 }} />
                  </div>
                  <span style={{ width: 36, textAlign: 'right', color: `hsl(${hue(v)}, 100%, 55%)` }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Scene 6: Sensor Catalog (Theory) ────────────────────────────────────────
function ClientCatalog() {
  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <h2 className="text-glow-blue" style={{ fontSize: '1.5rem', textAlign: 'center', margin: 0 }}>รู้จักอวัยวะรับสัมผัส (Sensor)</h2>
      <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.5))', marginBottom: '1rem' }}>👀👂👃</div>
        <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: 1.6 }}>
          ดูแคตตาล็อกบน <b>หน้าจอของคุณครู</b> หรือเปิดคำอธิบายด้านล่างเพื่ออ่านหน้าที่ ตัวอย่าง และข้อจำกัดของเซนเซอร์แต่ละชนิด
        </p>
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

  const options = [
    { id: 'ldr',  label: 'เซนเซอร์แสง (LDR)',        emoji: '☀️', color: '#ffb86c' },
    { id: 'dht',  label: 'เซนเซอร์อุณหภูมิ (DHT11)', emoji: '🌡️', color: '#ff79c6' },
    { id: 'pir',  label: 'จับการเคลื่อนไหว (PIR)',    emoji: '🚶', color: '#8be9fd' },
    { id: 'soil', label: 'ความชื้นดิน',               emoji: '🌱', color: '#50fa7b' },
  ];
  const isRevealed = roomState.quizRevealed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        โจทย์อยู่บนหน้าจอครู! เลือกเซนเซอร์ที่เหมาะสมที่สุด
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {options.map(opt => {
          const count = Object.values(allVotes).filter(v => v === opt.id).length;
          const pct = totalVoted === 0 ? 0 : Math.round((count / totalVoted) * 100);
          const isMyVote = myVote === opt.id;
          const isCorrect = isRevealed && opt.id === 'ldr';
          return (
            <motion.button key={opt.id} whileTap={{ scale: 0.96 }}
              onClick={() => !myVote && !isRevealed && voteQuiz(opt.id, myName)}
              style={{
                position: 'relative', overflow: 'hidden',
                background: isCorrect ? 'rgba(80,250,123,0.15)' : isMyVote ? `${opt.color}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isCorrect ? '#50fa7b' : isMyVote ? opt.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '0.9rem 0.75rem', cursor: myVote || isRevealed ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem'
              }}
            >
              {/* live bar background */}
              {totalVoted > 0 && (
                <motion.div animate={{ height: `${pct}%` }}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `${opt.color}18`, height: '0%' }} />
              )}
              <span style={{ position: 'relative', fontSize: '2rem' }}>{opt.emoji}</span>
              <span style={{ position: 'relative', fontSize: '0.78rem', textAlign: 'center', color: isMyVote ? opt.color : 'var(--text-primary)' }}>
                {opt.label} {isMyVote && '✅'} {isCorrect && '🎯'}
              </span>
              {totalVoted > 0 && (
                <span style={{ position: 'relative', fontSize: '0.75rem', color: opt.color, fontWeight: 'bold' }}>
                  {count} คน ({pct}%)
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        โหวตแล้ว {totalVoted} / {totalStudents} คน
      </div>

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

  const conditions = [
    { id: 'dark',   label: 'ถ้า "แสงมืด" (LDR < 500)',        color: '#8be9fd' },
    { id: 'dry',    label: 'ถ้า "ดินแห้ง" (Soil > 3000)',      color: '#50fa7b' },
    { id: 'motion', label: 'ถ้า "มีคนเดินผ่าน" (PIR == 1)',   color: '#ff79c6' },
    { id: 'hot',    label: 'ถ้า "อากาศร้อน" (Temp > 30)',      color: '#ffb86c' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: 440, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Code preview */}
      <div style={{ background: 'rgba(0,0,0,0.35)', padding: '1rem', borderRadius: 10, borderLeft: '4px solid var(--neon-purple)', fontFamily: 'monospace', fontSize: '0.95rem', color: '#ffb86c', lineHeight: 1.8 }}>
        IF ( <span style={{ color: 'var(--neon-blue)', borderBottom: myVote ? `2px solid var(--neon-blue)` : '2px dashed rgba(0,240,255,0.4)' }}>
          {myVote ? conditions.find(c => c.id === myVote)?.label : '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'}
        </span> ) {'{'}
        <br />&nbsp;&nbsp;<span style={{ color: '#50fa7b' }}>รดน้ำต้นไม้();</span>
        <br />{'}'}
      </div>

      {/* ตัวเลือก */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {conditions.map(c => {
          const count = Object.values(allVotes).filter(v => v === c.id).length;
          const pct = totalVoted === 0 ? 0 : Math.round((count / totalVoted) * 100);
          const isMyVote = myVote === c.id;
          return (
            <motion.button key={c.id} whileTap={{ scale: 0.98 }}
              onClick={() => !myVote && voteLogic(c.id, myName)}
              style={{
                position: 'relative', overflow: 'hidden',
                background: isMyVote ? `${c.color}18` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isMyVote ? c.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10, padding: '0.85rem 1rem', cursor: myVote ? 'default' : 'pointer',
                textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              {/* live bar */}
              <motion.div animate={{ width: `${pct}%` }}
                style={{ position: 'absolute', inset: 0, background: `${c.color}14`, width: '0%' }} />
              <span style={{ position: 'relative', color: isMyVote ? c.color : 'white', fontSize: '0.9rem', fontWeight: isMyVote ? 'bold' : 'normal' }}>
                {isMyVote && '✅ '}{c.label}
              </span>
              {totalVoted > 0 && (
                <span style={{ position: 'relative', color: c.color, fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                  {count} ({pct}%)
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        ตอบแล้ว {totalVoted} / {totalStudents} คน
      </div>
    </div>
  );
}

// ─── Scene 9 & 10: Conclusion & Podium ──────────────────────────────────────
function ClientWrapUp() {
  const { addFloatingEmoji } = useRoom();
  
  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: 400, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.8rem', margin: 0 }}>ยินดีด้วย! 🎉</h2>
        <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
          คุณได้ฝึกพื้นฐานของ IoT ในบทเรียนนี้แล้ว<br/>ตั้งแต่ Device, Sensor, สัญญาณ ไปจนถึง Logic! ลองอ่านสรุปด้านล่าง แล้วอธิบายระบบด้วยคำของตัวเอง
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => addFloatingEmoji('🎉')} style={{ fontSize: '3rem', background: 'none', border: 'none', cursor: 'pointer' }}>🎉</motion.button>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => addFloatingEmoji('👏')} style={{ fontSize: '3rem', background: 'none', border: 'none', cursor: 'pointer' }}>👏</motion.button>
          <motion.button whileTap={{ scale: 0.8 }} onClick={() => addFloatingEmoji('❤️')} style={{ fontSize: '3rem', background: 'none', border: 'none', cursor: 'pointer' }}>❤️</motion.button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>กดส่งสติ๊กเกอร์ไปที่หน้าจอครูเลย!</p>
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
  const myScore = (roomState.scores || {})[myName] || 0;

  const effectivePhase = myName ? roomState.phase : 1;

  // Auto-follow teacher's presentation mode
  useEffect(() => {
    if (!myName) return;
    const mode = roomState.presentation?.mode;
    if (mode === 'lesson') setTab(TAB_LESSON);
    else if (mode === 'activity') setTab(TAB_ACTIVITY);
  }, [roomState.presentation?.mode, myName]);

  const renderScene = () => {
    switch (effectivePhase) {
      case 1: return <ClientLobby />;
      case 2: return <ClientArchitecture />;
      case 3: return <ClientProblem />;
      case 4: return <ClientDigital />;
      case 5: return <ClientAnalog />;
      case 6: return <ClientCatalog />;
      case 7: return <ClientQuiz />;
      case 8: return <ClientLogic />;
      case 9:
      case 10: return <ClientWrapUp />;
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
