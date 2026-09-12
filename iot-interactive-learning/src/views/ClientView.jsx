import React, { useState, useRef, useEffect } from 'react';
import { useRoom } from '../context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentLessonNotes } from '../components/LessonContent';
import { sensorQuizExplanation } from '../content/lessons';

// ─── Scene 1: Lobby ───────────────────────────────────────────────────────────
function ClientLobby() {
  const { roomState, joinRoom, sendFloatingEmoji } = useRoom();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const myName = sessionStorage.getItem('student_name') || '';

  if (myName) {
    return (
      <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: '5rem' }}>🎉</motion.div>
        <h2 className="text-glow-blue" style={{ fontSize: '2rem' }}>สวัสดี, {myName}!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>รอคุณครูเริ่มบทเรียน...</p>
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

  const handleJoin = (e) => {
    e.preventDefault();
    if (pin.trim() !== roomState.pin) {
      alert('❌ รหัส PIN ไม่ถูกต้อง!');
      return;
    }
    if (!name.trim()) {
      alert('❌ กรุณากรอกชื่อของคุณ');
      return;
    }
    joinRoom(name.trim());
    sessionStorage.setItem('student_name', name.trim());
    window.location.reload();
  };

  return (
    <div className="flex-center full-screen" style={{ background: 'radial-gradient(circle at 30% 50%, #0d1a3a 0%, #0a0f1a 100%)' }}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="glass-panel"
        style={{ padding: '3rem 2.5rem', width: '90%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ fontSize: '4rem' }}>🚀</div>
        <h2 className="text-glow-blue" style={{ fontSize: '2rem', textAlign: 'center', margin: 0 }}>Welcome to IoT Lab</h2>
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%' }}>
          <input type="text" inputMode="numeric" placeholder="รหัส PIN (เช่น 8492)" className="neu-input"
            value={pin} onChange={e => setPin(e.target.value)} maxLength={4}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.2em' }} />
          <input type="text" placeholder="ชื่อเล่นนักวิจัย" className="neu-input"
            value={name} onChange={e => setName(e.target.value)} maxLength={20}
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
  
  const currentItem = roomState.currentVoteItem; // 'esp32', 'wifi', 'cloud'
  const myVote = roomState.architectureVotes[currentItem]?.[myName];

  const handleVote = (layer) => {
    submitVote(currentItem, layer, myName);
  };

  const itemInfo = {
    esp32: { name: 'บอร์ด ESP32', icon: '🎛️' },
    wifi: { name: 'Wi-Fi Router', icon: '📶' },
    cloud: { name: 'Cloud Server', icon: '☁️' }
  };
  const activeItem = itemInfo[currentItem];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: 340 }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.2rem', textAlign: 'center', margin: 0 }}>อุปกรณ์ชิ้นนี้ควรอยู่ชั้นไหน?</h2>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} key={currentItem}
          style={{ fontSize: '5rem', filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.5))' }}>
          {activeItem.icon}
        </motion.div>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{activeItem.name}</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 340 }}>
        <motion.button whileTap={{ scale: 0.95 }} className="neu-button" onClick={() => handleVote('service')}
          disabled={!!myVote}
          style={{ opacity: myVote ? (myVote === 'service' ? 1 : 0.4) : 1, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: myVote === 'service' ? '2px solid var(--neon-purple)' : 'none' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--neon-purple)' }}>Service Layer</span>
          {myVote === 'service' && <span>✅</span>}
        </motion.button>

        <motion.button whileTap={{ scale: 0.95 }} className="neu-button" onClick={() => handleVote('network')}
          disabled={!!myVote}
          style={{ opacity: myVote ? (myVote === 'network' ? 1 : 0.4) : 1, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: myVote === 'network' ? '2px solid var(--neon-green)' : 'none' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--neon-green)' }}>Network Layer</span>
          {myVote === 'network' && <span>✅</span>}
        </motion.button>

        <motion.button whileTap={{ scale: 0.95 }} className="neu-button" onClick={() => handleVote('device')}
          disabled={!!myVote}
          style={{ opacity: myVote ? (myVote === 'device' ? 1 : 0.4) : 1, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: myVote === 'device' ? '2px solid var(--neon-blue)' : 'none' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--neon-blue)' }}>Device Layer</span>
          {myVote === 'device' && <span>✅</span>}
        </motion.button>
      </div>

      {myVote && (
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ color: 'var(--text-secondary)' }}>
          รอเพื่อนๆ โหวต...
        </motion.p>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (word.trim()) {
      submitWord(word, myName);
      setWord('');
    }
  };

  if (hasSubmitted) {
    return (
      <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
        <h2 className="text-glow-blue" style={{ fontSize: '2rem', textAlign: 'center' }}>ส่งไอเดียสำเร็จ!</h2>
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ fontSize: '5rem' }}>
          💡
        </motion.div>
        <p style={{ color: 'var(--text-secondary)' }}>รอดูคำตอบของคุณและเพื่อนๆ บนหน้าจอคุณครูนะ</p>
      </div>
    );
  }

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ background: 'rgba(0,240,255,0.1)', border: '2px solid var(--neon-blue)', borderRadius: 12, padding: '1.5rem' }}>
          <h2 className="text-glow-blue" style={{ fontSize: '1.3rem', textAlign: 'center', margin: '0 0 0.5rem 0' }}>❓ ระดมสมองช่วยบอร์ด ESP32!</h2>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
            ตอนนี้บอร์ดตาบอดและหูหนวก! นักเรียนคิดว่าเราควรใช้อุปกรณ์อะไรเพื่อมาเป็น <span style={{color: 'var(--neon-purple)', fontWeight: 'bold'}}>ตา หู จมูก</span> และ <span style={{color: 'var(--neon-purple)', fontWeight: 'bold'}}>ผิวหนัง</span> ให้กับบอร์ด?
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="เช่น เซนเซอร์แสง, กล้อง, ไมค์..." 
            value={word} 
            onChange={(e) => setWord(e.target.value)}
            className="neu-input" 
            style={{ width: '100%', boxSizing: 'border-box', fontSize: '1.2rem', textAlign: 'center' }}
            maxLength={30}
            required
          />
          <motion.button whileTap={{ scale: 0.95 }} type="submit" className="neu-button" style={{ color: 'var(--neon-green)', padding: '1rem', fontSize: '1.2rem' }}>
            ส่งไอเดีย 🚀
          </motion.button>
        </form>
      </div>
    </div>
  );
}

