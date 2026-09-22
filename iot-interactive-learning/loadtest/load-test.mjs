#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Load / stress test harness for the IoT interactive-learning room server.
//
// เครื่องมือทดสอบโหลด: จำลองห้องเรียนจริง — นักเรียนหลายคนเข้าห้อง เปิด SSE
// ค้างไว้ ตอบคำถามพร้อมกัน และกดอิโมจิรัว ๆ พร้อมกันทั้งห้อง — เพื่อวัดว่า
// เซิร์ฟเวอร์รับได้แค่ไหน (throughput / latency / error rate / ตอนไหนเริ่มพัง).
//
// This ONLY drives your own server. It talks the same HTTP+SSE the real phones
// talk (see server/roomApi.js): POST /api/room/actions and GET /api/room/events.
// It never uses a private exploit — it just does what a browser does, many times.
//
// Usage:
//   node loadtest/load-test.mjs <scenario> [--flag value ...]
//
// Scenarios:
//   smoke         quick sanity check (few students, one vote)          ~2s
//   classroom     realistic full class: join + SSE hold + vote + emoji  (flagship)
//   join-storm    N students join as fast as possible (find join ceiling / 429s)
//   answer-storm  N students all vote inside one 200ms broadcast window
//   emoji-flood   N students spam reactions for --duration (write + fan-out)
//   read-flood    hammer GET /api/room/health at --concurrency (raw RPS)
//   sse-hold      open N event streams, hold, measure broadcast fan-out
//   all           run every scenario in sequence and print a combined report
//
// Common flags (also settable as UPPER_SNAKE env vars):
//   --target   http://127.0.0.1:3000   server under test
//   --students 40                       virtual students (a class)
//   --duration 15                       seconds, for the timed floods
//   --concurrency 100                   parallel workers, for read-flood
//   --rate     8                        emoji per student per second (emoji-flood)
//   --json     <path>                   also write the machine report here
//   --i-own-this-target                 required to point at a non-local host
//
// Examples:
//   node loadtest/load-test.mjs smoke
//   node loadtest/load-test.mjs classroom --students 60 --duration 20
//   node loadtest/load-test.mjs join-storm --students 3000
//   node loadtest/load-test.mjs read-flood --concurrency 400 --duration 10
// ---------------------------------------------------------------------------

import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';

// ---- config ---------------------------------------------------------------

const argv = process.argv.slice(2);
const scenario = (argv[0] && !argv[0].startsWith('-') ? argv[0] : 'smoke').toLowerCase();

function flag(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0) return argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
  const env = process.env[name.replace(/-/g, '_').toUpperCase()];
  return env !== undefined ? env : fallback;
}
const num = (v, d) => (v === undefined || v === true ? d : Number(v));

const TARGET = String(flag('target', 'http://127.0.0.1:3000'));
const STUDENTS = num(flag('students'), 40);
const DURATION_S = num(flag('duration'), 15);
const CONCURRENCY = num(flag('concurrency'), 100);
const RATE = num(flag('rate'), 8);
const JSON_OUT = flag('json', null);
const OWN_TARGET = flag('i-own-this-target', false) !== false;

const url = new URL(TARGET);
const lib = url.protocol === 'https:' ? https : http;
const HOST = url.hostname;
const PORT = Number(url.port) || (url.protocol === 'https:' ? 443 : 80);

