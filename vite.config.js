import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv con prefijo '' lee .env/.env.local para que VITE_API_TARGET funcione también aquí (config de Node)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5400,
      proxy: {
        '/api': {
          target: process.env.VITE_API_TARGET || env.VITE_API_TARGET || 'http://localhost:8001',
          changeOrigin: true,
        }
      }
    }
  }
})
