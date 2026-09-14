import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
      marginTop: '20px',
      padding: '30px 20px',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: '16px',
      border: '1px solid var(--border-light)',
      overflowX: 'auto',
    }}>
      <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
        จำลองการสั่งงานผ่าน 3 Layers: กดปุ่มที่แอป → ส่งผ่านเครือข่าย → บอร์ดสั่งพัดลมทำงาน
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0', width: '100%', justifyContent: 'center', minWidth: '600px' }}>
        
        {/* Service Layer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          padding: '20px',
          borderRadius: '12px',
          border: '2px dashed var(--neon-purple)',
          backgroundColor: 'rgba(128, 0, 128, 0.1)',
          width: '200px'
        }}>
          <span style={{ color: 'var(--neon-purple)', fontWeight: 'bold', fontSize: '14px' }}>Service Layer</span>
          
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
        </div>

        {/* Wire App -> Network */}
        <div style={{
          position: 'relative',
          width: '60px',
          height: '4px',
          backgroundColor: '#4a5568',
          overflow: 'hidden'
        }}>
          <AnimatePresence>
            {signalAppToNetwork && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.5, ease: 'linear' }}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'var(--neon-purple)',
                  boxShadow: '0 0 8px var(--neon-purple)'
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Network Layer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          padding: '20px',
          borderRadius: '12px',
          border: '2px dashed var(--neon-green)',
          backgroundColor: 'rgba(0, 255, 0, 0.05)',
          width: '160px'
        }}>
          <span style={{ color: 'var(--neon-green)', fontWeight: 'bold', fontSize: '14px' }}>Network Layer</span>
          <div style={{ fontSize: '48px', filter: (signalAppToNetwork || signalNetworkToDevice) ? 'drop-shadow(0 0 15px var(--neon-green))' : 'none', transition: 'filter 0.3s' }}>
            ☁️
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Internet / Wi-Fi</span>
        </div>

        {/* Wire Network -> Device */}
        <div style={{
          position: 'relative',
          width: '60px',
          height: '4px',
          backgroundColor: '#4a5568',
          overflow: 'hidden'
        }}>
          <AnimatePresence>
            {signalNetworkToDevice && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 0.5, ease: 'linear' }}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'var(--neon-blue)',
                  boxShadow: '0 0 8px var(--neon-blue)'
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Device Layer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          padding: '20px',
          borderRadius: '12px',
          border: '2px dashed var(--neon-blue)',
          backgroundColor: 'rgba(0, 191, 255, 0.1)',
          width: '280px'
        }}>
          <span style={{ color: 'var(--neon-blue)', fontWeight: 'bold', fontSize: '14px' }}>Device Layer</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
              boxShadow: (signalNetworkToDevice || deviceIsOn) ? '0 0 10px var(--neon-blue)' : 'none',
              transition: 'box-shadow 0.3s'
            }}>
              <span>ESP32</span>
              <span style={{ fontSize: '10px', color: deviceIsOn ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
                {deviceIsOn ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Wire Board -> Actuator */}
            <div style={{
              position: 'relative',
              width: '40px',
              height: '4px',
              backgroundColor: '#4a5568',
              overflow: 'hidden'
            }}>
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
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
        </div>

      </div>
    </div>
  );
}