// Guardrail: this is a self-test tool. Refuse to hammer a host you don't
// obviously control unless you explicitly assert ownership. Concurrent flooding
// of a machine you don't own is a denial-of-service attack, not a test.
const LOCAL = /^(localhost|127\.|0\.0\.0\.0|::1|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
if (!LOCAL.test(HOST) && !HOST.endsWith('.local') && !OWN_TARGET) {
  console.error(`\n✋ Refusing to load-test a non-local host: ${HOST}`);
  console.error('   This tool is for your OWN server. If you own/operate this target and are');
  console.error('   authorized to load-test it, re-run with --i-own-this-target.\n');
  process.exit(2);
}

// keepAlive so the client isn't the bottleneck; separate uncapped agent for the
// long-lived SSE sockets so held streams don't starve the request pool.
const reqAgent = new lib.Agent({ keepAlive: true, maxSockets: 4096 });
const streamAgent = new lib.Agent({ keepAlive: true, maxSockets: Infinity });

const EMOJIS = ['👍', '💡', '❤️', '🔥', '🎉', '👏'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const fmt = n => (n >= 1000 ? n.toFixed(0) : n >= 100 ? n.toFixed(1) : n.toFixed(2));

// ---- HTTP helpers ---------------------------------------------------------

function request(method, path, { headers = {}, body = null, agent = reqAgent, timeout = 30000 } = {}) {
  return new Promise(resolve => {
    const data = body != null ? Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const h = { ...headers };
    if (data) { h['content-type'] = 'application/json'; h['content-length'] = data.length; }
    const start = performance.now();
    const req = lib.request({ hostname: HOST, port: PORT, path, method, headers: h, agent }, res => {
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', c => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, ms: performance.now() - start, body: buf, headers: res.headers }));
    });
    req.on('error', err => resolve({ status: `ERR:${err.code || err.message}`, ms: performance.now() - start, body: null }));
    req.setTimeout(timeout, () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    if (data) req.write(data);
    req.end();
  });
}

async function action(type, payload, token) {
  const headers = token ? { 'x-student-token': token } : {};
  const r = await request('POST', '/api/room/actions', { headers, body: payload ? { type, payload } : { type } });
  try { r.json = r.body ? JSON.parse(r.body) : null; } catch { r.json = null; }
  return r;
}

// Open an SSE stream and keep it open. onFrame(dataString) fires per event.
function openStream(path, { onFrame } = {}) {
  return new Promise((resolve, reject) => {
    const req = lib.request(
      { hostname: HOST, port: PORT, path, method: 'GET', agent: streamAgent, headers: { accept: 'text/event-stream' } },
      res => {
        if (res.statusCode !== 200) { res.resume(); reject(new Error(`stream ${res.statusCode}`)); return; }
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', chunk => {
          buf += chunk;
          let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const raw = buf.slice(0, i); buf = buf.slice(i + 2);
            const lines = raw.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim());
            if (lines.length && onFrame) onFrame(lines.join('\n'));
          }
        });
        res.on('error', () => {});
        resolve({ close: () => req.destroy(), req });
      }
    );
    req.on('error', reject);
    req.setTimeout(0);
    req.end();
  });
}

// Run tasks with bounded concurrency.
async function pool(items, worker, concurrency) {
  const q = items.slice();
  let idx = 0;
  const run = async () => { while (q.length) { const i = idx++; await worker(q.shift(), i); } };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
}

// ---- metrics --------------------------------------------------------------

class Metric {
  constructor(name) { this.name = name; this.samples = []; this.count = 0; this.status = {}; this.cap = 300000; this.t0 = performance.now(); }
  add(ms, status) {
    this.count++;
    this.status[status] = (this.status[status] || 0) + 1;
    if (this.samples.length < this.cap) this.samples.push(ms);
    else { const j = Math.floor(Math.random() * this.count); if (j < this.cap) this.samples[j] = ms; } // reservoir
  }
  pct(p) { if (!this.samples.length) return 0; const s = [...this.samples].sort((a, b) => a - b); return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)]; }
  get elapsed() { return (performance.now() - this.t0) / 1000; }
  get ok() { return Object.entries(this.status).filter(([k]) => k[0] === '2').reduce((a, [, v]) => a + v, 0); }
  get throttled() { return this.status['429'] || 0; }
  get bad() {
    return Object.entries(this.status)
      .filter(([k]) => k.startsWith('ERR') || k[0] === '5' || (k[0] === '4' && k !== '429'))
      .reduce((a, [, v]) => a + v, 0);
  }
  summary(elapsedOverride) {
    const el = elapsedOverride ?? this.elapsed;
    return {
      name: this.name, count: this.count, seconds: Number(el.toFixed(2)),
      rps: Number((this.count / (el || 1)).toFixed(1)),
      ok: this.ok, throttled_429: this.throttled, errors: this.bad,
      p50: Number(this.pct(50).toFixed(1)), p90: Number(this.pct(90).toFixed(1)),
      p99: Number(this.pct(99).toFixed(1)), max: Number(this.pct(100).toFixed(1)),
      status: this.status,
    };
  }
}

