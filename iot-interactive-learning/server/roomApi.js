import { randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { applyRoomAction, broadcastState, createRoomState, STUDENT_ACTIONS, studentKey } from '../shared/roomState.js';

// A whole class normally shares one public IP — school NAT, a phone hotspot, a tunnel —
// so an allowance sized for one person locks the room the moment everybody answers at
// once. A learner holding a token is limited as themselves; requests with no token yet
// (joining, checking the PIN) share a bucket big enough for a class arriving together.
// Every change sends the whole room to every phone, so coalescing a burst of answers into
// one send is the difference between one broadcast and thirty. A fifth of a second is well
// under what anyone notices on a classroom poll.
const PUBLISH_INTERVAL_MS = 200;

// The room lives in memory, so a crash or a redeploy used to end the lesson: new PIN,
// empty register, every score gone. Saving it lets the same class carry on where it was.
const PERSIST_VERSION = 1;
const PERSIST_DEBOUNCE_MS = 2000;
// A room older than a school day is last week's lesson, not this one — start fresh.
const PERSIST_MAX_AGE_MS = 6 * 60 * 60 * 1000;

const RATE_WINDOW_MS = 3000;
const PER_STUDENT_LIMIT = 20;
const SHARED_LIMIT = 300;

const safeEqual = (candidate, secret) => {
  const left = Buffer.from(String(candidate ?? ''));
  const right = Buffer.from(String(secret));
  return left.length === right.length && timingSafeEqual(left, right);
};

function readSaved(persistPath) {
  if (!persistPath || !existsSync(persistPath)) return null;
  try {
    const saved = JSON.parse(readFileSync(persistPath, 'utf8'));
    if (saved?.version !== PERSIST_VERSION || !Array.isArray(saved.state?.students)) return null;
    if (Date.now() - saved.savedAt > PERSIST_MAX_AGE_MS) return null;
    return saved;
  } catch (error) {
    console.warn('[room] อ่านสถานะห้องที่บันทึกไว้ไม่ได้ จะเริ่มห้องใหม่:', error.message);
    return null;
  }
}

export function createRoomApi({ persistPath = null } = {}) {
  const saved = readSaved(persistPath);
  // Whatever question was open when the server stopped has an expired clock by now, so it
  // is closed on the way back in. The per-answer guards still stop anyone answering twice.
  let state = saved ? { ...saved.state, questionKey: null, questionRoster: [], questionStarts: {} } : createRoomState();
  let revision = saved?.revision ?? 0;
  // Keeping the instance id means the browsers already in the room do not reload or lose
  // their seat — to them the server never went away.
  const instance = saved?.instance ?? randomUUID();
  const streams = new Set();
  const timers = new Set();
  if (saved) console.log(`\n  ♻️  กู้ห้องเดิมคืนมาแล้ว: PIN ${state.pin}, นักเรียน ${state.students.length} คน\n`);
  // serverNow lets each browser measure its own clock drift, so a phone set to the wrong
  // time still sees — and is judged by — the same countdown as everybody else.
  const snapshot = () => ({ instance, revision, state: broadcastState(state), serverNow: Date.now() });

  // Student actions are attributed by token, never by the name in the request body.
  const tokenByStudent = new Map(); // studentKey(name) -> token
  const nameByToken = new Map();    // token -> display name
  for (const [key, token, name] of saved?.tokens ?? []) {
    tokenByStudent.set(key, token);
    nameByToken.set(token, name);
  }

  let persistTimeout = null;
  const persist = () => {
    if (!persistPath) return;
    try {
      const payload = JSON.stringify({
        version: PERSIST_VERSION, savedAt: Date.now(), instance, revision, state,
        tokens: [...tokenByStudent].map(([key, token]) => [key, token, nameByToken.get(token)]),
      });
      // Written beside the target and renamed, so a crash mid-write cannot leave the room
      // half-saved and unreadable.
      writeFileSync(`${persistPath}.tmp`, payload);
      renameSync(`${persistPath}.tmp`, persistPath);
    } catch (error) {
      console.warn('[room] บันทึกสถานะห้องไม่สำเร็จ:', error.message);
    }
  };
  const schedulePersist = () => {
    if (!persistPath || persistTimeout) return;
    persistTimeout = setTimeout(() => {
      timers.delete(persistTimeout);
      persistTimeout = null;
      persist();
    }, PERSIST_DEBOUNCE_MS);
    persistTimeout.unref();
    timers.add(persistTimeout);
  };

  let publishTimeout = null;
  const publish = next => {
    if (next === state) return;
    state = next;
    revision++;
    schedulePersist();
    if (!publishTimeout) {
      publishTimeout = setTimeout(() => {
        timers.delete(publishTimeout);
        publishTimeout = null;
        const event = `data: ${JSON.stringify(snapshot())}\n\n`;
        for (const res of streams) res.write(event);
      }, PUBLISH_INTERVAL_MS);
      publishTimeout.unref();
      timers.add(publishTimeout);
    }
  };
  const json = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  const heartbeat = setInterval(() => { for (const res of streams) res.write(': heartbeat\n\n'); }, 15000);
  heartbeat.unref();

  const rateLimitMap = new Map();
  const cleanupRateLimit = setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitMap.entries()) {
      if (now - data.startTime > RATE_WINDOW_MS) rateLimitMap.delete(key);
    }
  }, 10000);
  cleanupRateLimit.unref();

  async function readBody(req) {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (Buffer.byteLength(body) > 16384) {
        const error = new Error('ข้อมูลมีขนาดใหญ่เกินไป');
        error.status = 413;
        throw error;
      }
    }
    return JSON.parse(body);
  }

  async function middleware(req, res, next = () => { res.writeHead(404); res.end(); }) {
    const path = req.url?.split('?')[0];
    if (!path?.startsWith('/api/room/')) return next();
    if (req.method === 'GET' && path === '/api/room/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write(`retry: 1000\ndata: ${JSON.stringify(snapshot())}\n\n`);
      streams.add(res);
      res.on('close', () => streams.delete(res));
      return;
    }
    if (req.method === 'GET' && path === '/api/room/info') {
      const localIp = Object.values(networkInterfaces()).flat().find(address => address?.family === 'IPv4' && !address.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address))?.address;
      const origin = new URL(process.env.PUBLIC_ORIGIN || `http://${req.headers.host}`);
      if (!process.env.PUBLIC_ORIGIN && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) && localIp) origin.hostname = localIp;
      return json(res, 200, { joinUrl: new URL('/', origin).href });
    }
    if (req.method !== 'POST' || path !== '/api/room/actions') return json(res, 404, { error: 'ไม่พบปลายทาง' });

    // Rate Limiting
    const studentToken = req.headers['x-student-token'];
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const limitKey = studentToken ? `student:${studentToken}` : `ip:${ip}`;
    const limit = studentToken ? PER_STUDENT_LIMIT : SHARED_LIMIT;
    const now = Date.now();
    let limitData = rateLimitMap.get(limitKey);
    if (!limitData || now - limitData.startTime > RATE_WINDOW_MS) {
      limitData = { count: 0, startTime: now };
    }
    limitData.count++;
    rateLimitMap.set(limitKey, limitData);
    if (limitData.count > limit) {
      return json(res, 429, { error: 'ส่งคำสั่งเร็วเกินไป กรุณารอสักครู่' });
    }

    try {
      const action = await readBody(req);
      if (!action || typeof action.type !== 'string' || (action.payload !== undefined && (!action.payload || typeof action.payload !== 'object'))) throw new Error('ข้อมูลคำสั่งไม่ถูกต้อง');
      if (action.type === 'expireEmoji') throw new Error('ไม่พบคำสั่งนี้');
      action.payload = { ...action.payload, id: randomUUID(), x: Math.random() * 90 };

      if (action.type === 'join') {
        const key = studentKey(action.payload.name);
        const issued = tokenByStudent.get(key);
        const seated = state.students.some(student => studentKey(student.name) === key);
        const sameDevice = Boolean(issued) && safeEqual(req.headers['x-student-token'], issued);
        // A learner whose phone lost its session can only prove who they are by typing the
        // name again, so that claim takes the seat back and evicts whatever still holds it.
        // The client cannot ask for this itself — the flag is set here, from the token.
        const takeover = seated && !sameDevice;
        action.payload.takeover = takeover;
        publish(applyRoomAction(state, action));
        const student = state.students.find(entry => studentKey(entry.name) === key);
        // Retiring the old token is what actually locks the previous screen out.
        if (takeover && issued) nameByToken.delete(issued);
        const token = takeover || !issued ? randomUUID() : issued;
        tokenByStudent.set(key, token);
        nameByToken.set(token, student.name);
        // The seat keeps the spelling it was first created with, so "ann" rejoining "Ann" is told which name its answers are filed under.
        return json(res, 200, { ...snapshot(), studentToken: token, studentName: student.name, studentId: student.id });
      }

      if (STUDENT_ACTIONS.has(action.type)) {
        const name = nameByToken.get(req.headers['x-student-token']);
        if (!name) return json(res, 401, { error: 'กรุณาเข้าห้องเรียนอีกครั้ง' });
        action.payload.name = name;
      }

      publish(applyRoomAction(state, action));
      if (action.type === 'removeStudent') {
        const key = studentKey(action.payload.name);
        const token = tokenByStudent.get(key);
        tokenByStudent.delete(key);
        if (token) nameByToken.delete(token);
      }
      if (action.type === 'reset') {
        tokenByStudent.clear();
        nameByToken.clear();
      }
      json(res, 200, snapshot());
      if (action.type === 'emoji') {
        const timer = setTimeout(() => {
          publish(applyRoomAction(state, { type: 'expireEmoji', payload: { id: action.payload.id } }));
          timers.delete(timer);
        }, 3000);
        timer.unref();
        timers.add(timer);
      }
    } catch (error) {
      json(res, error.status || 400, { error: error instanceof SyntaxError ? 'ข้อมูลคำสั่งไม่ถูกต้อง' : error.message });
    }
  }
  return {
    middleware,
    close() {
      if (persistTimeout) clearTimeout(persistTimeout);
      persist();
      clearInterval(heartbeat);
      clearInterval(cleanupRateLimit);
      for (const timer of timers) clearTimeout(timer);
      for (const res of streams) res.end();
      streams.clear();
      rateLimitMap.clear();
      tokenByStudent.clear();
      nameByToken.clear();
    },
  };
}

export function roomSyncPlugin() {
  const configure = server => {
    const api = createRoomApi();
    server.middlewares.use(api.middleware);
    server.httpServer?.on('close', () => api.close());
  };
  return { name: 'iot-room-sync', configureServer: configure, configurePreviewServer: configure };
}
