import { randomUUID } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { applyRoomAction, createRoomState } from '../shared/roomState.js';

export function createRoomApi() {
  let state = createRoomState();
  let revision = 0;
  const instance = randomUUID();
  const streams = new Set();
  const timers = new Set();
  const snapshot = () => ({ instance, revision, state });
  let publishTimeout = null;
  const publish = next => {
    if (next === state) return;
    state = next;
    revision++;
    if (!publishTimeout) {
      publishTimeout = setTimeout(() => {
        timers.delete(publishTimeout);
        publishTimeout = null;
        const event = `data: ${JSON.stringify(snapshot())}\n\n`;
        for (const res of streams) res.write(event);
      }, 50);
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
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now - data.startTime > 3000) rateLimitMap.delete(ip);
    }
  }, 10000);
  cleanupRateLimit.unref();

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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let limitData = rateLimitMap.get(ip);
    if (!limitData || now - limitData.startTime > 3000) {
      limitData = { count: 0, startTime: now };
    }
    limitData.count++;
    rateLimitMap.set(ip, limitData);
    if (limitData.count > 20) {
      return json(res, 429, { error: 'ส่งคำสั่งเร็วเกินไป กรุณารอสักครู่' });
    }

    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 16384) return json(res, 413, { error: 'ข้อมูลมีขนาดใหญ่เกินไป' });
      }
      const action = JSON.parse(body);
      if (!action || typeof action.type !== 'string' || (action.payload !== undefined && (!action.payload || typeof action.payload !== 'object'))) throw new Error('ข้อมูลคำสั่งไม่ถูกต้อง');
      if (action.type === 'expireEmoji') throw new Error('ไม่พบคำสั่งนี้');
      action.payload = { ...action.payload, id: randomUUID(), x: Math.random() * 90 };
      publish(applyRoomAction(state, action));
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
      json(res, 400, { error: error instanceof SyntaxError ? 'ข้อมูลคำสั่งไม่ถูกต้อง' : error.message });
    }
  }
  return {
    middleware,
    close() {
      clearInterval(heartbeat);
      clearInterval(cleanupRateLimit);
      for (const timer of timers) clearTimeout(timer);
      for (const res of streams) res.end();
      streams.clear();
      rateLimitMap.clear();
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