function printMetric(m, elapsedOverride) {
  const s = m.summary(elapsedOverride);
  const badFlag = s.errors > 0 ? '  ⚠️' : '';
  console.log(`\n  ▸ ${s.name}`);
  console.log(`      requests ${s.count}  in ${s.seconds}s  →  ${fmt(s.rps)} req/s`);
  console.log(`      latency  p50 ${fmt(s.p50)}ms   p90 ${fmt(s.p90)}ms   p99 ${fmt(s.p99)}ms   max ${fmt(s.max)}ms`);
  console.log(`      outcome  ok ${s.ok}   throttled(429) ${s.throttled_429}   errors ${s.errors}${badFlag}`);
  const other = Object.entries(s.status).filter(([k]) => k !== '200' && k !== '429');
  if (other.length) console.log(`      status   ${other.map(([k, v]) => `${k}:${v}`).join('  ')}`);
  return s;
}

// ---- room orchestration (acts as the teacher + students) ------------------

async function health() {
  const r = await request('GET', '/api/room/health');
  try { return JSON.parse(r.body); } catch { return null; }
}

async function bootstrapRoom() {
  // reset returns snapshot() with the fresh PIN in state.pin — this is exactly
  // what a browser receives on the events stream, no secret involved.
  const r = await action('reset');
  if (r.status !== 200 || !r.json?.state?.pin) throw new Error(`reset failed: ${r.status} ${r.body}`);
  return r.json.state.pin;
}

// Move the room to chapter 2 lobby so students can join.
async function openLobby() { await action('changeChapter', { chapter: 2 }); }

// Open the "digital" activity (chapter 2, step 1) and flip presentation to
// activity mode, which is what actually opens the answer window server-side.
async function openDigitalQuestion() {
  await action('changeStep', { step: 1 });
  await action('presentation', { chapter: 2, step: 1, mode: 'activity' });
}

// Join N students during the lobby; returns their tokens.
async function joinClass(n, metric) {
  const tokens = [];
  await pool(
    Array.from({ length: n }, (_, i) => i),
    async i => {
      const r = await action('join', { name: `bot${i}`, pin: PIN });
      if (metric) metric.add(r.ms, r.status);
      if (r.json?.studentToken) tokens.push(r.json.studentToken);
    },
    Math.min(256, n)
  );
  return tokens;
}

let PIN = null;

// ---- scenarios ------------------------------------------------------------

async function scSmoke() {
  const m = new Metric('smoke: join + vote');
  await openLobby();
  const tokens = await joinClass(5, m);
  await openDigitalQuestion();
  await Promise.all(tokens.map(async t => { const r = await action('digitalVote', { option: '2_states' }, t); m.add(r.ms, r.status); }));
  return [printMetric(m)];
}

async function scJoinStorm() {
  await openLobby();
  const m = new Metric(`join-storm: ${STUDENTS} students`);
  const t0 = performance.now();
  await pool(
    Array.from({ length: STUDENTS }, (_, i) => i),
    async i => { const r = await action('join', { name: `bot${i}`, pin: PIN }); m.add(r.ms, r.status); },
    Math.min(512, STUDENTS)
  );
  return [printMetric(m, (performance.now() - t0) / 1000)];
}

async function scAnswerStorm() {
  await openLobby();
  const join = new Metric(`answer-storm: join ${STUDENTS}`);
  const tokens = await joinClass(STUDENTS, join);
  await openDigitalQuestion();
  const m = new Metric(`answer-storm: ${tokens.length} simultaneous votes`);
  // Fire every vote at once — the worst case the 200ms broadcast coalescing exists for.
  await Promise.all(tokens.map(async t => { const r = await action('digitalVote', { option: pick(['2_states', '10_states', 'infinite', 'none']) }, t); m.add(r.ms, r.status); }));
  printMetric(join);
  return [printMetric(m)];
}

async function scEmojiFlood() {
  await openLobby();
  const join = new Metric(`emoji-flood: join ${STUDENTS}`);
  const tokens = await joinClass(STUDENTS, join);
  printMetric(join);
  const m = new Metric(`emoji-flood: ${tokens.length} students @ ${RATE}/s for ${DURATION_S}s`);
  const deadline = performance.now() + DURATION_S * 1000;
  const interval = 1000 / RATE;
  await Promise.all(tokens.map(async t => {
    while (performance.now() < deadline) {
      const s = performance.now();
      const r = await action('emoji', { emoji: pick(EMOJIS) }, t);
      m.add(r.ms, r.status);
      const wait = interval - (performance.now() - s);
      if (wait > 0) await sleep(wait);
    }
  }));
  return [printMetric(m)];
}

