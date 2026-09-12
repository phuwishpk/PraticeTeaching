import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRoom } from '../context/RoomContext';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane, useSphere } from '@react-three/cannon';
import { Text, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Phase 1: Lobby ───────────────────────────────────────────────────────────
function Floor() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -3, 0] }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial opacity={0.3} />
    </mesh>
  );
}

function AvatarBall({ name, position }) {
  const [ref] = useSphere(() => ({ mass: 1, position, args: [0.5], restitution: 0.8, friction: 0.5 }));
  const hue = useMemo(() => Math.floor(Math.random() * 360), []);
  const color = `hsl(${hue}, 80%, 60%)`;
  return (
    <group ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0, 0.75, 0]} fontSize={0.28} color="#fff" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </group>
  );
}

function LobbyScene() {
  const { roomState, setPhase } = useRoom();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Canvas */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas shadows camera={{ position: [0, 4, 10], fov: 55 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[8, 10, 8]} angle={0.4} penumbra={1} castShadow intensity={2} color="#00f0ff" />
          <Physics gravity={[0, -12, 0]}>
            <Floor />
            {roomState.students.map((s, i) => (
              <AvatarBall key={s.id} name={s.name}
                position={[
                  (Math.random() - 0.5) * 5,
                  6 + i * 2.5,
                  (Math.random() - 0.5) * 3
                ]}
              />
            ))}
          </Physics>
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} enablePan={false} />
        </Canvas>
      </div>

      {/* Glass PIN card */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel animate-pulse-neon"
          style={{ padding: '3rem 4rem', textAlign: 'center', minWidth: 360, pointerEvents: 'auto' }}>
          <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>🔐 รหัสเข้าห้อง</p>
          <h1 className="text-glow-blue" style={{ fontSize: '6rem', letterSpacing: '0.25em', margin: '0 0 1rem' }}>
            {roomState.pin}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: 0 }}>
            👥 นักเรียนออนไลน์: <strong style={{ color: '#fff' }}>{roomState.students.length} คน</strong>
          </p>
          {roomState.students.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {roomState.students.map(s => (
                <span key={s.id} style={{ background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: '0.85rem', color: 'var(--neon-blue)' }}>
                  {s.name}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Next Phase button */}
        {roomState.students.length > 0 && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="neu-button animate-pulse-neon"
            onClick={() => setPhase(2)}
            style={{ marginTop: '2rem', padding: '1rem 3rem', fontSize: '1.2rem', color: 'var(--neon-blue)', pointerEvents: 'auto' }}>
            ▶ เริ่มบทเรียน!
          </motion.button>
        )}
      </div>

      {/* Floating Emojis */}
      <AnimatePresence>
        {roomState.floatingEmojis.map(e => (
          <motion.div key={e.id}
            initial={{ y: 0, opacity: 0, scale: 0.5, x: `${20 + Math.random() * 60}%` }}
            animate={{ y: -300, opacity: [0, 1, 1, 0], scale: [0.5, 1.8, 1.8, 0.5] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5 }}
            style={{ position: 'absolute', bottom: '10%', fontSize: '3rem', pointerEvents: 'none' }}>
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Phase 2: The Senses ──────────────────────────────────────────────────────
function SenseBox({ position, active, label }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial
          color={active ? '#00f0ff' : '#1a2540'}
          emissive={active ? '#00f0ff' : '#000'}
          emissiveIntensity={active ? 1.2 : 0}
          transparent opacity={0.85}
        />
      </mesh>
      <Text position={[0, -1.3, 0]} fontSize={0.38} color={active ? '#00f0ff' : '#94a3b8'} anchorX="center">
        {label}
      </Text>
    </group>
  );
}

function SensesScene() {
  const { roomState, setPhase } = useRoom();
  const all = roomState.senses.eyes && roomState.senses.ears && roomState.senses.hands;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas shadows camera={{ position: [0, 3, 9], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} castShadow intensity={2} color="#00f0ff" />
        {/* ESP32 board */}
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[2.2, 0.18, 4.5]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.9} roughness={0.15} />
        </mesh>
        <Text position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.32} color="#00f0ff">ESP32</Text>
        {/* Wires */}
        {roomState.senses.eyes && <mesh position={[-2.8, 0.6, -1.5]}><cylinderGeometry args={[0.04, 0.04, 4.5, 8]} /><meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={1} /></mesh>}
        {roomState.senses.ears && <mesh position={[0, 0.6, -2.5]}><cylinderGeometry args={[0.04, 0.04, 4, 8]} /><meshStandardMaterial color="#4444ff" emissive="#4444ff" emissiveIntensity={1} /></mesh>}
        {roomState.senses.hands && <mesh position={[2.8, 0.6, -1.5]}><cylinderGeometry args={[0.04, 0.04, 4.5, 8]} /><meshStandardMaterial color="#44ff44" emissive="#44ff44" emissiveIntensity={1} /></mesh>}

        <SenseBox position={[-3.5, 2, -2]} active={roomState.senses.eyes} label="👁️ ตา (Camera)" />
        <SenseBox position={[0, 2.5, -3.2]} active={roomState.senses.ears} label="👂 หู (Mic)" />
        <SenseBox position={[3.5, 2, -2]} active={roomState.senses.hands} label="✋ มือ (Touch)" />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.05} />
      </Canvas>

      <div style={{ position: 'absolute', top: '5%', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
        <h1 className="text-glow-blue" style={{ fontSize: '2.5rem', margin: 0 }}>บอร์ดรับรู้โลกภายนอกได้อย่างไร?</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>ให้นักเรียนกดปุ่มอวัยวะบนมือถือ เพื่อจำลองการเชื่อมต่อ</p>
      </div>

      {all && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="neu-button animate-pulse-neon"
          onClick={() => setPhase(3)}
          style={{ position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', padding: '1rem 3rem', fontSize: '1.2rem', color: 'var(--neon-blue)' }}>
          ▶ ถัดไป: Word Cloud
        </motion.button>
      )}
    </div>
  );
}

// ─── Phase 3: Word Cloud ──────────────────────────────────────────────────────
function WordCloudScene() {
  const { roomState, setPhase } = useRoom();

  const wordCounts = useMemo(() => {
    const counts = {};
    roomState.wordSubmissions.forEach(({ word }) => {
      counts[word] = (counts[word] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [roomState.wordSubmissions]);

  const maxCount = wordCounts[0]?.[1] || 1;

  return (
    <div className="flex-center full-screen" style={{ flexDirection: 'column', position: 'relative' }}>
      <h2 className="text-glow-blue" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        🌐 เซนเซอร์คุยกับบอร์ดด้วยภาษาอะไร?
      </h2>
      {/* Word Cloud */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem', maxWidth: 900 }}>
        <AnimatePresence>
          {wordCounts.map(([word, count]) => {
            const ratio = count / maxCount;
            const size = 1 + ratio * 3;
            const gold = ratio > 0.5;
            return (
              <motion.div key={word} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} layout
                style={{
                  fontSize: `${size}rem`,
                  color: gold ? '#ffd700' : 'var(--neon-blue)',
                  textShadow: gold ? '0 0 20px rgba(255,215,0,0.7)' : '0 0 10px rgba(0,240,255,0.5)',
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 800,
                  transition: 'all 0.5s',
                  background: gold ? 'rgba(255,215,0,0.08)' : 'rgba(0,240,255,0.05)',
                  padding: '0.2em 0.4em',
                  borderRadius: 8,
                  border: `1px solid ${gold ? 'rgba(255,215,0,0.3)' : 'rgba(0,240,255,0.2)'}`,
                }}>
                {word} {count > 1 && <sup style={{ fontSize: '0.5em' }}>{count}</sup>}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {wordCounts.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.5rem' }}>รอนักเรียนส่งคำตอบ...</p>
        )}
      </div>

      {wordCounts.length >= 3 && (
        <button className="neu-button" onClick={() => setPhase(4)}
          style={{ margin: '2rem', padding: '1rem 3rem', fontSize: '1.2rem', color: 'var(--neon-blue)' }}>
          ▶ ถัดไป: Digital Signal
        </button>
      )}
    </div>
  );
}

// ─── Host View Shell ──────────────────────────────────────────────────────────
const PHASES = ['Lobby', 'The Senses', 'Word Cloud', 'Digital Signal', 'Analog', 'Sensors', 'Wiring', 'Scenario', 'Wrap-up', 'Podium'];

export default function HostView() {
  const { roomState, setPhase, resetRoom } = useRoom();

  const renderScene = () => {
    switch (roomState.phase) {
      case 1: return <LobbyScene />;
      case 2: return <SensesScene />;
      case 3: return <WordCloudScene />;
      default:
        return (
          <div className="flex-center full-screen" style={{ flexDirection: 'column', gap: '1rem' }}>
            <h1 style={{ fontSize: '3rem' }}>🚧 กำลังพัฒนา...</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Phase {roomState.phase} จะพร้อมเร็วๆ นี้</p>
          </div>
        );
    }
  };

  return (
    <div className="full-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <div className="glass-panel" style={{ margin: '12px 16px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 100, flexShrink: 0 }}>
        <h2 className="text-glow-blue" style={{ marginRight: 'auto', fontSize: '1.3rem' }}>🖥️ Host Dashboard</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PHASES.slice(0, 6).map((name, i) => (
            <button key={i} onClick={() => setPhase(i + 1)}
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

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div key={roomState.phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ width: '100%', height: '100%' }}>
            {renderScene()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
