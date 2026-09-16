import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRoomApi } from './server/roomApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// ดึง API ที่เขียนไว้มาใช้ พร้อมบันทึกสถานะห้องลงไฟล์ ห้องจะได้ไม่หายถ้าเซิร์ฟเวอร์รีสตาร์ตกลางคาบ
// (โหมด dev ไม่บันทึก จะได้เริ่มห้องใหม่ทุกครั้งที่แก้โค้ด)
const api = createRoomApi({
  persistPath: process.env.ROOM_STATE_FILE || path.join(__dirname, '.room-state.json'),
});
app.use((req, res, next) => {
  // Not awaiting this used to mean any rejection became an unhandled rejection, which Node
  // answers by ending the process — one bad request dropped the entire class.
  Promise.resolve(api.middleware(req, res, next)).catch(next);
});

// เสิร์ฟไฟล์ Static ของ React ที่ Build แล้ว
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: ให้ React Router จัดการ Path แทน (กรณีคนกด Refresh หน้าเว็บ)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Last line of defence. Exiting on these is the usual advice, but here it costs a whole
// class their lesson mid-activity; the room is written to disk, so staying up and logging
// loudly is the better trade. Anything reaching here is a bug worth reading in the logs.
process.on('uncaughtException', error => {
  console.error('[server] uncaughtException — เซิร์ฟเวอร์ยังทำงานต่อ:', error);
});
process.on('unhandledRejection', reason => {
  console.error('[server] unhandledRejection — เซิร์ฟเวอร์ยังทำงานต่อ:', reason);
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  // These two are fine to leave unset on a laptop and wrong to leave unset on a host, so
  // the warning belongs where whoever deployed it will actually read it.
  if (!process.env.PUBLIC_ORIGIN) {
    console.warn('  ⚠️  ไม่ได้ตั้ง PUBLIC_ORIGIN — QR code อาจชี้เป็น http:// ทำให้นักเรียนสแกนแล้วเข้าไม่ได้');
  }
  if (!process.env.TRUST_PROXY) {
    console.log('  ℹ️  ถ้า deploy หลัง proxy (Render/Railway/Cloudflare) ให้ตั้ง TRUST_PROXY=1');
  }
  console.log(`  🩺 ตรวจสถานะห้องได้ที่ /api/room/health`);
});

// A phone on a failing connection can open a request and then send almost nothing. Without
// these, each one holds a socket for five minutes; a classroom of them starves the server.
server.headersTimeout = 15000;
server.requestTimeout = 20000;

// Hosting platforms stop a process with a signal, so the room is written out on the way
// down rather than only on the debounce timer.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    api.close();
    // Idle keep-alive sockets would otherwise hold the close open for seconds, and hosting
    // platforms do not wait that long before killing the process outright.
    server.closeAllConnections?.();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}