async function scReadFlood() {
  const m = new Metric(`read-flood: GET /health @ ${CONCURRENCY} for ${DURATION_S}s`);
  const deadline = performance.now() + DURATION_S * 1000;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (performance.now() < deadline) { const r = await request('GET', '/api/room/health'); m.add(r.ms, r.status); }
  }));
  return [printMetric(m)];
}

async function scSseHold() {
  await openLobby();
  const n = STUDENTS;
  const connect = new Metric(`sse-hold: open ${n} streams`);
  const streams = [];
  let frames = 0;
  let markerSeen = 0;
  let markerAt = 0;
  const onFrame = data => {
    frames++;
    if (markerAt && data.includes(`"demoValue":${MARKER}`)) markerSeen++;
  };
  const MARKER = 37; // an unusual demoValue we can watch propagate to every stream
  await pool(
    Array.from({ length: n }, (_, i) => i),
    async () => {
      const s0 = performance.now();
      try { const st = await openStream('/api/room/events', { onFrame }); streams.push(st); connect.add(performance.now() - s0, 200); }
      catch (e) { connect.add(performance.now() - s0, `ERR:${e.message}`); }
    },
    Math.min(200, n) // open in waves so we don't SYN-flood our own client
  );
  printMetric(connect);

  // Now push ONE teacher update and watch it fan out to every held stream.
  console.log(`\n  ⏱  broadcasting one update to ${streams.length} streams …`);
  markerAt = performance.now();
  await action('changeStep', { step: 1 });
  await action('presentation', { chapter: 2, step: 1, mode: 'activity', slide: 0 });
  await action('presentation', { chapter: 2, step: 1, demoValue: MARKER, forSlide: 0 });
  await sleep(2000); // broadcast coalesces on a 200ms timer; give it room
  const deliverMs = markerSeen ? (performance.now() - markerAt) : null;
  console.log(`      fan-out    ${markerSeen}/${streams.length} streams got the update` +
    (deliverMs ? ` within ~${fmt(deliverMs)}ms` : ' (not observed — check server)'));
  console.log(`      frames     ${frames} total frames received across all streams`);

  const h = await health();
  console.log(`      server     reports ${h?.streams ?? '?'} open streams, uptime ${h?.uptimeSeconds ?? '?'}s`);
  for (const s of streams) s.close();
  await sleep(200);
  return [connect.summary(), { name: 'sse-fanout', opened: streams.length, delivered: markerSeen, frames, serverStreams: h?.streams }];
}

async function scClassroom() {
  const summaries = [];
  console.log(`\n  🎓 Simulating a class of ${STUDENTS} on ${TARGET}`);

  await openLobby();
  const join = new Metric('1. join (class arrives)');
  const tokens = await joinClass(STUDENTS, join);
  summaries.push(printMetric(join));

  // Every student holds an event stream, like a phone left on the join screen.
  const connect = new Metric('2. open event stream (phones connect)');
  const streams = [];
  await pool(tokens, async () => {
    const s0 = performance.now();
    try { streams.push(await openStream('/api/room/events')); connect.add(performance.now() - s0, 200); }
    catch (e) { connect.add(performance.now() - s0, `ERR:${e.message}`); }
  }, 200);
  summaries.push(printMetric(connect));

  await openDigitalQuestion();

  const vote = new Metric('3. answer question (all at once)');
  await Promise.all(tokens.map(async t => { const r = await action('digitalVote', { option: pick(['2_states', '10_states', 'infinite', 'none']) }, t); vote.add(r.ms, r.status); }));
  summaries.push(printMetric(vote));

  const emoji = new Metric(`4. reactions (${DURATION_S}s @ ${RATE}/s each)`);
  const deadline = performance.now() + DURATION_S * 1000;
  const interval = 1000 / RATE;
  await Promise.all(tokens.map(async t => {
    while (performance.now() < deadline) {
      const s = performance.now();
      const r = await action('emoji', { emoji: pick(EMOJIS) }, t);
      emoji.add(r.ms, r.status);
      const wait = interval - (performance.now() - s);
      if (wait > 0) await sleep(wait);
    }
  }));
  summaries.push(printMetric(emoji));

  const h = await health();
  console.log(`\n  🩺 server after test: uptime ${h?.uptimeSeconds}s, open streams ${h?.streams}, students ${h?.students}, revision ${h?.revision}`);
  for (const s of streams) s.close();
  await sleep(200);
  return summaries;
}

