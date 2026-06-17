import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Directs any frontend fetch starting with '/api' to your running Express backend
      '/api': {
        target: 'http://localhost:5000', // 🌟 Change this to http://localhost:8000 if your server uses port 8000!
        changeOrigin: true,
        secure: false,
      }
    }
  }
})