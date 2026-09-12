import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { roomSyncPlugin } from './server/roomApi.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), roomSyncPlugin()],
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' },
})