// ---- runner ---------------------------------------------------------------

const SCENARIOS = {
  smoke: scSmoke, classroom: scClassroom, 'join-storm': scJoinStorm,
  'answer-storm': scAnswerStorm, 'emoji-flood': scEmojiFlood,
  'read-flood': scReadFlood, 'sse-hold': scSseHold,
};

function interpret(all) {
  console.log('\n' + '─'.repeat(64));
  console.log('  📋 Report');
  const flat = all.flat().filter(s => s && s.name);
  let anyErr = false, anySlow = false;
  for (const s of flat) {
    if (s.errors > 0) { anyErr = true; console.log(`  ⚠️  ${s.name}: ${s.errors} hard errors (5xx / connection / timeout) — reliability issue.`); }
    if (s.p99 > 1000) { anySlow = true; console.log(`  🐢 ${s.name}: p99 ${fmt(s.p99)}ms — tail latency high under this load.`); }
    if (s.throttled_429 > 0) console.log(`  🛡  ${s.name}: ${s.throttled_429} requests hit the 429 rate limit (expected — that guard is working).`);
    if (s.delivered !== undefined && s.opened && s.delivered < s.opened)
      console.log(`  📡 ${s.name}: only ${s.delivered}/${s.opened} streams received the broadcast — possible fan-out loss.`);
    if (s.serverStreams !== undefined && s.opened && s.serverStreams > s.opened * 1.2)
      console.log(`  🔎 ${s.name}: server still reports ${s.serverStreams} streams after opening ${s.opened} — check for leaked connections.`);
  }
  if (!anyErr) console.log('  ✅ No hard errors — server stayed up and answered every request (some 429s are just the rate limiter).');
  if (!anySlow) console.log('  ✅ Tail latency (p99) stayed under 1s across scenarios.');
  console.log('\n  Reminder: 429 = the per-student(20/3s) / shared-IP(1000/3s) limiter doing its job.');
  console.log('  All bots share one IP (127.0.0.1), so a big join-storm hits the shared 1000/3s');
  console.log('  bucket — the exact "whole class behind school NAT" case the code comments call out.');
  console.log('─'.repeat(64) + '\n');
}

async function main() {
  console.log(`\n🎯 target ${TARGET}  •  scenario "${scenario}"  •  ${new Date().toISOString()}`);
  const h = await health();
  if (!h?.ok) {
    console.error(`\n❌ Can't reach ${TARGET}/api/room/health.`);
    console.error('   Start the server first, then re-run. For the production build:');
    console.error('     npm run build && node app.js            # port 3000');
    console.error('   or the dev server (targets port 5173):');
    console.error('     npm run dev  →  --target http://127.0.0.1:5173\n');
    process.exit(1);
  }
  console.log(`   server up: uptime ${h.uptimeSeconds}s, students ${h.students}, streams ${h.streams}, trustProxy ${h.trustProxy}`);

  PIN = await bootstrapRoom();
  console.log(`   room reset — PIN ${PIN}\n`);

  const list = scenario === 'all' ? ['smoke', 'read-flood', 'join-storm', 'answer-storm', 'emoji-flood', 'sse-hold'] : [scenario];
  if (!list.every(s => SCENARIOS[s])) { console.error(`Unknown scenario "${scenario}". Options: ${Object.keys(SCENARIOS).join(', ')}, all`); process.exit(1); }

  const all = [];
  for (const name of list) {
    if (list.length > 1) console.log(`\n╔═ ${name} ${'═'.repeat(Math.max(0, 56 - name.length))}`);
    all.push(await SCENARIOS[name]());
    if (list.length > 1) { PIN = await bootstrapRoom(); await sleep(300); } // clean slate between scenarios
  }

  interpret(all);

  if (JSON_OUT && typeof JSON_OUT === 'string') {
    const report = { target: TARGET, scenario, at: new Date().toISOString(), config: { STUDENTS, DURATION_S, CONCURRENCY, RATE }, results: all.flat() };
    writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));
    console.log(`  💾 machine report → ${JSON_OUT}\n`);
  }
}

main().then(() => process.exit(0)).catch(err => { console.error('\n💥 harness error:', err); process.exit(1); });
