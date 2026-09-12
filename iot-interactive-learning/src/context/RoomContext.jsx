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
  digitalPresses: [],
  analogValues: {},
  wordSubmissions: [],
  floatingEmojis: [],
  quizVotes: {},
  quizRevealed: false,
  logicVotes: {},
  architectureVotes: { esp32: {}, wifi: {}, cloud: {} },
  currentVoteItem: 'esp32',
  canvasImages: [],
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

  const updateDigital = useCallback((val, name) => {
    setState((prev) => {
      let presses = prev.digitalPresses || [];
      if (val) {
        if (!presses.includes(name)) presses = [...presses, name];
      } else {
        presses = presses.filter(n => n !== name);
      }
      return { ...prev, digitalPresses: presses, digitalValue: presses.length > 0 ? 1 : 0 };
    });
  }, [setState]);

  const updateAnalog = useCallback((val, name) => {
    setState((prev) => ({
      ...prev,
      analogValues: { ...(prev.analogValues || {}), [name]: val }
    }));
  }, [setState]);

  const setVoteItem = useCallback((item) => {
    setState({ currentVoteItem: item });
  }, [setState]);

  const submitVote = useCallback((item, layer, name) => {
    setState((prev) => ({
      ...prev,
      architectureVotes: {
        ...prev.architectureVotes,
        [item]: { ...prev.architectureVotes[item], [name]: layer }
      }
    }));
  }, [setState]);

  const submitCanvas = useCallback((image, name) => {
    setState((prev) => ({
      ...prev,
      canvasImages: [...prev.canvasImages, { image, name }]
    }));
  }, [setState]);

  const submitWord = useCallback((word, name) => {
    setState((prev) => ({
      ...prev,
      wordSubmissions: [...prev.wordSubmissions, { word: word.trim().toLowerCase(), name, id: Date.now() }],
    }));
  }, [setState]);

  const addFloatingEmoji = useCallback((emoji) => {
    setState((prev) => ({
      ...prev,
      floatingEmojis: [
        ...(prev.floatingEmojis || []),
        { id: Date.now() + Math.random(), emoji, x: Math.random() * 100 }
      ].slice(-50) // limit to 50
    }));
  }, [setState]);

  const voteQuiz = useCallback((option, name) => {
    setState((prev) => ({
      ...prev,
      quizVotes: { ...(prev.quizVotes || {}), [name]: option }
    }));
  }, [setState]);

  const revealQuiz = useCallback((reveal) => {
    setState({ quizRevealed: reveal });
  }, [setState]);

  const voteLogic = useCallback((option, name) => {
    setState((prev) => ({
      ...prev,
      logicVotes: { ...(prev.logicVotes || {}), [name]: option }
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
      setVoteItem,
      submitVote,
      submitCanvas,
      submitWord,
      addFloatingEmoji,
      voteQuiz,
      revealQuiz,
      voteLogic,
      resetRoom,
    }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
