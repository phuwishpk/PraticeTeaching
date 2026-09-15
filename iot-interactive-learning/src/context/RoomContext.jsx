import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { createRoomState } from '../../shared/roomState';

const RoomContext = createContext();

export function RoomProvider({ children }) {
  const [roomState, setRoomState] = useState(createRoomState);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [joinUrl, setJoinUrl] = useState(`${window.location.origin}/`);
  const version = useRef({ instance: null, revision: -1 });
  const queue = useRef(Promise.resolve());
  const acceptSnapshot = useCallback(snapshot => {
    const current = version.current;
    // If server restarted (new instance), force page reload to get fresh PIN
    if (current.instance !== null && snapshot.instance !== current.instance) {
      console.warn('[RoomContext] Server restarted — reloading page to sync PIN...');
      sessionStorage.removeItem('student_name');
      window.location.reload();
      return;
    }
    if (snapshot.instance !== current.instance || snapshot.revision >= current.revision) {
      version.current = { instance: snapshot.instance, revision: snapshot.revision };
      setRoomState(snapshot.state);
    }
  }, []);

  useEffect(() => {
    const stream = new EventSource('/api/room/events');
    stream.onmessage = event => {
      acceptSnapshot(JSON.parse(event.data));
      setConnected(true);
    };
    stream.onerror = () => setConnected(false);
    fetch('/api/room/info').then(response => response.json()).then(info => setJoinUrl(info.joinUrl)).catch(() => {});
    return () => stream.close();
  }, [acceptSnapshot]);

  const dispatch = useCallback((type, payload = {}) => {
    // Serializing a client's actions preserves slider and navigation order.
    const request = queue.current.then(async () => {
      try {
        const response = await fetch('/api/room/actions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, payload }), signal: AbortSignal.timeout(8000),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'ส่งคำสั่งไม่สำเร็จ');
        acceptSnapshot(result);
        setError('');
        return true;
      } catch (err) {
        setError(err.name === 'TypeError' || err.name === 'TimeoutError' ? 'ส่งคำสั่งไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง' : err.message);
        return false;
      }
    });
    queue.current = request;
    return request;
  }, [acceptSnapshot]);

  const setChapter = useCallback(chapter => dispatch('changeChapter', { chapter }), [dispatch]);
  const setStep = useCallback(step => dispatch('changeStep', { step }), [dispatch]);
  const setPresentation = useCallback(patch => dispatch('presentation', { chapter: roomState.chapter, step: roomState.step, ...patch }), [dispatch, roomState.chapter, roomState.step]);
  const joinRoom = useCallback(async (name, pin) => {
    try {
      const response = await fetch('/api/room/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'join', payload: { name, pin } }),
      });
      const result = await response.json();
      if (!response.ok) {
        return { ok: false, error: result.error || 'ไม่สามารถเข้าร่วมห้องได้' };
      }
      acceptSnapshot(result);
      setError('');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
    }
  }, [acceptSnapshot]);
  const setVoteItem = useCallback(item => dispatch('voteItem', { item }), [dispatch]);
  const submitVote = useCallback((item, layer, name) => dispatch('architectureVote', { item, layer, name }), [dispatch]);
  const setCatalogQuestion = useCallback(question => dispatch('setCatalogQuestion', { question }), [dispatch]);
  const voteCatalog = useCallback((option, name) => dispatch('catalogVote', { option, name }), [dispatch]);
  const sendFloatingEmoji = useCallback((emoji, name) => dispatch('emoji', { emoji, name }), [dispatch]);
  const addFloatingEmoji = useCallback(emoji => dispatch('emoji', { emoji }), [dispatch]);
  const voteQuiz = useCallback((option, name) => dispatch('quizVote', { option, name }), [dispatch]);
  const revealQuiz = useCallback(reveal => dispatch('quizReveal', { reveal }), [dispatch]);
  const voteLogic = useCallback((option, name) => dispatch('logicVote', { option, name }), [dispatch]);
  const activateSense = useCallback(sense => dispatch('sense', { sense }), [dispatch]);
  const resetRoom = useCallback(() => dispatch('reset'), [dispatch]);

  const voteProblem = useCallback((option, name) => dispatch('problemVote', { option, name }), [dispatch]);
  const voteDigital = useCallback((option, name) => dispatch('digitalVote', { option, name }), [dispatch]);
  const voteAnalog = useCallback((option, name) => dispatch('analogVote', { option, name }), [dispatch]);

  return (
    <RoomContext.Provider value={{ roomState, connected, error, joinUrl, setChapter, setStep, setPresentation, joinRoom,
      setVoteItem, submitVote, sendFloatingEmoji,
      addFloatingEmoji, voteQuiz, revealQuiz, voteLogic, activateSense, resetRoom,
      voteProblem, voteDigital, voteAnalog, setCatalogQuestion, voteCatalog }}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext);
