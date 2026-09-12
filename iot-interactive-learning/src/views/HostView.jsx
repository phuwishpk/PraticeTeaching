import React, { useState } from 'react';
import { useRoom } from '../context/RoomContext';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane, useSphere } from '@react-three/cannon';
import { Text, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

// Physics Plane
function Floor(props) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], ...props }));
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial color="#0a0f1a" opacity={0.5} />
    </mesh>
  );
}

// Bouncing Avatar Ball
function BouncingAvatar({ name, position }) {
  const [ref] = useSphere(() => ({ mass: 1, position, args: [0.5], restitution: 0.9 }));
  const randomColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
  
  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={randomColor} emissive={randomColor} emissiveIntensity={0.5} />
      <Text position={[0, 0.8, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {name}
      </Text>
    </mesh>
  );
}

function LobbyScene() {
  const { roomState } = useRoom();
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Background */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} castShadow intensity={2} color="#00f0ff" />
          <Physics>
            <Floor position={[0, -2, 0]} />
            {roomState.students.map((student, i) => (
              <BouncingAvatar key={student.id} name={student.name} position={[(Math.random() - 0.5) * 4, 10 + (i * 2), (Math.random() - 0.5) * 4]} />
            ))}
          </Physics>
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel animate-pulse-neon" 
          style={{ padding: '4rem', textAlign: 'center', pointerEvents: 'auto', minWidth: '400px' }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>เข้าสู่ห้องเรียนผ่าน PIN</h2>
          <h1 className="text-glow-blue" style={{ fontSize: '6rem', letterSpacing: '0.2em', margin: '0 0 2rem 0' }}>
            {roomState.pin}
          </h1>
          <p style={{ fontSize: '1.2rem' }}>รอผู้เรียนเข้าร่วม... ({roomState.students.length} คน)</p>
          
          {/* Emojis floating up */}
          <AnimatePresence>
            {roomState.students.map(s => s.emoji && (
              <motion.div
                key={`${s.id}-${s.emoji}`}
                initial={{ y: 50, opacity: 0, scale: 0.5 }}
                animate={{ y: -200, opacity: [0, 1, 0], scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                style={{ position: 'absolute', left: `${20 + Math.random() * 60}%`, bottom: '20%', fontSize: '3rem' }}
              >
                {s.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

// Scene 2: The Senses
function ESP32Board() {
  return (
    <mesh castShadow receiveShadow position={[0, 0, 0]}>
      <boxGeometry args={[2, 0.2, 4]} />
      <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      <Text position={[0, 0.15, 0]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.3} color="#fff">
        ESP32
      </Text>
    </mesh>
  );
}

function SenseBox({ position, active, label, icon }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial 
          color={active ? "#00f0ff" : "#131b2f"} 
          emissive={active ? "#00f0ff" : "#000"} 
          emissiveIntensity={active ? 0.8 : 0} 
          transparent opacity={0.8} 
        />
      </mesh>
      {active && (
        <Text position={[0, 0, 0.8]} fontSize={0.8} color="#fff">
          {icon}
        </Text>
      )}
      <Text position={[0, -1.2, 0]} fontSize={0.4} color={active ? "#00f0ff" : "#94a3b8"}>
        {label}
      </Text>
    </group>
  );
}

function SensesScene() {
  const { roomState } = useRoom();
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas shadows camera={{ position: [0, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} castShadow intensity={2} color="#00f0ff" />
        
        <ESP32Board />
        
        <SenseBox position={[-3, 1, -2]} active={roomState.senses.eyes} label="ตา" icon="👁️" />
        <SenseBox position={[0, 1, -3]} active={roomState.senses.ears} label="หู" icon="👂" />
        <SenseBox position={[3, 1, -2]} active={roomState.senses.hands} label="มือ" icon="✋" />
        
        {/* Draw lines from ESP to boxes if active */}
        <OrbitControls enableZoom={false} maxPolarAngle={Math.PI/2 - 0.1} />
      </Canvas>
      <div style={{ position: 'absolute', top: '10%', width: '100%', textAlign: 'center', pointerEvents: 'none' }}>
        <h1 className="text-glow-blue" style={{ fontSize: '3rem' }}>บอร์ดรับรู้โลกภายนอกได้อย่างไร?</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>ให้นักเรียนกดปุ่มเพื่อจำลองการเชื่อมต่อเซนเซอร์</p>
      </div>
    </div>
  );
}

export default function HostView() {
  const { roomState, setPhase } = useRoom();

  const renderPhase = () => {
    switch (roomState.phase) {
      case 1:
        return <LobbyScene />;
      case 2:
        return <SensesScene />;
      default:
        return <div className="flex-center full-screen"><h1>Phase {roomState.phase} (Coming Soon)</h1></div>;
    }
  };

  return (
    <div className="full-screen" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <div className="glass-panel" style={{ margin: '20px', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <h2 className="text-glow-blue">Host Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[1, 2, 3, 4].map(p => (
            <button key={p} className={`neu-button ${roomState.phase === p ? 'active' : ''}`} onClick={() => setPhase(p)} style={{ padding: '8px 16px', fontSize: '1rem' }}>
              Phase {p}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {renderPhase()}
      </div>
    </div>
  );
}
