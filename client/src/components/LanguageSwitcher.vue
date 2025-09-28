<template>
  <v-menu offset-y>
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        variant="outlined"
        size="small"
        class="language-btn"
        :title="$t('common.language')"
      >
        <v-icon left>mdi-web</v-icon>
        <span class="language-text">{{ (currentLanguage || 'en').toUpperCase() }}</span>
        <v-icon right size="small">mdi-chevron-down</v-icon>
      </v-btn>
    </template>

    <v-list density="compact" class="language-menu">
      <v-list-item
        v-for="lang in availableLanguages"
        :key="lang.code"
        @click="switchLanguage(lang.code)"
        :active="lang.code === currentLanguage"
        class="language-option"
      >
        <template v-slot:prepend>
          <span class="flag me-2">{{ lang.flag }}</span>
        </template>
        <v-list-item-title>{{ lang.name }}</v-list-item-title>
        <template v-slot:append v-if="lang.code === currentLanguage">
          <v-icon color="primary" size="small">mdi-check</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRtl } from 'vuetify'

const { locale } = useI18n()
const { isRtl } = useRtl()

const availableLanguages = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'ar',
    name: 'العربية',
    flag: '🇸🇦'
  }
]

const currentLanguage = computed({
  get: () => locale.value || 'en',
  set: (newLang) => {
    locale.value = newLang
    localStorage.setItem('language', newLang)
  }
})

function switchLanguage(langCode) {

  // Update locale
  currentLanguage.value = langCode

  // Update Vuetify RTL
  isRtl.value = langCode === 'ar'

  // Update document title based on current route
  updateDocumentTitle(langCode)

  // Update document direction and RTL class immediately
  updateDocumentDirection(langCode)

  // Dispatch language change event for other components
  window.dispatchEvent(new CustomEvent('language-changed', {
    detail: { language: langCode, isRtl: langCode === 'ar' }
  }))

  // Force Vue app re-render by updating both HTML attributes and Vue app state
  setTimeout(() => {
    // Ensure Vue app updates properly
    const app = document.getElementById('app')
    if (app) {
      if (langCode === 'ar') {
        app.classList.add('rtl')
        app.setAttribute('dir', 'rtl')
      } else {
        app.classList.remove('rtl')
        app.setAttribute('dir', 'ltr')
      }
    }

    // Update Vuetify application class
    const vApp = document.querySelector('.v-application')
    if (vApp) {
      if (langCode === 'ar') {
        vApp.classList.add('v-application--is-rtl')
        vApp.setAttribute('dir', 'rtl')
      } else {
        vApp.classList.remove('v-application--is-rtl')
        vApp.setAttribute('dir', 'ltr')
      }
    }

    // Force Vuetify body class
    if (langCode === 'ar') {
      document.body.classList.add('v-application--is-rtl')
    } else {
      document.body.classList.remove('v-application--is-rtl')
    }

    // Force layout recalculation with more aggressive reflow
    const elements = document.querySelectorAll('.v-card, .v-container, .v-row, .v-col, .v-btn, .v-list-item, .v-app-bar, .v-toolbar, .v-field, .v-text-field, .v-select, .v-chip')
    elements.forEach(el => {
      el.style.display = 'none'
      el.offsetHeight // Force reflow
      el.style.display = ''
    })

    // Force complete re-render of the Vue application
    window.dispatchEvent(new Event('resize'))

  }, 50)
}

function updateDocumentTitle(langCode) {
  const currentPath = window.location.pathname
  const getPageTitle = (path, lang) => {
    const titles = {
      en: {
        '/tasks': 'Tasks - 3DDX',
        '/login': 'Login - 3DDX',
        '/register': 'Register - 3DDX',
        '/admin': 'Admin - 3DDX',
        '/': 'Tasks - 3DDX'
      },
      ar: {
        '/tasks': 'المهام - 3DDX',
        '/login': 'تسجيل الدخول - 3DDX',
        '/register': 'إنشاء حساب - 3DDX',
        '/admin': 'الإدارة - 3DDX',
        '/': 'المهام - 3DDX'
      }
    }

    const safeLang = lang && titles[lang] ? lang : 'en'
    const safePath = path || '/'

    return titles[safeLang][safePath] || titles[safeLang]['/'] || 'Tasks - 3DDX'
  }

  document.title = getPageTitle(currentPath, langCode)
}

function updateDocumentDirection(langCode) {
  const html = document.documentElement

  if (langCode === 'ar') {
    html.setAttribute('lang', 'ar')
    html.setAttribute('dir', 'rtl')
    html.classList.add('rtl')
  } else {
    html.setAttribute('lang', 'en')
    html.setAttribute('dir', 'ltr')
    html.classList.remove('rtl')
  }
}

// Initialize RTL on component mount
onMounted(() => {
  // Add small delay to ensure Vue router and Vuetify are fully initialized
  setTimeout(() => {
    try {
      const savedLanguage = localStorage.getItem('language') || 'en'
      if (savedLanguage === 'ar') {

        // Set i18n locale
        if (locale && locale.value !== undefined) {
          locale.value = 'ar'
        }

        // Set Vuetify RTL
        if (isRtl && isRtl.value !== undefined) {
          isRtl.value = true
        }

        // Apply document classes
        updateDocumentDirection('ar')

      }
    } catch (error) {
      console.warn('⚠️ Error initializing RTL on mount:', error)
    }
  }, 50)
})
</script>

<style scoped>
.language-btn {
  font-size: 11px !important;
}

.language-text {
  font-size: 11px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.flag {
  font-size: 16px;
  line-height: 1;
}

.language-menu {
  min-width: 140px;
}

/* RTL Support */
:deep(.v-list-item__prepend) {
  margin-inline-end: 8px !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .language-text {
    display: none;
  }
  
  .language-menu {
    min-width: 120px;
  }
}
</style>
