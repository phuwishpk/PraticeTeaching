import React, { createContext, useContext, useState, useEffect } from 'react';

const RoomContext = createContext();

export function RoomProvider({ children }) {
  // Mock Real-time State
  const [roomState, setRoomState] = useState({
    pin: '8492',
    phase: 1, // 1: Lobby, 2: Senses, 3: Word Cloud, ...
    students: [],
    senses: { eyes: false, ears: false, hands: false },
    // Signals
    digitalValue: 0,
    analogValue: 0,
  });

  // Client actions
  const joinRoom = (name) => {
    setRoomState(prev => ({
      ...prev,
      students: [...prev.students, { id: Date.now(), name, emoji: null }]
    }));
  };

  const sendEmoji = (id, emoji) => {
    setRoomState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, emoji } : s)
    }));
    
    // Auto clear emoji after 2 seconds
    setTimeout(() => {
      setRoomState(prev => ({
        ...prev,
        students: prev.students.map(s => s.id === id ? { ...s, emoji: null } : s)
      }));
    }, 2000);
  };

  const setPhase = (phase) => {
    setRoomState(prev => ({ ...prev, phase }));
  };

  const activateSense = (sense) => {
    setRoomState(prev => ({ ...prev, senses: { ...prev.senses, [sense]: true } }));
  };

  const updateDigital = (val) => {
    setRoomState(prev => ({ ...prev, digitalValue: val }));
  };
  
  const updateAnalog = (val) => {
    setRoomState(prev => ({ ...prev, analogValue: val }));
  };

  return (
    <RoomContext.Provider value={{ roomState, joinRoom, sendEmoji, setPhase, activateSense, updateDigital, updateAnalog }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
