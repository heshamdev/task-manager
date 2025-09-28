<template>
  <v-btn
    @click="toggleTheme"
    variant="outlined"
    size="small"
    class="theme-btn"
    :title="currentTheme === 'dark' ? ($t('theme.switchToLight') || 'Switch to light mode') : ($t('theme.switchToDark') || 'Switch to dark mode')"
  >
    <v-icon>{{ themeIcon }}</v-icon>
    <span class="theme-text d-none d-sm-inline">{{ themeText }}</span>
  </v-btn>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const theme = useTheme()

// Initialize theme from localStorage or default to light
const currentTheme = ref(localStorage.getItem('theme') || 'light')

// Set initial theme
onMounted(() => {
  applyTheme(currentTheme.value)
})

// Computed properties for theme display
const themeIcon = computed(() => {
  return currentTheme.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'
})

const themeText = computed(() => {
  if (currentTheme.value === 'dark') {
    return t('theme.light') || 'Light'
  } else {
    return t('theme.dark') || 'Dark'
  }
})

function toggleTheme() {
  const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
  currentTheme.value = newTheme
  applyTheme(newTheme)

  // Save to localStorage
  localStorage.setItem('theme', newTheme)

  // Dispatch theme change event
  window.dispatchEvent(new CustomEvent('theme-changed', {
    detail: { theme: newTheme }
  }))

}

function applyTheme(themeName) {
  theme.change(themeName)

  // Update document classes for theme
  const html = document.documentElement
  const body = document.body

  if (themeName === 'dark') {
    html.classList.add('dark-theme')
    html.classList.remove('light-theme')
    body.classList.add('dark-theme')
    body.classList.remove('light-theme')
  } else {
    html.classList.add('light-theme')
    html.classList.remove('dark-theme')
    body.classList.add('light-theme')
    body.classList.remove('dark-theme')
  }

  // Force Vuetify theme update
  const vApp = document.querySelector('.v-application')
  if (vApp) {
    vApp.classList.toggle('v-theme--dark', themeName === 'dark')
    vApp.classList.toggle('v-theme--light', themeName === 'light')
  }

  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(themeName)

  // Force layout recalculation for theme change
  setTimeout(() => {
    const elements = document.querySelectorAll('.v-card, .v-app-bar, .task-form-card, .tasks-list-card')
    elements.forEach(el => {
      el.style.display = 'none'
      el.offsetHeight // Force reflow
      el.style.display = ''
    })
  }, 50)
}

function updateMetaThemeColor(themeName) {
  let metaThemeColor = document.querySelector('meta[name="theme-color"]')

  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta')
    metaThemeColor.name = 'theme-color'
    document.head.appendChild(metaThemeColor)
  }

  // Set theme color based on current theme
  const colors = {
    light: '#ffffff',
    dark: '#1e1e1e'
  }

  metaThemeColor.content = colors[themeName] || colors.light
}</script>

<style scoped>
.theme-btn {
  font-size: 11px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-btn:hover {
  transform: scale(1.05);
}

.theme-text {
  font-size: 11px;
  font-weight: 600;
  margin-left: 4px;
  text-transform: uppercase;
}

/* RTL Support */
.rtl .theme-text {
  margin-left: 0;
  margin-right: 4px;
}

/* Theme transition animations */
.theme-btn .v-icon {
  transition: transform 0.3s ease, color 0.3s ease;
}

.theme-btn:hover .v-icon {
  transform: rotate(15deg);
}

/* Responsive Design */
@media (max-width: 768px) {
  .theme-text {
    display: none !important;
  }

  .theme-btn {
    min-width: 40px !important;
  }
}
</style>