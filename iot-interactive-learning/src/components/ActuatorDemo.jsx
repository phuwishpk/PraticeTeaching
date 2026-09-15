import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ActuatorDemo.css';

// One signal travelling between two layers. The pulse always animates along x; the
// stylesheet rotates the track on narrow screens so the same motion reads downward.
function Wire({ active, color }) {
  return (
    <div className="actuator-wire">
      <div className="actuator-wire-track">
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.5, ease: 'linear' }}
              style={{ width: '100%', height: '100%', backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Layer({ title, accent, tint, width, children }) {
  return (
    <div className="actuator-layer" style={{ '--layer-accent': accent, '--layer-tint': tint, '--layer-width': width }}>
      <span className="actuator-layer-title">{title}</span>
      {children}
    </div>
  );
}

export default function ActuatorDemo() {
  const [isOn, setIsOn] = useState(false);

  // States to manage the animation sequence
  const [signalAppToNetwork, setSignalAppToNetwork] = useState(false);
  const [signalNetworkToDevice, setSignalNetworkToDevice] = useState(false);
  const [deviceIsOn, setDeviceIsOn] = useState(false);

  const togglePower = () => {
    const newState = !isOn;
    setIsOn(newState);

    // Start animation sequence
    setSignalAppToNetwork(true);

    setTimeout(() => {
      setSignalAppToNetwork(false);
      setSignalNetworkToDevice(true);
    }, 500);

    setTimeout(() => {
      setSignalNetworkToDevice(false);
      setDeviceIsOn(newState);
    }, 1000);
  };

  return (
    <div className="actuator-demo">
      <p className="actuator-caption">
        จำลองการสั่งงานผ่าน 3 Layers: กดปุ่มที่แอป → ส่งผ่านเครือข่าย → บอร์ดสั่งพัดลมทำงาน
      </p>

      <div className="actuator-flow">

        <Layer title="Service Layer" accent="var(--neon-purple)" tint="rgba(128, 0, 128, 0.1)" width="200px">
          <div style={{
            width: '80px',
            height: '140px',
            backgroundColor: '#1a202c',
            borderRadius: '12px',
            border: '2px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <span style={{ fontSize: '24px' }}>📱</span>
            <button
              onClick={togglePower}
              style={{
                padding: '8px 12px',
                backgroundColor: isOn ? 'var(--neon-red)' : 'var(--neon-green)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                boxShadow: `0 0 10px ${isOn ? 'var(--neon-red)' : 'var(--neon-green)'}`
              }}
            >
              {isOn ? 'ปิดพัดลม' : 'เปิดพัดลม'}
            </button>
          </div>
        </Layer>

        <Wire active={signalAppToNetwork} color="var(--neon-purple)" />

        <Layer title="Network Layer" accent="var(--neon-green)" tint="rgba(0, 255, 0, 0.05)" width="160px">
          <div style={{ fontSize: '48px', filter: (signalAppToNetwork || signalNetworkToDevice) ? 'drop-shadow(0 0 15px var(--neon-green))' : 'none', transition: 'filter 0.3s' }}>
            ☁️
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Internet / Wi-Fi</span>
        </Layer>

        <Wire active={signalNetworkToDevice} color="var(--neon-blue)" />

        <Layer title="Device Layer" accent="var(--neon-blue)" tint="rgba(0, 191, 255, 0.1)" width="280px">
          <div className="actuator-device-row">
            {/* Board */}
            <div style={{
              width: '60px',
              height: '80px',
              backgroundColor: '#2d3748',
              borderRadius: '8px',
              border: '2px solid #4a5568',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '12px',
              flexShrink: 0,
              boxShadow: (signalNetworkToDevice || deviceIsOn) ? '0 0 10px var(--neon-blue)' : 'none',
              transition: 'box-shadow 0.3s'
            }}>
              <span>ESP32</span>
              <span style={{ fontSize: '10px', color: deviceIsOn ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
                {deviceIsOn ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Wire Board -> Actuator: stays horizontal, the board and fan sit side by side */}
            <div className="actuator-inner-wire">
              <motion.div
                animate={{ x: deviceIsOn ? ['-100%', '100%'] : '0%' }}
                transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: deviceIsOn ? 'var(--neon-yellow)' : 'transparent',
                  opacity: 0.8
                }}
              />
            </div>

            {/* Actuator */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '4px solid #4a5568',
                backgroundColor: '#1a202c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: deviceIsOn ? '0 0 15px var(--neon-yellow)' : 'none',
                transition: 'box-shadow 0.3s ease'
              }}>
                <motion.div
                  animate={{ rotate: deviceIsOn ? 360 : 0 }}
                  transition={deviceIsOn ? { repeat: Infinity, duration: 0.2, ease: 'linear' } : { duration: 0.5, ease: 'easeOut' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ position: 'absolute', width: '8px', height: '60px', backgroundColor: '#a0aec0', borderRadius: '4px' }} />
                  <div style={{ position: 'absolute', width: '60px', height: '8px', backgroundColor: '#a0aec0', borderRadius: '4px' }} />
                  <div style={{ position: 'absolute', width: '16px', height: '16px', backgroundColor: '#cbd5e0', borderRadius: '50%' }} />
                </motion.div>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold' }}>Actuator (พัดลม)</span>
            </div>
          </div>
        </Layer>

      </div>
    </div>
  );
}