// ─── Scene 4: Digital Signal ────────────────────────────────────────────────
function ClientDigital() {
  const { updateDigital } = useRoom();
  const myName = sessionStorage.getItem('student_name');

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.5rem', textAlign: 'center', margin: 0 }}>ทดสอบสัญญาณ Digital (0 / 1)</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>กดปุ่มค้างไว้เพื่อส่งสัญญาณ <b>1 (HIGH)</b></p>
        
        <motion.button 
          onPointerDown={() => updateDigital(1, myName)}
          onPointerUp={() => updateDigital(0, myName)}
          onPointerLeave={() => updateDigital(0, myName)}
          style={{
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, #ff4d4d 0%, #aa0000 100%)',
            color: 'white', fontSize: '2rem', fontWeight: 'bold',
            boxShadow: '0 10px 30px rgba(255,0,0,0.5)',
            border: '4px solid #ffb3b3',
            cursor: 'pointer',
            WebkitUserSelect: 'none'
          }}
          whileTap={{ scale: 0.9, boxShadow: '0 5px 15px rgba(255,0,0,0.8)' }}
        >
          กดค้าง!
        </motion.button>
      </div>
    </div>
  );
}

// ─── Scene 5: Analog Signal ────────────────────────────────────────────────
function ClientAnalog() {
  const { roomState, updateAnalog } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const val = roomState.analogValues?.[myName] || 0;

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <h2 className="text-glow-blue" style={{ fontSize: '1.5rem', textAlign: 'center', margin: 0 }}>ทดสอบสัญญาณ Analog</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>เลื่อนจำลองค่าหลังแปลง ADC แบบ 12 บิต (0–4095) ค่านี้ยังไม่ใช่หน่วยของสิ่งที่วัด</p>
        
        <div style={{ fontSize: '3rem', color: `hsl(${200 - (val/4095) * 200}, 100%, 50%)`, fontWeight: 'bold', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
          {val}
        </div>
        
        <input 
          type="range" 
          min="0" max="4095" 
          value={val}
          onChange={(e) => updateAnalog(parseInt(e.target.value), myName)}
          style={{ 
            width: '100%', height: 40, 
            accentColor: `hsl(${200 - (val/4095) * 200}, 100%, 50%)`
          }}
        />
      </div>
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

  const options = [
    { id: 'ldr', label: 'เซนเซอร์แสง (LDR)', emoji: '☀️' },
    { id: 'dht', label: 'เซนเซอร์อุณหภูมิ (DHT11)', emoji: '🌡️' },
    { id: 'pir', label: 'เซนเซอร์จับการเคลื่อนไหว (PIR)', emoji: '🚶' },
    { id: 'soil', label: 'เซนเซอร์วัดความชื้นดิน', emoji: '🌱' }
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      <h2 className="text-glow-blue" style={{ fontSize: '1.5rem', textAlign: 'center', margin: 0 }}>เลือกเซนเซอร์ที่ใช่!</h2>
      <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', maxWidth: 400 }}>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
          โจทย์อยู่บนหน้าจอครู! เลือกเซนเซอร์ที่เหมาะสมที่สุด
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {options.map(opt => (
            <motion.button 
              key={opt.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => voteQuiz(opt.id, myName)}
              className="neu-button"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem',
                border: myVote === opt.id ? '2px solid var(--neon-blue)' : '1px solid rgba(255,255,255,0.1)',
                background: myVote === opt.id ? 'rgba(0,240,255,0.2)' : 'transparent',
                color: myVote === opt.id ? 'var(--neon-blue)' : 'var(--text-primary)'
              }}
            >
              <span style={{ fontSize: '2rem' }}>{opt.emoji}</span>
              <span style={{ fontSize: '0.8rem', textAlign: 'center' }}>{opt.label}</span>
            </motion.button>
          ))}
        </div>
        {roomState.quizRevealed && <p className="quiz-explanation" aria-live="polite">{sensorQuizExplanation}</p>}
      </div>
    </div>
  );
}

