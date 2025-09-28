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
        <span class="language-text">{{ currentLanguage.toUpperCase() }}</span>
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

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
  get: () => locale.value,
  set: (newLang) => {
    locale.value = newLang
    localStorage.setItem('language', newLang)
  }
})

function switchLanguage(langCode) {
  console.log(`🌐 Switching language to: ${langCode}`)
  currentLanguage.value = langCode

  // Update document title based on current route
  const currentPath = window.location.pathname
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
  
  document.title = getPageTitle(currentPath, langCode)
  console.log('📄 Document title updated:', document.title)

  // Force DOM update for RTL
  setTimeout(() => {
    const html = document.documentElement
    console.log('Current HTML classes:', html.classList.toString())
    console.log('Current HTML dir:', html.getAttribute('dir'))
    console.log('Current HTML lang:', html.getAttribute('lang'))

    if (langCode === 'ar') {
      html.setAttribute('lang', 'ar')
      html.setAttribute('dir', 'rtl')
      html.classList.add('rtl')
      console.log('✅ RTL applied to document')
    } else {
      html.setAttribute('lang', 'en')
      html.setAttribute('dir', 'ltr')
      html.classList.remove('rtl')
      console.log('✅ LTR applied to document')
    }
  }, 100)
}
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
