import { randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { applyRoomAction, broadcastState, createRoomState, ROOM_ARCHIVE_DAYS, STUDENT_ACTIONS, studentKey } from '../shared/roomState.js';

// A whole class normally shares one public IP — school NAT, a phone hotspot, a tunnel —
// so an allowance sized for one person locks the room the moment everybody answers at
// once. A learner holding a token is limited as themselves; requests with no token yet
// (joining, checking the PIN) share a bucket big enough for a class arriving together.
// Every change sends the whole room to every phone, so coalescing a burst of answers into
// one send is the difference between one broadcast and thirty. A fifth of a second is well
// under what anyone notices on a classroom poll.
const PUBLISH_INTERVAL_MS = 200;

// The room lives in memory, so a crash or a redeploy used to end the lesson: new PIN,
// empty register, every score gone. Saving it lets the same class carry on where it was —
// and finishing a lesson files the room away rather than destroying it, so a teacher who
// moves on too early, or teaches the same class again after lunch, can pick it back up.
const PERSIST_VERSION = 2;
const PERSIST_DEBOUNCE_MS = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;
// Walking straight back into the room after a restart only makes sense the same day; a
// room older than that is an earlier lesson, and is filed away with the others instead.
const RESUME_WINDOW_MS = DAY_MS;
const ARCHIVE_MAX_AGE_MS = ROOM_ARCHIVE_DAYS * DAY_MS;
const MAX_ARCHIVED_ROOMS = 20;

// Behind a proxy this header reads "client, proxy1, proxy2", and any client can forge it to
// win itself a fresh rate-limit bucket. It is only believed when the deployment states that
// there really is a proxy in front; otherwise the socket address is the honest answer.
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const clientIp = req => {
  if (TRUST_PROXY) {
    const forwarded = req.headers['x-forwarded-for'];
    const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress || 'unknown';
};

// A header can be anything at all, and new URL throws on anything it dislikes.
const parseOrigin = value => {
  if (!value) return null;
  try { return new URL(value); } catch { return null; }
};

const isKept = entry => entry && Date.now() - entry.savedAt <= ARCHIVE_MAX_AGE_MS;
const isResumable = entry => Date.now() - entry.savedAt <= RESUME_WINDOW_MS;

const RECONNECT_BASE_MS = 2000;
const RECONNECT_JITTER_MS = 3000;

// Roughly one broadcast's worth of slack before a connection is considered hopeless.
const MAX_STREAM_BACKLOG = 1024 * 1024;

const RATE_WINDOW_MS = 3000;
const PER_STUDENT_LIMIT = 20;
const SHARED_LIMIT = 1000;

const safeEqual = (candidate, secret) => {
  const left = Buffer.from(String(candidate ?? ''));
  const right = Buffer.from(String(secret));
  return left.length === right.length && timingSafeEqual(left, right);
};

// The server writes a fresh file as soon as it boots, so one it cannot make sense of is
// moved out of the way first: it may be the only copy of a class's register and scores.
function setAside(persistPath, reason) {
  const aside = `${persistPath}.unreadable-${Date.now()}`;
  try {
    renameSync(persistPath, aside);
    console.warn(`[room] อ่านสถานะห้องที่บันทึกไว้ไม่ได้ (${reason}) ย้ายไฟล์เดิมไปไว้ที่ ${aside} แล้วเริ่มห้องใหม่`);
  } catch (error) {
    console.warn(`[room] อ่านสถานะห้องที่บันทึกไว้ไม่ได้ (${reason}) และย้ายไฟล์เดิมไม่ได้: ${error.message}`);
  }
}

function readSaved(persistPath) {
  const nothing = { current: null, archive: [] };
  if (!persistPath || !existsSync(persistPath)) return nothing;
  let saved;
  try {
    saved = JSON.parse(readFileSync(persistPath, 'utf8'));
  } catch (error) {
    setAside(persistPath, error.message);
    return nothing;
  }
  if (saved?.version !== PERSIST_VERSION) {
    setAside(persistPath, `ไฟล์รูปแบบ ${saved?.version}`);
    return nothing;
  }
  const usable = entry => Array.isArray(entry?.state?.students);
  const archive = (saved.archive ?? []).filter(entry => usable(entry) && isKept(entry));
  const current = usable(saved.current) ? saved.current : null;
  if (!current || isResumable(current)) return { current, archive: archive.slice(0, MAX_ARCHIVED_ROOMS) };
  // Yesterday's room is not one to walk back into, but it is still a class's register and
  // scores. Dropping it here used to lose it for good, since the boot save writes over the file.
  const filed = current.state.students.length && isKept(current) ? [current] : [];
  if (filed.length) console.log(`  📁 ห้อง PIN ${current.state.pin} ค้างไว้เกิน 1 วัน ย้ายไปไว้ในห้องก่อนหน้าแล้ว`);
  return { current: null, archive: [...filed, ...archive].slice(0, MAX_ARCHIVED_ROOMS) };
}

// A question left open when a room was put down has a long-expired clock, so it is closed
// on the way back in. The per-answer guards still stop anyone answering twice.
const reopened = state => ({ ...state, questionKey: null, questionRoster: [], questionStarts: {} });

export function createRoomApi({ persistPath = null } = {}) {
  const saved = readSaved(persistPath);
  let archive = saved.archive;
  // The archive changes only when a room is filed or picked back up, while the room being
  // taught is saved every couple of seconds; re-serialising a month of classes on each of
  // those saves would stall the answers arriving at the same moment.
  let archiveJson = JSON.stringify(archive);
  const setArchive = next => {
    archive = next.filter(isKept).slice(0, MAX_ARCHIVED_ROOMS);
    archiveJson = JSON.stringify(archive);
  };
  let roomId = saved.current?.id ?? randomUUID();
  let state = saved.current ? reopened(saved.current.state) : createRoomState();
  let revision = saved.current?.revision ?? 0;
  // Keeping the instance id means the browsers already in the room do not reload or lose
  // their seat — to them the server never went away.
  let instance = saved.current?.instance ?? randomUUID();
  const streams = new Set();
  const timers = new Set();
  if (saved.current) console.log(`\n  ♻️  กู้ห้องเดิมคืนมาแล้ว: PIN ${state.pin}, นักเรียน ${state.students.length} คน\n`);
  // serverNow lets each browser measure its own clock drift, so a phone set to the wrong
  // time still sees — and is judged by — the same countdown as everybody else.
  const snapshot = () => ({ instance, revision, state: broadcastState(state), serverNow: Date.now() });

  // Student actions are attributed by token, never by the name in the request body.
  const tokenByStudent = new Map(); // studentKey(name) -> token
  const nameByToken = new Map();    // token -> display name
  for (const [key, token, name] of saved.current?.tokens ?? []) {
    tokenByStudent.set(key, token);
    nameByToken.set(token, name);
  }

  // Everything needed to put this room down and pick it up again later, learners included.
  const captureRoom = () => ({
    id: roomId, savedAt: Date.now(), instance, revision, state,
    tokens: [...tokenByStudent].map(([key, token]) => [key, token, nameByToken.get(token)]),
  });
  // An empty room is not worth keeping; anything else is filed under its own id.
  const fileAway = () => {
    const current = captureRoom();
    if (!current.state.students.length) return;
    setArchive([current, ...archive.filter(entry => entry.id !== current.id)]);
  };
  // Puts the current room down and picks up another, learners and tokens and all. The
  // instance id travels with the room, so every browser notices it is somewhere else now.
  const enterRoom = record => {
    roomId = record.id;
    instance = record.instance;
    revision = record.revision;
    tokenByStudent.clear();
    nameByToken.clear();
    for (const [key, token, name] of record.tokens ?? []) {
      tokenByStudent.set(key, token);
      nameByToken.set(token, name);
    }
    publish(reopened(record.state), true);
  };
  const keptRooms = () => archive.filter(isKept);
  const listRooms = () => keptRooms().map(entry => ({
    id: entry.id, pin: entry.state.pin, chapter: entry.state.chapter,
    students: entry.state.students.length, savedAt: entry.savedAt,
  }));

  let persistTimeout = null;
  let persistError = null;
  const persist = () => {
    if (!persistPath) return;
    try {
      const payload = `{"version":${PERSIST_VERSION},"current":${JSON.stringify(captureRoom())},"archive":${archiveJson}}`;
      // Written beside the target and renamed, so a crash mid-write cannot leave the room
      // half-saved and unreadable.
      writeFileSync(`${persistPath}.tmp`, payload);
      renameSync(`${persistPath}.tmp`, persistPath);
      if (persistError) {
        console.log('[room] ✅ กลับมาบันทึกสถานะห้องได้แล้ว');
        persistError = null;
      }
    } catch (error) {
      // Repeating this every two seconds would bury the one message that matters.
      if (persistError !== error.message) {
        console.error(`[room] ⚠️  บันทึกสถานะห้องไม่ได้ ห้องจะหายถ้าเซิร์ฟเวอร์รีสตาร์ต: ${error.message}`);
      }
      persistError = error.message;
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

  // A phone that walks out of wi-fi leaves a socket that throws on the next write. One of
  // those must not end the broadcast loop, let alone the process.
  const send = (res, chunk) => {
    try {
      // A dying connection stops draining its socket while Node keeps buffering for it, so
      // one bad phone can grow without limit. Letting it go costs nothing: the browser
      // reconnects and is handed the current room anyway.
      if (res.writableLength > MAX_STREAM_BACKLOG) {
        streams.delete(res);
        res.destroy();
        return;
      }
      res.write(chunk);
    } catch {
      streams.delete(res);
    }
  };

  let publishTimeout = null;
  // force is for swapping rooms, where the new state is unrelated to the old one and the
  // clients must be told even though nothing about the current room "changed".
  const publish = (next, force = false) => {
    if (!force && next === state) return;
    state = next;
    revision++;
    schedulePersist();
    if (!publishTimeout) {
      publishTimeout = setTimeout(() => {
        timers.delete(publishTimeout);
        publishTimeout = null;
        const event = `data: ${JSON.stringify(snapshot())}\n\n`;
        for (const res of streams) send(res, event);
      }, PUBLISH_INTERVAL_MS);
      publishTimeout.unref();
      timers.add(publishTimeout);
    }
  };
  const json = (res, status, data) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  const heartbeat = setInterval(() => { for (const res of streams) send(res, ': heartbeat\n\n'); }, 15000);
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
    try {
      return await handleRequest(req, res, next);
    } catch (error) {
      // Unhandled here means an unhandled rejection, and Node ends the process for those —
      // taking the whole class's room down over one bad request.
      console.error('[room] คำขอนี้ล้มเหลว แต่ห้องยังทำงานต่อ:', error);
      if (res.headersSent) res.end();
      else json(res, 500, { error: 'เซิร์ฟเวอร์ขัดข้องชั่วคราว กรุณาลองใหม่' });
      return undefined;
    }
  }

  async function handleRequest(req, res, next) {
    const path = req.url?.split('?')[0];
    if (!path?.startsWith('/api/room/')) return next();
    if (req.method === 'GET' && path === '/api/room/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      // Reconnect delay, staggered per connection. A reverse proxy that drops long-lived
      // connections drops all of them at once, and a fixed one second delay had the whole
      // class marching back in lockstep — each reconnect costing the proxy another worker
      // and the server another full snapshot.
      res.write(`retry: ${RECONNECT_BASE_MS + Math.floor(Math.random() * RECONNECT_JITTER_MS)}\ndata: ${JSON.stringify(snapshot())}\n\n`);
      streams.add(res);
      res.on('close', () => streams.delete(res));
      res.on('error', () => streams.delete(res));
      return;
    }
    if (req.method === 'GET' && path === '/api/room/health') {
      return json(res, 200, {
        ok: true,
        uptimeSeconds: Math.round(process.uptime()),
        students: state.students.length,
        streams: streams.size,
        archivedRooms: keptRooms().length,
        revision,
        // Deliberately no PIN: this endpoint is open, and the PIN is what gets you into the room.
        persist: persistPath
          ? { enabled: true, ok: !persistError, ...(persistError ? { error: persistError } : {}) }
          : { enabled: false },
        trustProxy: TRUST_PROXY,
      });
    }
    if (req.method === 'GET' && path === '/api/room/rooms') {
      return json(res, 200, { rooms: listRooms() });
    }
    if (req.method === 'GET' && path === '/api/room/info') {
      const localIp = Object.values(networkInterfaces()).flat().find(address => address?.family === 'IPv4' && !address.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address))?.address;
      const origin = parseOrigin(process.env.PUBLIC_ORIGIN) || parseOrigin(`http://${req.headers.host}`) || parseOrigin(`http://${localIp || 'localhost'}`);
      if (!process.env.PUBLIC_ORIGIN && ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) && localIp) origin.hostname = localIp;
      return json(res, 200, { joinUrl: new URL('/', origin).href });
    }
    if (req.method !== 'POST' || path !== '/api/room/actions') return json(res, 404, { error: 'ไม่พบปลายทาง' });

    // Rate Limiting
    const studentToken = req.headers['x-student-token'];
    const ip = clientIp(req);
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
      action.payload = { ...action.payload, id: randomUUID(), x: Math.random() * 90 };

      // Both of these swap the whole room, which applyRoomAction cannot do: it only ever
      // sees one room's state and knows nothing about the ones filed away.
      if (action.type === 'restoreRoom') {
        const record = archive.find(entry => entry.id === action.payload.roomId && isKept(entry));
        if (!record) return json(res, 404, { error: `ไม่พบห้องเรียนนี้แล้ว อาจเก็บไว้เกิน ${ROOM_ARCHIVE_DAYS} วัน` });
        fileAway();
        setArchive(archive.filter(entry => entry.id !== record.id));
        enterRoom(record);
        persist();
        return json(res, 200, snapshot());
      }
      if (action.type === 'reset') {
        // Starting fresh files the old room away instead of destroying it.
        fileAway();
        tokenByStudent.clear();
        nameByToken.clear();
        roomId = randomUUID();
        instance = randomUUID();
        revision = 0;
        publish(createRoomState(), true);
        persist();
        return json(res, 200, snapshot());
      }

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

      if (action.type === 'emoji') {
        if (!['👍', '💡', '❤️', '🔥', '🎉', '👏'].includes(action.payload.emoji)) throw new Error('ข้อมูลคำสั่งไม่ถูกต้อง');
        const event = `event: emoji\ndata: ${JSON.stringify(action.payload)}\n\n`;
        for (const res of streams) send(res, event);
        return json(res, 200, snapshot());
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
    } catch (error) {
      json(res, error.status || 400, { error: error instanceof SyntaxError ? 'ข้อมูลคำสั่งไม่ถูกต้อง' : error.message });
    }
  }
  // Prove the disk takes writes at boot, rather than finding out when a lesson is lost. On
  // a platform with an ephemeral or read-only filesystem this is the only warning there is.
  if (persistPath) {
    persist();
    if (!persistError) console.log(`  💾 บันทึกสถานะห้องไว้ที่ ${persistPath} (ห้องก่อนหน้า ${archive.length} ห้อง)`);
  }

  return {
    middleware,
    listRooms,
    // Enough to see, from outside, whether connections are piling up during a lesson.
    stats: () => ({ streams: streams.size, students: state.students.length, archived: keptRooms().length, revision }),
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