// ─── Scene 8: Logic Building ────────────────────────────────────────────────
function ClientLogic() {
  const { roomState, voteLogic } = useRoom();
  const myName = sessionStorage.getItem('student_name');
  const myVote = roomState.logicVotes?.[myName];

  const conditions = [
    { id: 'dark', label: 'ถ้า "แสงมืด" (LDR < 500)' },
    { id: 'dry', label: 'ถ้า "ดินแห้ง" (Soil > 3000)' },
    { id: 'motion', label: 'ถ้า "มีคนเดินผ่าน" (PIR == 1)' },
    { id: 'hot', label: 'ถ้า "อากาศร้อน" (Temp > 30)' }
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      <h2 className="text-glow-blue" style={{ fontSize: '1.5rem', textAlign: 'center', margin: 0 }}>สร้างเงื่อนไข (Logic)</h2>
      <div className="glass-panel" style={{ padding: '1.5rem', width: '100%', maxWidth: 400 }}>
        
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', borderLeft: '4px solid var(--neon-purple)', fontFamily: 'monospace', color: '#ffb86c' }}>
          IF ( <span style={{ color: 'var(--neon-blue)' }}>{myVote ? conditions.find(c=>c.id===myVote).label : '___________'}</span> ) {'{'}
          <br/>&nbsp;&nbsp;<span style={{ color: '#50fa7b' }}>รดน้ำต้นไม้();</span>
          <br/>{'}'}
        </div>

        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem' }}>เลือกเงื่อนไขที่ถูกต้อง:</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {conditions.map(c => (
            <button 
              key={c.id}
              onClick={() => voteLogic(c.id, myName)}
              className="neu-button"
              style={{
                padding: '1rem', textAlign: 'left',
                border: myVote === c.id ? '2px solid var(--neon-blue)' : '1px solid rgba(255,255,255,0.1)',
                background: myVote === c.id ? 'rgba(0,240,255,0.2)' : 'transparent',
                color: myVote === c.id ? 'var(--neon-blue)' : 'white'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
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
export default function ClientView() {
  const { roomState } = useRoom();
  const myName = sessionStorage.getItem('student_name');

  const effectivePhase = myName ? roomState.phase : 1;

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
    <div className="student-learning-shell">
      {myName && (
        <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 100, background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', color: 'var(--neon-blue)' }}>
          📡 เชื่อมต่อแล้ว — Phase {roomState.phase}
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={effectivePhase} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}
          className="student-scene" style={{ width: '100%' }}>
          {renderScene()}
          {myName && <StudentLessonNotes phase={effectivePhase} quizRevealed={roomState.quizRevealed} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
