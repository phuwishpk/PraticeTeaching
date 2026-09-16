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
  api.middleware(req, res, next);
});

// เสิร์ฟไฟล์ Static ของ React ที่ Build แล้ว
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: ให้ React Router จัดการ Path แทน (กรณีคนกด Refresh หน้าเว็บ)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Hosting platforms stop a process with a signal, so the room is written out on the way
// down rather than only on the debounce timer.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    api.close();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}
