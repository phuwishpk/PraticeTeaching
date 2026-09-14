import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRoomApi } from './server/roomApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// ดึง API ที่เขียนไว้มาใช้
const api = createRoomApi();
app.use((req, res, next) => {
  api.middleware(req, res, next);
});

// เสิร์ฟไฟล์ Static ของ React ที่ Build แล้ว
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: ให้ React Router จัดการ Path แทน (กรณีคนกด Refresh หน้าเว็บ)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
