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
        target: 'https://task-manager-q8bv.onrender.com/',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
