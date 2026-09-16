import { createServer } from 'node:http';
import { connect } from 'node:net';
import { createRoomApi } from './server/roomApi.js';

process.on('uncaughtException', e => { console.log(`\n💥 UNCAUGHT EXCEPTION → โปรเซสตาย: ${e.code || e.name}: ${e.message}`); process.exit(9); });
process.on('unhandledRejection', e => { console.log(`\n💥 UNHANDLED REJECTION → โปรเซสตาย: ${e?.message}`); process.exit(9); });

const api = createRoomApi();
const server = createServer((req, res) => api.middleware(req, res));
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const post = (t, p, h = {}) => fetch(`http://127.0.0.1:${port}/api/room/actions`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...h }, body: JSON.stringify({ type: t, payload: p }) });

// นักเรียน 20 เครื่องเปิด SSE ค้างไว้ แบบ raw socket เพื่อจะตัดดิบ ๆ ได้
const sockets = [];
for (let i = 0; i < 20; i++) {
  const s = connect(port, '127.0.0.1');
  s.on('error', () => {});
  s.write('GET /api/room/events HTTP/1.1\r\nHost: x\r\nConnection: keep-alive\r\n\r\n');
  sockets.push(s);
}
await new Promise(r => setTimeout(r, 400));
console.log(`เปิด SSE ค้างไว้ ${sockets.length} เครื่อง`);

// เน็ตหลุดกะทันหัน: ตัดสายแบบ RST ไม่ใช่ปิดสวย ๆ
for (const s of sockets) s.destroy();
console.log('ตัดสัญญาณทุกเครื่องแบบกะทันหัน (RST) แล้วสั่ง broadcast ทันที');

for (let i = 0; i < 12; i++) { await post('changeStep', { step: i % 3 }); }
await new Promise(r => setTimeout(r, 1200));
console.log('\n✅ เซิร์ฟเวอร์ยังอยู่ ไม่ตาย');
api.close(); server.closeAllConnections(); server.close(); process.exit(0);
