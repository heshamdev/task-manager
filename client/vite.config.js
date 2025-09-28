import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite config with Vue plugin - configured for local development
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    host: true,
    strictPort: true  // Exit if port 8080 is unavailable instead of trying other ports
    // No proxy - using local backend at localhost:3000
  }
})
