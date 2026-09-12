import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const RoomContext = createContext();

// ---- Default State ----
const DEFAULT_STATE = {
  pin: '8492',
  phase: 1, // 1: Lobby, 2: Senses, 3: Word Cloud, 4: Digital, 5: Analog, 6: Sensors
  students: [],
  senses: { eyes: false, ears: false, hands: false },
  digitalValue: 0,
  analogValue: 0,
  wordSubmissions: [],
  floatingEmojis: [],
};

const STORAGE_KEY = 'iot_room_state_v2';

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? { ...DEFAULT_STATE, ...JSON.parse(s) } : { ...DEFAULT_STATE };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function RoomProvider({ children }) {
  const [roomState, setRoomStateLocal] = useState(loadState);
  const broadcastRef = useRef(null);

  useEffect(() => {
    // BroadcastChannel syncs across same-origin tabs better than storage events
    try {
      broadcastRef.current = new BroadcastChannel(STORAGE_KEY);
      broadcastRef.current.onmessage = (e) => {
        setRoomStateLocal(e.data);
      };
    } catch {
      // Fallback to storage events (Safari)
      const onStorage = (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try { setRoomStateLocal(JSON.parse(e.newValue)); } catch {}
        }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }
    return () => broadcastRef.current?.close();
  }, []);

  const setState = useCallback((updater) => {
    setRoomStateLocal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      // Save to localStorage for persistence and fallback sync
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      // Broadcast to other tabs via BroadcastChannel
      try { broadcastRef.current?.postMessage(next); } catch {}
      return next;
    });
  }, []);

  // ── Actions ──────────────────────────────────────────────
  const setPhase = useCallback((phase) => setState({ phase }), [setState]);

  const joinRoom = useCallback((name) => {
    setState((prev) => ({
      ...prev,
      students: [...prev.students, { id: Date.now(), name }],
    }));
  }, [setState]);

  const sendFloatingEmoji = useCallback((emoji, name) => {
    const id = Date.now() + Math.random();
    setState((prev) => ({
      ...prev,
      floatingEmojis: [...prev.floatingEmojis, { id, emoji, name }],
    }));
    // Remove after 3 seconds
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        floatingEmojis: prev.floatingEmojis.filter((e) => e.id !== id),
      }));
    }, 3000);
  }, [setState]);

  const activateSense = useCallback((sense) => {
    setState((prev) => ({
      ...prev,
      senses: { ...prev.senses, [sense]: true },
    }));
  }, [setState]);

  const updateDigital = useCallback((val) => setState({ digitalValue: val }), [setState]);
  const updateAnalog = useCallback((val) => setState({ analogValue: val }), [setState]);

  const submitWord = useCallback((word, name) => {
    setState((prev) => ({
      ...prev,
      wordSubmissions: [...prev.wordSubmissions, { word: word.trim().toLowerCase(), name, id: Date.now() }],
    }));
  }, [setState]);

  const resetRoom = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setState({ ...DEFAULT_STATE });
  }, [setState]);

  return (
    <RoomContext.Provider value={{
      roomState,
      setPhase,
      joinRoom,
      sendFloatingEmoji,
      activateSense,
      updateDigital,
      updateAnalog,
      submitWord,
      resetRoom,
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
