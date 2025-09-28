import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let vuePlugin
try {
  const vue = require('@vitejs/plugin-vue')
  vuePlugin = vue.default || vue
} catch (e) {
  console.warn('Vue plugin not found, using basic config')
  vuePlugin = null
}

export default {
  plugins: vuePlugin ? [vuePlugin()] : [],
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
}
