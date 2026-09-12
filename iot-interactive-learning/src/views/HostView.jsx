import React, { useEffect, useState, useMemo } from 'react';
import { useRoom } from '../context/RoomContext';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import LessonContent from '../components/LessonContent';
import { sensorQuizExplanation } from '../content/lessons';

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
  const { roomState, setPhase } = useRoom();
  const joinUrl = `${window.location.origin}/client`;
  
  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel"
        style={{ padding: '3rem', width: '80%', maxWidth: 1000, display: 'flex', gap: '3rem' }}>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: '0 0 1rem 0', textAlign: 'center' }}>Welcome to IoT Lab 🚀</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginBottom: '2rem' }}>สแกน QR Code หรือเข้าเว็บเพื่อเข้าห้องเรียน</p>
          
          <div style={{ background: '#fff', padding: '1rem', borderRadius: 16, marginBottom: '2rem' }}>
            <QRCodeSVG value={joinUrl} size={200} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,240,255,0.1)', padding: '1rem 2rem', borderRadius: 20, border: '1px solid rgba(0,240,255,0.3)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>PIN:</span>
            <span style={{ color: 'var(--neon-blue)', fontSize: '3rem', fontWeight: 800, letterSpacing: '0.2em' }}>{roomState.pin}</span>
          </div>
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '3rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: 'var(--neon-purple)' }}>นักวิจัยที่เข้าร่วมแล้ว: {roomState.students.length} คน</h2>
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
  const votes = roomState.architectureVotes[currentItem] || {};
  const totalVotes = Object.keys(votes).length;
  
  const getPercent = (layer) => totalVotes === 0 ? 0 : Math.round((Object.values(votes).filter(v => v === layer).length / totalVotes) * 100);

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
      <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>โหวต: อุปกรณ์นี้อยู่ชั้นไหน?</h1>
      
      <div style={{ display: 'flex', gap: '2rem', width: '90%', maxWidth: 1200 }}>
        
        {/* Left: Voting Control */}
        <div className="glass-panel flex-center" style={{ flex: 1, padding: '2rem', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ color: 'var(--text-secondary)', margin: 0 }}>ส่งคำถามให้นักเรียน:</h2>
          <motion.div key={currentItem} initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ fontSize: '8rem', filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.5))' }}>
            {activeItemData.icon}
          </motion.div>
          <h2 style={{ margin: 0, color: 'var(--neon-blue)', fontSize: '2rem' }}>{activeItemData.name}</h2>
          
          <div style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            โหวตแล้ว: {totalVotes} / {roomState.students.length} คน
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
              <span style={{ fontSize: '2rem', color: 'var(--neon-purple)', fontWeight: 'bold' }}>{getPercent('service')}%</span>
            </div>
            <div style={{ width: '100%', height: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}>
              <motion.div animate={{ width: `${getPercent('service')}%` }} style={{ height: '100%', background: 'var(--neon-purple)' }} />
            </div>
          </div>

          {/* Layer 2: Network */}
          <div style={{ border: `2px solid rgba(4,217,255,0.3)`, borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(4,217,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: 'var(--neon-green)', margin: '0 0 0.5rem 0' }}>Layer 2: Network (ชั้นเครือข่าย)</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>ถนน/Wi-Fi/4G</p>
              </div>
              <span style={{ fontSize: '2rem', color: 'var(--neon-green)', fontWeight: 'bold' }}>{getPercent('network')}%</span>
            </div>
            <div style={{ width: '100%', height: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}>
              <motion.div animate={{ width: `${getPercent('network')}%` }} style={{ height: '100%', background: 'var(--neon-green)' }} />
            </div>
          </div>

          {/* Layer 1: Device */}
          <div style={{ border: `2px solid rgba(0,240,255,0.3)`, borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,240,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: 'var(--neon-blue)', margin: '0 0 0.5rem 0' }}>Layer 1: Device (ชั้นอุปกรณ์)</h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>หน้างาน/เซนเซอร์/ESP32</p>
              </div>
              <span style={{ fontSize: '2rem', color: 'var(--neon-blue)', fontWeight: 'bold' }}>{getPercent('device')}%</span>
            </div>
            <div style={{ width: '100%', height: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, overflow: 'hidden' }}>
              <motion.div animate={{ width: `${getPercent('device')}%` }} style={{ height: '100%', background: 'var(--neon-blue)' }} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// ─── Scene 3: The Problem ─────────────────────────────────────────────────────
function HostProblem() {
  const { roomState } = useRoom();

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-glow-blue" style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', textAlign: 'center' }}>
        Device Layer: สมองพร้อม แต่ประสาทสัมผัสล่ะ?
      </h1>
      
      <div style={{ display: 'flex', gap: '2rem', width: '95%', maxWidth: 1200, height: '70vh' }}>
        
        {/* Left: Problem Statement */}
        <div className="glass-panel" style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <motion.div animate={{ background: ['rgba(255,0,0,0.1)', 'rgba(255,0,0,0.2)', 'rgba(255,0,0,0.1)'] }} transition={{ repeat: Infinity, duration: 1 }}
            style={{ padding: '2rem', border: '2px solid #ff4d4d', borderRadius: 16, boxShadow: '0 0 20px rgba(255,0,0,0.2)' }}>
            <h3 style={{ color: '#ff6b6b', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>⚠️ สมองที่มองไม่เห็น</h3>
            <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, lineHeight: 1.6, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              ESP32 ประมวลผลได้ แต่มัน <b>ตาบอด หูหนวก</b> ไม่รู้ว่าห้องร้อนหรือหนาว มืดหรือสว่าง
            </p>
          </motion.div>

          <div className="flex-center" style={{ flex: 1 }}>
            <img src="/images/esp32_board_1789207904514.jpg" alt="ESP32" style={{ width: '80%', maxHeight: 200, objectFit: 'cover', borderRadius: 16, border: '2px solid rgba(255,255,255,0.2)' }} />
          </div>

          <div style={{ background: 'rgba(0,240,255,0.1)', border: '2px solid var(--neon-blue)', borderRadius: 16, padding: '2rem', boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}>
            <h3 style={{ color: 'var(--neon-blue)', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>💡 เซนเซอร์ (Sensor)</h3>
            <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, lineHeight: 1.6, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              อวัยวะรับสัมผัส (ตา หู จมูก ผิวหนัง) ที่แปลงสภาพแวดล้อมเป็น <b>สัญญาณไฟฟ้า</b> ให้สมอง
            </p>
          </div>
        </div>

        {/* Right: Gallery -> Word Cloud */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: 'var(--neon-purple)', margin: '0 0 1rem 0' }}>ไอเดียจากนักวิจัย 💡</h2>
          
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignContent: 'center', justifyContent: 'center' }}>
            <AnimatePresence>
              {(!roomState.wordSubmissions || roomState.wordSubmissions.length === 0) && (
                <p style={{ color: 'var(--text-secondary)', width: '100%', textAlign: 'center' }}>
                  รอไอเดียจากนักเรียน...
                </p>
              )}
              {roomState.wordSubmissions?.map((item) => (
                <motion.div key={item.id}
                  initial={{ scale: 0, y: 50, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(188,19,254,0.2))',
                    border: '1px solid rgba(0,240,255,0.4)',
                    padding: '1rem 1.5rem',
                    borderRadius: 30,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                  }}>
                  <span style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold', marginRight: '10px' }}>{item.word}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>- {item.name}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Scene 4: Digital Signal ────────────────────────────────────────────────
function HostDigital() {
  const { roomState } = useRoom();
  const presses = roomState.digitalPresses || [];
  const val = roomState.digitalValue || 0;
  
  const [history, setHistory] = useState(Array(30).fill(0));

  useEffect(() => {
    const timer = setInterval(() => {
      setHistory(prev => [...prev.slice(1), val]);
    }, 200);
    return () => clearInterval(timer);
  }, [val]);

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>สัญญาณภาษาเครื่อง (Digital)</h1>
      
      <div style={{ display: 'flex', gap: '2rem', width: '95%', maxWidth: 1200, height: '70vh' }}>
        
        {/* Left: Theory */}
        <div className="glass-panel" style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ padding: '2rem', border: '2px solid var(--neon-blue)', borderRadius: 16, background: 'rgba(0,240,255,0.05)' }}>
            <h3 style={{ color: 'var(--neon-blue)', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>1. สัญญาณ Digital</h3>
            <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, lineHeight: 1.6 }}>
              ภาษาไฟฟ้าที่มีแค่ 2 สถานะ:
              <br/><br/>
              <b>0 (LOW)</b> = ปิด (ไม่มีไฟ)<br/>
              <b>1 (HIGH)</b> = เปิด (มีไฟ)
            </p>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', filter: val ? 'drop-shadow(0 0 30px #ff4d4d)' : 'grayscale(100%)' }}>
            🚨
          </div>
        </div>

        {/* Right: Activity */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ color: 'var(--neon-green)', margin: '0 0 1rem 0' }}>ทดสอบรับสัญญาณจากนักเรียน</h2>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '4px', borderBottom: '2px solid var(--text-secondary)', paddingBottom: '1rem' }}>
            {history.map((v, i) => (
              <motion.div key={i}
                initial={false}
                animate={{ height: v ? '80%' : '10%', background: v ? '#ff4d4d' : 'rgba(255,255,255,0.2)' }}
                style={{ flex: 1, borderRadius: '4px 4px 0 0' }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '3rem', margin: 0, color: val ? '#ff4d4d' : 'var(--text-secondary)' }}>
              {val ? '1 (HIGH)' : '0 (LOW)'}
            </h2>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>นักเรียนที่กดส่งสัญญาณ ({presses.length}):</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                {presses.map((p, i) => <span key={i} style={{ background: 'rgba(255,77,77,0.2)', padding: '4px 10px', borderRadius: 12, color: '#ffb3b3' }}>{p}</span>)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Scene 5: Analog Signal ────────────────────────────────────────────────
function HostAnalog() {
  const { roomState } = useRoom();
  const vals = roomState.analogValues || {};
  const studentNames = Object.keys(vals);
  
  const total = studentNames.reduce((sum, name) => sum + vals[name], 0);
  const avg = studentNames.length > 0 ? Math.round(total / studentNames.length) : 0;
  
  const hue = 200 - (avg / 4095) * 200; // 200 (Blue) to 0 (Red)

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>สัญญาณค่าต่อเนื่อง (Analog)</h1>
      
      <div style={{ display: 'flex', gap: '2rem', width: '95%', maxWidth: 1200, height: '70vh' }}>
        
        {/* Left: Theory */}
        <div className="glass-panel" style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ padding: '2rem', border: '2px solid var(--neon-purple)', borderRadius: 16, background: 'rgba(188,19,254,0.05)' }}>
            <h3 style={{ color: 'var(--neon-purple)', margin: '0 0 1rem 0', fontSize: '1.8rem' }}>2. สัญญาณ Analog</h3>
            <p style={{ color: 'white', fontSize: '1.2rem', margin: 0, lineHeight: 1.6 }}>
              ค่าที่มีความต่อเนื่อง เช่น ความสว่าง หรือ อุณหภูมิ
              <br/><br/>
              ESP32 อ่านค่าเป็นตัวเลขได้ <b>0 - 4095</b>
            </p>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
            🌡️
          </div>
        </div>

        {/* Right: Activity */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ color: 'var(--neon-green)', margin: '0 0 1rem 0' }}>ค่าเฉลี่ยของห้อง (Average)</h2>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
                <motion.div animate={{ width: `${(avg / 4095) * 100}%`, background: `hsl(${hue}, 100%, 50%)` }} style={{ height: '100%' }} />
              </div>
              <span style={{ fontSize: '3rem', fontWeight: 'bold', color: `hsl(${hue}, 100%, 50%)`, width: 120, textAlign: 'right' }}>
                {avg}
              </span>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: 250, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {studentNames.map(name => (
                <div key={name} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                  <span style={{ color: `hsl(${200 - (vals[name]/4095)*200}, 100%, 50%)`, fontWeight: 'bold' }}>{vals[name]}</span>
                </div>
              ))}
              {studentNames.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>รอรับค่าจากนักเรียน...</p>}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


// ─── Scene 6: Sensor Catalog ────────────────────────────────────────────────
function HostCatalog() {
  const sensors = [
    { name: 'LDR', type: 'แสง (Analog)', desc: 'สว่างมาก = ความต้านทานลด', img: '/images/sensor_ldr_1789207658387.jpg' },
    { name: 'DHT11', type: 'อุณหภูมิ/ความชื้น (Digital)', desc: 'วัดความร้อนและไอน้ำในอากาศ', img: '/images/sensor_dht11_1789207674098.jpg' },
    { name: 'PIR', type: 'การเคลื่อนไหว (Digital)', desc: 'จับรังสีความร้อนจากสิ่งมีชีวิต', img: '/images/sensor_pir_1789207687278.jpg' },
    { name: 'Soil Moisture', type: 'ความชื้นดิน (Analog)', desc: 'ดินเปียก = นำไฟฟ้าได้ดี', img: '/images/sensor_soil_1789207703345.jpg' }
  ];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>แคตตาล็อกเซนเซอร์</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '90%', maxWidth: 1000 }}>
        {sensors.map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <img src={s.img} alt={s.name} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 16, border: '2px solid rgba(0,240,255,0.3)' }} />
            <div>
              <h3 style={{ color: 'var(--neon-green)', margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{s.name}</h3>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 8, fontSize: '0.8rem', color: 'var(--neon-blue)' }}>{s.type}</span>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Scene 7: Sensor Quiz ──────────────────────────────────────────────────
function HostQuiz() {
  const { roomState, revealQuiz } = useRoom();
  const votes = roomState.quizVotes || {};
  
  const options = [
    { id: 'ldr', label: 'LDR (แสง)', color: '#ffb86c' },
    { id: 'dht', label: 'DHT11 (อุณหภูมิ)', color: '#ff79c6' },
    { id: 'pir', label: 'PIR (เคลื่อนไหว)', color: '#8be9fd' },
    { id: 'soil', label: 'Soil Moisture (ดิน)', color: '#50fa7b' }
  ];

  const total = Object.keys(votes).length || 1; // prevent div/0
  const isRevealed = roomState.quizRevealed;

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-glow-blue" style={{ fontSize: '2.5rem', margin: 0, textAlign: 'center' }}>
        "อยากทำระบบเปิดไฟหน้าบ้านอัตโนมัติตอนกลางคืน ต้องใช้เซนเซอร์อะไร?"
      </h1>
      
      <div className="glass-panel" style={{ width: '80%', maxWidth: 800, padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {options.map(opt => {
          const count = Object.values(votes).filter(v => v === opt.id).length;
          const pct = Math.round((count / total) * 100) || 0;
          const isCorrect = opt.id === 'ldr';

          return (
            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ width: 200, textAlign: 'right', fontWeight: 'bold', color: (isRevealed && isCorrect) ? 'var(--neon-green)' : 'white' }}>
                {opt.label} {(isRevealed && isCorrect) && '✅'}
              </span>
              <div style={{ flex: 1, height: 30, background: 'rgba(255,255,255,0.1)', borderRadius: 15, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  style={{ height: '100%', background: opt.color }}
                />
              </div>
              <span style={{ width: 50 }}>{count} โหวต</span>
            </div>
          );
        })}

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          {isRevealed && <p className="quiz-explanation" aria-live="polite">{sensorQuizExplanation}</p>}
          <button className="neu-button" onClick={() => revealQuiz(!isRevealed)} style={{ color: isRevealed ? '#ff4d4d' : 'var(--neon-green)', padding: '1rem 2rem', fontSize: '1.2rem' }}>
            {isRevealed ? 'ซ่อนเฉลย' : 'เฉลยคำตอบ!'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Scene 8: Logic Building ────────────────────────────────────────────────
function HostLogic() {
  const { roomState } = useRoom();
  const votes = roomState.logicVotes || {};
  
  const options = [
    { id: 'dark', label: 'ถ้า "แสงมืด" (LDR < 500)' },
    { id: 'dry', label: 'ถ้า "ดินแห้ง" (Soil > 3000)' },
    { id: 'motion', label: 'ถ้า "มีคนเดินผ่าน" (PIR == 1)' },
    { id: 'hot', label: 'ถ้า "อากาศร้อน" (Temp > 30)' }
  ];

  const total = Object.keys(votes).length || 1;

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-glow-blue" style={{ fontSize: '3rem', margin: 0 }}>ประกอบร่าง Logic (ตรรกะ)</h1>
      
      <div style={{ display: 'flex', gap: '2rem', width: '90%', maxWidth: 1000 }}>
        
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
          <h2 style={{ color: 'var(--neon-green)', margin: '0 0 1rem 0' }}>ผลโหวตเติมคำในช่องว่าง</h2>
          {options.map(opt => {
            const count = Object.values(votes).filter(v => v === opt.id).length;
            const pct = Math.round((count / total) * 100) || 0;
            return (
              <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{opt.label}</span>
                  <span>{count} โหวต</span>
                </div>
                <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                  <motion.div animate={{ width: `${pct}%` }} style={{ height: '100%', background: 'var(--neon-blue)' }} />
                </div>
              </div>
            );
          })}
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

      <div className="glass-panel" style={{ padding: '4rem', width: '80%', maxWidth: 800, textAlign: 'center', zIndex: 1 }}>
        <h1 className="text-glow-blue" style={{ fontSize: '4rem', margin: '0 0 2rem 0' }}>บทสรุป IoT 🌐</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left', fontSize: '1.5rem', color: 'white', lineHeight: 1.6 }}>
          <p>✅ <b>3-Layer:</b> Device (รับรู้/ทำ), Network (ส่ง), Service (แสดงผล)</p>
          <p>✅ <b>Sensor:</b> อวัยวะรับสัมผัส (ตา หู จมูก ผิวหนัง) ของบอร์ด</p>
          <p>✅ <b>Signal:</b> Digital (0/1) และ Analog (ค่าต่อเนื่อง 0-4095)</p>
          <p>✅ <b>Logic:</b> เงื่อนไข IF ช่วยให้บอร์ดคิดและสั่งงานอัตโนมัติ!</p>
        </div>
      </div>
    </div>
  );
}

// ─── Scene 10: Podium ──────────────────────────────────────────────────────
function HostPodium() {
  const { roomState } = useRoom();
  const students = roomState.students || [];

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-glow-blue" style={{ fontSize: '4rem', margin: 0 }}>🏆 ยินดีด้วยเหล่า Maker! 🏆</h1>
      
      <div className="glass-panel" style={{ width: '80%', maxWidth: 800, padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--neon-green)', margin: '0 0 2rem 0', fontSize: '2rem' }}>นักเรียนที่ผ่านหลักสูตร IoT พื้นฐาน:</h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          {students.map((s) => (
            <motion.div key={s.id} 
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
              style={{ background: 'linear-gradient(45deg, var(--neon-purple), var(--neon-blue))', padding: '1rem 2rem', borderRadius: 30, fontSize: '1.5rem', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,240,255,0.3)' }}
            >
              🎓 {s.name}
            </motion.div>
          ))}
          {students.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>ยังไม่มีนักเรียนในห้อง</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Host View Shell ──────────────────────────────────────────────────────────
const PHASES = ['Lobby', 'Architecture', 'The Problem', 'Digital Signal', 'Analog', 'Sensors', 'Sensor Quiz', 'Logic', 'Wrap-up', 'Podium'];

export default function HostView() {
  const { roomState, setPhase, resetRoom } = useRoom();
  const [lessonMode, setLessonMode] = useState(roomState.phase !== 1);

  return (
    <div className="host-learning-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <FloatingEmojis emojis={roomState.floatingEmojis} />

      {/* Navbar */}
      <div className="glass-panel host-navbar" style={{ margin: '12px 16px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 100, flexShrink: 0 }}>
        <h2 className="text-glow-blue" style={{ marginRight: 'auto', fontSize: '1.3rem' }}>🖥️ Host Dashboard</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PHASES.slice(0, 10).map((name, i) => (
            <button key={i} onClick={() => { setPhase(i + 1); setLessonMode(i !== 0); }}
              className="neu-button"
              style={{ padding: '6px 14px', fontSize: '0.8rem', color: roomState.phase === i + 1 ? 'var(--neon-blue)' : 'inherit', boxShadow: roomState.phase === i + 1 ? 'var(--neumorph-inset)' : 'var(--neumorph-shadow)' }}>
              {i + 1}. {name}
            </button>
          ))}
        </div>
        <button onClick={resetRoom} style={{ background: 'transparent', border: '1px solid rgba(255,0,100,0.4)', color: '#ff6b6b', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>
          🔄 Reset
        </button>
      </div>

      <div className="lesson-mode-bar" role="group" aria-label="รูปแบบการสอน">
        <button className="lesson-mode-button" aria-pressed={lessonMode} onClick={() => setLessonMode(true)}>📖 เนื้อหาบทเรียน</button>
        <button className="lesson-mode-button" aria-pressed={!lessonMode} onClick={() => setLessonMode(false)}>🎮 กิจกรรมในห้องเรียน</button>
      </div>
      {/* Main Content */}
      <main className="host-learning-main">
        {lessonMode ? <LessonContent key={roomState.phase} phase={roomState.phase} quizRevealed={roomState.quizRevealed} /> : (
        <AnimatePresence mode="wait">
          <motion.div key={roomState.phase} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="host-activity" style={{ width: '100%' }}>
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
        </AnimatePresence>
        )}
      </main>
    </div>
  );
}
