import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ✅ ADD THIS BLOCK
  preview: {
    host: '0.0.0.0',
    port: 10000,
    allowedHosts: ['kit-crm-frontend-app.onrender.com'],
  },
})