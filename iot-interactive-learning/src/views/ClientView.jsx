import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { motion } from 'framer-motion';

function ClientLobby() {
  const { roomState, joinRoom, sendEmoji } = useRoom();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [myId, setMyId] = useState(null);

  const handleJoin = (e) => {
    e.preventDefault();
    if (pin === roomState.pin && name.trim()) {
      joinRoom(name);
      setJoined(true);
      // Hack: In a real app we'd get our assigned ID from server. 
      // For mock, we'll find the last student added (approx).
      setTimeout(() => {
        setMyId(Date.now()); // Just a mock reference
      }, 100);
    } else {
      alert('รหัส PIN ไม่ถูกต้อง หรือ ยังไม่ได้กรอกชื่อ');
    }
  };

  if (!joined) {
    return (
      <div className="flex-center full-screen" style={{ flexDirection: 'column' }}>
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel" 
          style={{ padding: '3rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <h2 className="text-glow-blue" style={{ textAlign: 'center', marginBottom: '1rem' }}>เข้าร่วมห้องเรียน</h2>
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="รหัส PIN" 
              className="neu-input" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              maxLength={4}
              style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5em' }}
            />
            <input 
              type="text" 
              placeholder="ชื่อของคุณ" 
              className="neu-input" 
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button type="submit" className="neu-button" style={{ marginTop: '1rem' }}>
              🚀 เริ่มเรียน!
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h2 style={{ color: 'var(--text-secondary)' }}>รอคุณครูเริ่มบทเรียน...</h2>
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem' }}>
        <button className="neu-button" onClick={() => sendEmoji(myId, '👍')} style={{ fontSize: '3rem', padding: '1rem' }}>👍</button>
        <button className="neu-button" onClick={() => sendEmoji(myId, '💡')} style={{ fontSize: '3rem', padding: '1rem' }}>💡</button>
        <button className="neu-button" onClick={() => sendEmoji(myId, '🔥')} style={{ fontSize: '3rem', padding: '1rem' }}>🔥</button>
      </div>
      <p style={{ color: 'var(--neon-blue)', marginTop: '1rem' }}>ลองกดส่ง Emoji รัวๆ สิ!</p>
    </div>
  );
}

function ClientSenses() {
  const { activateSense, roomState } = useRoom();

  const senses = [
    { id: 'eyes', icon: '👁️', label: 'ตา (แสง/ภาพ)' },
    { id: 'ears', icon: '👂', label: 'หู (เสียง)' },
    { id: 'hands', icon: '✋', label: 'มือ (สัมผัส/อุณหภูมิ)' }
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '3rem' }}>
      <h2 className="text-glow-blue" style={{ fontSize: '2rem' }}>ส่งสัมผัสให้บอร์ด!</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '80%', maxWidth: '300px' }}>
        {senses.map(s => (
          <motion.button 
            key={s.id}
            whileTap={{ scale: 0.9, boxShadow: 'inset 4px 4px 8px #05080d, inset -4px -4px 8px #151c27' }}
            className={`neu-button ${roomState.senses[s.id] ? 'active' : ''}`} 
            style={{ 
              padding: '2rem', 
              fontSize: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              color: roomState.senses[s.id] ? 'var(--neon-green)' : 'inherit'
            }}
            onClick={() => activateSense(s.id)}
          >
            <span style={{ fontSize: '4rem' }}>{s.icon}</span>
            <span style={{ fontSize: '1.2rem' }}>{s.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function ClientView() {
  const { roomState } = useRoom();

  const renderPhase = () => {
    switch (roomState.phase) {
      case 1:
        return <ClientLobby />;
      case 2:
        return <ClientSenses />;
      default:
        return <div className="flex-center full-screen"><h1>Phase {roomState.phase} (Coming Soon)</h1></div>;
    }
  };

  return (
    <div className="full-screen">
      {renderPhase()}
    </div>
  );
}
