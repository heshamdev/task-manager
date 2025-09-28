import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Simple vite config with Vue plugin
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3002,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4002',
        changeOrigin: true,
        secure: false
      }
    }
  }
})