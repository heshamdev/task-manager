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
          <!-- Authentication Links for Non-authenticated Users -->
          <v-btn
            v-if="!isAuthenticated"
            :to="{ name: 'login' }"
            variant="text"
            prepend-icon="mdi-login"
            class="auth-btn"
          >
            {{ $t ? $t('auth.login') : 'LOGIN' }}
          </v-btn>
          <v-btn
            v-if="!isAuthenticated"
            :to="{ name: 'register' }"
            variant="outlined"
            prepend-icon="mdi-account-plus"
            class="auth-btn"
            color="primary"
          >
            {{ $t ? $t('auth.register') : 'REGISTER' }}
          </v-btn>

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
      <RouterView />
    </v-main>
    
    <!-- Global Loading Provider -->
    <LoadingProvider />
  </v-app>
</template>

<script setup>
import { RouterView, useRouter } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import LoadingProvider from './components/LoadingProvider.vue'

const router = useRouter()
const authToken = ref(localStorage.getItem('token'))
const isAuthenticated = computed(() => !!authToken.value)

// Function to update auth state
function updateAuthState() {
  authToken.value = localStorage.getItem('token')
}

// Listen for authentication events
function handleAuthEvent() {
  updateAuthState()
}

onMounted(() => {
  // Listen for custom auth events
  window.addEventListener('auth-changed', handleAuthEvent)
  // Also listen for storage events (in case of multiple tabs)
  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      updateAuthState()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('auth-changed', handleAuthEvent)
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

<style scoped>
/* 3DDX Color Scheme Variables */
:root {
  --the7-accent-color: #1ebbf0;
  --the7-accent-bg-2: #39dfaa;
  --the7-accent-gradient: linear-gradient(135deg, #1ebbf0 30%, #39dfaa 100%);
  --the7-base-font-family: 'HelveticaNeue', Helvetica, Arial, Verdana, sans-serif;
}

.header-container {
  display: flex;
  align-items: center;
  padding: 0 !important;
  max-width: 100% !important;
}

.logo {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-shrink: 0;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
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
  gap: 12px;
}

.auth-btn {
  font-size: 11px !important;
  font-weight: 500 !important;
  text-transform: uppercase;
}

/* RTL Support */
.rtl {
  direction: rtl;
}

.rtl .logo {
  flex-direction: row-reverse;
}

.rtl .header-icons {
  flex-direction: row-reverse;
}
</style>
