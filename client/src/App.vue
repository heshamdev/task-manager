<template>
  <v-app :class="{ 'rtl': ($i18n?.locale === 'ar') }">
    <v-app-bar 
      color="surface" 
      elevation="1"
      app
    >
      <v-container class="header-container">
        <div class="logo" :class="{ 'logo-clickable': isAuthenticated }" @click="handleLogoClick">
          <img src="./assets/3ddx-official-logo.png" alt="3DDX Logo" class="logo-image" />
          <span class="logo-text">{{ $t ? $t('brand.name') : 'Task Manager' }}</span>
        </div>

        <v-spacer></v-spacer>

        <div class="header-icons">
          <!-- Theme Switcher -->
          <ThemeSwitcher />

          <!-- Language Switcher -->
          <LanguageSwitcher />

          <!-- Navigation for Authenticated Users -->
          <v-btn
            v-if="isAuthenticated"
            :to="{ path: '/tasks' }"
            variant="text"
            prepend-icon="mdi-clipboard-list"
            class="auth-btn"
          >
            {{ $t ? $t('nav.tasks') : 'TASKS' }}
          </v-btn>

          <!-- Admin Navigation -->
          <v-btn
            v-if="isAuthenticated && isUserAdmin"
            :to="{ path: '/admin' }"
            variant="text"
            prepend-icon="mdi-shield-account"
            class="auth-btn"
            color="warning"
          >
            {{ $t ? $t('nav.admin') : 'ADMIN' }}
          </v-btn>

          <!-- Logout for Authenticated Users -->
          <v-btn
            v-if="isAuthenticated"
            @click="logout"
            variant="text"
            prepend-icon="mdi-logout"
            class="auth-btn"
          >
            {{ $t ? $t('auth.logout') : 'LOGOUT' }}
          </v-btn>
        </div>
      </v-container>
    </v-app-bar>

    <v-main>
      <div class="main-content">
        <RouterView />
      </div>
    </v-main>
    
    <!-- Global Loading Provider -->
    <LoadingProvider />
  </v-app>
</template>

<script setup>
import { RouterView, useRouter } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import LoadingProvider from './components/LoadingProvider.vue'

const router = useRouter()
const authToken = ref(localStorage.getItem('token'))
const isAuthenticated = computed(() => !!authToken.value)

// Check if user is admin
const isUserAdmin = computed(() => {
  if (!authToken.value) return false

  try {
    const payload = JSON.parse(atob(authToken.value.split('.')[1]))
    // Check for multiple possible admin flags
    return payload.isAdmin === true || payload.role === 'admin' || payload.admin === true
  } catch (error) {
    console.error('Error decoding JWT token:', error)
    return false
  }
})

// Function to update auth state
function updateAuthState() {
  authToken.value = localStorage.getItem('token')
}

// Listen for authentication events
function handleAuthEvent() {
  updateAuthState()
}

// Listen for language changes
function handleLanguageChange(event) {
  // Force component re-render if needed
}

// Listen for theme changes
function handleThemeChange(event) {
  // Additional theme handling if needed
}

