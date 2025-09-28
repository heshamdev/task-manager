import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import vuetify from './plugins/vuetify'

// Import professional Arabic typography styles
import './styles/arabic-typography.css'

// Import global spacing system
import './styles/spacing.css'


// Function to update document title based on language and current route
function updateDocumentTitle(locale, routePath = '/') {
  const getPageTitle = (path, lang) => {
    const titles = {
      en: {
        '/tasks': 'Tasks - 3DDX',
        '/login': 'Login - 3DDX', 
        '/register': 'Register - 3DDX',
        '/': 'Tasks - 3DDX'
      },
      ar: {
        '/tasks': 'المهام - 3DDX',
        '/login': 'تسجيل الدخول - 3DDX',
        '/register': 'إنشاء حساب - 3DDX',
        '/': 'المهام - 3DDX'
      }
    }
    
    // Ensure lang and path are valid
    const safeLang = lang && titles[lang] ? lang : 'en'
    const safePath = path || '/'
    
    return titles[safeLang][safePath] || titles[safeLang]['/'] || 'Tasks - 3DDX'
  }
  
  document.title = getPageTitle(routePath, locale)
}

// Function to update document direction and RTL class
function updateDocumentDirection(locale) {
  const html = document.documentElement
  if (locale === 'ar') {
    html.setAttribute('lang', 'ar')
    html.setAttribute('dir', 'rtl')
    html.classList.add('rtl')
  } else {
    html.setAttribute('lang', 'en')
    html.setAttribute('dir', 'ltr')
    html.classList.remove('rtl')
  }
}

// Apply initial direction
const savedLanguage = localStorage.getItem('language') || 'en'
if (savedLanguage === 'ar') {
  i18n.global.locale = 'ar'
}
updateDocumentDirection(i18n.global.locale)

// VeeValidate
import { Field, Form, ErrorMessage, defineRule, configure } from 'vee-validate'
import { required, email, min, max, confirmed } from '@vee-validate/rules'
import { localize } from '@vee-validate/i18n'

// Vue Loading Overlay
import { LoadingPlugin } from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/css/index.css'

// Define validation rules
defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('confirmed', confirmed)

// Custom password complexity validation
defineRule('passwordComplexity', (value) => {
  if (!value) return true // Let required rule handle empty values

  const hasLowercase = /[a-z]/.test(value)
  const hasUppercase = /[A-Z]/.test(value)
  const hasNumber = /\d/.test(value)
  const hasMinLength = value.length >= 6

  if (!hasMinLength || !hasLowercase || !hasUppercase || !hasNumber) {
    return i18n.global.t('validation.passwordComplexity')
  }

  return true
})

// Enhanced validation rule for future dates with i18n support
defineRule('futureDate', (value) => {
  if (!value) return true // Allow empty values (use required rule separately)

  const selectedDate = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day
  selectedDate.setHours(0, 0, 0, 0) // Reset time to start of selected day

  // Check if date is valid
  if (isNaN(selectedDate.getTime())) {
    return i18n.global.t('validation.invalidDate')
  }

  // Check if date is not in the past (allow today and future dates)
  if (selectedDate < today) {
    return i18n.global.t('validation.pastDate')
  }

  // Check if date is not too far in the future (optional - prevent unrealistic dates)
  const maxDate = new Date(today)
  maxDate.setFullYear(today.getFullYear() + 5) // 5 years max

  if (selectedDate > maxDate) {
    return i18n.global.t('validation.futureDateTooFar')
  }

  return true
})
defineRule('validDate', (value) => {
  if (!value) return true // Allow empty values

  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return i18n.global.t('validation.invalidDate')
  }

  return true
})

// Configure VeeValidate with i18n integration
configure({
  generateMessage: (ctx) => {
    const fieldName = i18n.global.t('validation.fields.' + ctx.field) || ctx.field
    
    const messages = {
      required: i18n.global.t('validation.required', { field: fieldName }),
      email: i18n.global.t('validation.email'),
      min: i18n.global.t('validation.min', { field: fieldName, length: ctx.rule.params[0] }),
      max: i18n.global.t('validation.max', { field: fieldName, length: ctx.rule.params[0] }),
      confirmed: i18n.global.t('validation.confirmed', { field: fieldName }),
      passwordComplexity: i18n.global.t('validation.passwordComplexity'),
      futureDate: i18n.global.t('validation.futureDate'),
      validDate: i18n.global.t('validation.invalidDate')
    }
    
    return messages[ctx.rule.name] || `The ${fieldName} is invalid`
  }
})

const app = createApp(App)

// Register VeeValidate components globally
app.component('VeeForm', Form)
app.component('VeeField', Field)
app.component('VeeErrorMessage', ErrorMessage)

// Register Vue Loading Overlay
app.use(LoadingPlugin, {
  // Default options
  color: '#1ebbf0',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  blur: '2px',
  opacity: 0.9,
  zIndex: 999,
  enforceFocus: true,
  lockScroll: true,
  transition: 'fade'
})

app.use(router)
app.use(i18n)
app.use(vuetify)

// Initialize theme after app is mounted
setTimeout(() => {
  // Initialize theme
  const savedTheme = localStorage.getItem('theme') || 'light'
  const html = document.documentElement
  const body = document.body

  if (savedTheme === 'dark') {
    html.classList.add('dark-theme')
    body.classList.add('dark-theme')
  } else {
    html.classList.add('light-theme')
    body.classList.add('light-theme')
  }

}, 100)


// Verify plugins are installed

// Apply initial title with current route
const initialLocale = i18n?.global?.locale || 'en'
const initialPath = window.location.pathname || '/'
updateDocumentTitle(initialLocale, initialPath)

// Watch for route changes and update title
router.afterEach((to) => {
  const currentLocale = i18n?.global?.locale || 'en'
  const path = to?.path || '/'
  updateDocumentTitle(currentLocale, path)
})

app.mount('#app')

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Service worker registered successfully
      })
      .catch((registrationError) => {
        // Service worker registration failed
      })
  })
}