onMounted(() => {
  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'light'
  const html = document.documentElement
  const body = document.body

  if (savedTheme === 'dark') {
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

  // Initialize RTL if Arabic is saved
  const savedLanguage = localStorage.getItem('language')
  if (savedLanguage === 'ar') {
    setTimeout(() => {
      // Force RTL application
      document.body.classList.add('v-application--is-rtl')
      document.documentElement.classList.add('rtl')
      document.documentElement.setAttribute('dir', 'rtl')

      const vApp = document.querySelector('.v-application')
      if (vApp) {
        vApp.classList.add('v-application--is-rtl')
        vApp.setAttribute('dir', 'rtl')
      }

    }, 100)
  }

  // Listen for custom auth events
  window.addEventListener('auth-changed', handleAuthEvent)
  // Listen for language changes
  window.addEventListener('language-changed', handleLanguageChange)
  // Listen for theme changes
  window.addEventListener('theme-changed', handleThemeChange)
  // Also listen for storage events (in case of multiple tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      updateAuthState()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('auth-changed', handleAuthEvent)
  window.removeEventListener('language-changed', handleLanguageChange)
  window.removeEventListener('theme-changed', handleThemeChange)
  window.removeEventListener('storage', handleAuthEvent)
})

function logout() {
  localStorage.removeItem('token')
  authToken.value = null
  // Dispatch auth change event
  window.dispatchEvent(new CustomEvent('auth-changed'))
  router.push('/login')
}

function handleLogoClick() {
  // Only navigate if user is authenticated
  if (isAuthenticated.value) {
    router.push('/tasks')
  }
  // If not authenticated, do nothing (logo is not clickable)
}
</script>

<style>
/* 3DDX Color Scheme Variables */
:root {
  --the7-accent-color: #1ebbf0;
  --the7-accent-bg-2: #39dfaa;
  --the7-accent-gradient: linear-gradient(135deg, #1ebbf0 30%, #39dfaa 100%);
  --the7-base-font-family: 'HelveticaNeue', Helvetica, Arial, Verdana, sans-serif;

  /* Light theme variables */
  --app-background: #f8f9fa;
  --app-surface: #ffffff;
  --app-text-primary: #000000;
  --app-text-secondary: #424242;
  --app-border-color: rgba(0, 0, 0, 0.08);
  --app-shadow: rgba(0, 0, 0, 0.1);
}

/* Dark theme variables */
.dark-theme {
  --app-background: #121212;
  --app-surface: #1e1e1e;
  --app-text-primary: #ffffff;
  --app-text-secondary: #e0e0e0;
  --app-border-color: rgba(255, 255, 255, 0.12);
  --app-shadow: rgba(0, 0, 0, 0.3);
}

/* Theme-aware component styling */
.v-application {
  background: var(--app-background) !important;
  color: var(--app-text-primary) !important;
}

.header-container {
  display: flex;
  align-items: center;
  padding: var(--header-padding);
  max-width: 100% !important;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-shrink: 0;
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--spacing-sm);
  transition: all 0.3s ease;
}

.logo-clickable:hover {
  background: rgba(30, 187, 240, 0.1);
  transform: translateY(-1px);
}

.logo-image {
  height: 35px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.logo-text {
  font-size: 20px;
  font-weight: 500;
  color: var(--the7-accent-color);
  font-family: var(--the7-base-font-family);
}

.header-icons {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-left: var(--spacing-lg);
  margin-right: var(--spacing-lg);
}

.auth-btn {
  font-size: 11px !important;
  font-weight: 500 !important;
  text-transform: uppercase;
  padding: var(--button-padding-md) !important;
  margin: 0 var(--spacing-xs) !important;
}

/* Enhanced RTL Support with Professional Arabic Typography */
.rtl,
.v-application--is-rtl {
  direction: rtl !important;
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Segoe UI Arabic', 'Tahoma', sans-serif;
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* App Bar RTL Layout */
.rtl .v-app-bar,
.v-application--is-rtl .v-app-bar {
  direction: rtl !important;
}

.rtl .header-container,
.v-application--is-rtl .header-container {
  flex-direction: row-reverse !important;
}

.rtl .logo,
.v-application--is-rtl .logo {
  order: 3;
}

.rtl .header-icons,
.v-application--is-rtl .header-icons {
  order: 1;
  flex-direction: row-reverse !important;
}

.rtl .v-spacer,
.v-application--is-rtl .v-spacer {
  order: 2;
}

.rtl .logo-text {
  font-family: 'Tajawal', 'Cairo', 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.4;
}

/* Enhanced button styling for Arabic */
.rtl .auth-btn {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Improved spacing for Arabic navigation */
.rtl .header-container {
  padding: 0 24px;
}

.rtl .header-icons {
  gap: 12px;
  margin-left: 16px;
  margin-right: 16px;
}

.rtl .auth-btn {
  margin: 0 4px !important;
  padding: 8px 16px !important;
}

/* Enhanced hover effects for RTL */
.rtl .logo-clickable:hover {
  background: rgba(30, 187, 240, 0.08);
  transform: translateY(-1px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Better text alignment for Arabic */
.rtl .v-btn {
  text-align: center;
}

/* Improved badge positioning for RTL */
.rtl .v-badge {
  left: auto;
  right: -12px;
}

/* Main content padding */
.main-content {
  padding: var(--container-padding-md);
  min-height: calc(100vh - var(--header-height));
}

/* Responsive adjustments (handled by CSS variables) */
@media (max-width: 480px) {
  .auth-btn {
    font-size: 10px !important;
  }
}

/* Better app bar spacing */
.v-app-bar {
  border-bottom: 1px solid var(--app-border-color);
  background: var(--app-surface) !important;
  box-shadow: 0 2px 4px var(--app-shadow);
}

/* Theme-aware logo styling */
.logo-text {
  color: var(--the7-accent-color) !important;
}

/* Theme-aware button styling */
.auth-btn {
  color: var(--app-text-primary) !important;
  border-color: var(--app-border-color) !important;
}

.auth-btn:hover {
  background: var(--app-border-color) !important;
}

/* Comprehensive RTL Layout Support */
.rtl .v-app,
.v-application--is-rtl {
  direction: rtl !important;
}

.rtl .main-content,
.v-application--is-rtl .main-content {
  direction: rtl !important;
  text-align: right;
}

/* RTL Card and Container Support */
.rtl .v-card,
.v-application--is-rtl .v-card {
  direction: rtl !important;
}

.rtl .v-card-title,
.v-application--is-rtl .v-card-title {
  text-align: right !important;
}

.rtl .v-card-text,
.v-application--is-rtl .v-card-text {
  text-align: right !important;
}

/* RTL Container and Row Support */
.rtl .v-container,
.v-application--is-rtl .v-container {
  direction: rtl !important;
}

.rtl .v-row,
.v-application--is-rtl .v-row {
  direction: rtl !important;
}

.rtl .v-col,
.v-application--is-rtl .v-col {
  direction: rtl !important;
}

/* RTL Button and Icon Support */
.rtl .v-btn,
.v-application--is-rtl .v-btn {
  direction: rtl !important;
}

.rtl .v-icon,
.v-application--is-rtl .v-icon {
  direction: rtl !important;
}

/* RTL List Support */
.rtl .v-list,
.v-application--is-rtl .v-list {
  direction: rtl !important;
}

.rtl .v-list-item,
.v-application--is-rtl .v-list-item {
  direction: rtl !important;
}

.rtl .v-list-item-title,
.v-application--is-rtl .v-list-item-title {
  text-align: right !important;
}

/* RTL Menu and Dialog Support */
.rtl .v-menu,
.v-application--is-rtl .v-menu {
  direction: rtl !important;
}

.rtl .v-dialog,
.v-application--is-rtl .v-dialog {
  direction: rtl !important;
}

/* RTL Data Table Support */
.rtl .v-data-table,
.v-application--is-rtl .v-data-table {
  direction: rtl !important;
}

.rtl .v-data-table th,
.v-application--is-rtl .v-data-table th {
  text-align: right !important;
}

.rtl .v-data-table td,
.v-application--is-rtl .v-data-table td {
  text-align: right !important;
}

/* Force RTL for all Vuetify components */
.v-application--is-rtl * {
  direction: inherit !important;
}
</style>
