<template>
  <v-container fluid class="login-page">
    <!-- Theme Controls positioned at top-right for better visibility -->
    <div class="theme-controls-overlay">
      <ThemeSwitcher />
      <LanguageSwitcher />
    </div>

    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-card elevation="8" class="auth-card">
          <v-card-title class="text-center pa-6">
            <h2 class="text-h4 font-weight-bold primary--text">{{ $t('auth.login') }}</h2>
          </v-card-title>
          
          <v-card-text class="pa-6">
            <VeeForm @submit="onSubmit">
              <VeeField
                v-model="email"
                name="email"
                rules="required|email"
                v-slot="{ field, errorMessage }"
              >
                <v-text-field
                  v-bind="field"
                  type="email"
                  :label="$t('auth.email')"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  :error-messages="errorMessage"
                  autocomplete="email"
                  class="mb-4"
                />
              </VeeField>
              
              <VeeField
                v-model="password"
                name="password"
                rules="required"
                v-slot="{ field, errorMessage }"
              >
                <v-text-field
                  v-bind="field"
                  :type="showPassword ? 'text' : 'password'"
                  :label="$t('auth.password')"
                  prepend-inner-icon="mdi-lock"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="togglePasswordVisibility"
                  variant="outlined"
                  :error-messages="errorMessage"
                  autocomplete="current-password"
                  class="mb-4"
                />
              </VeeField>
              
              <v-btn
                type="submit"
                :loading="isLoading"
                :disabled="isLoading"
                color="primary"
                size="large"
                block
                class="mb-4"
              >
                {{ isLoading ? 'Logging in...' : $t('auth.login') }}
              </v-btn>
              
              <v-alert v-if="error" type="error" class="mb-4">
                {{ error }}
              </v-alert>
            </VeeForm>
          </v-card-text>
          
          <v-card-actions class="pa-6 pt-0">
            <v-row justify="center">
              <v-col cols="auto">
                <span class="text-body-2">{{ $t('auth.noAccount') }}</span>
                <v-btn
                  :to="{ name: 'register' }"
                  variant="text"
                  color="primary"
                  class="px-2"
                >
                  {{ $t('auth.register') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Field as VeeField, Form as VeeForm, ErrorMessage as VeeErrorMessage } from 'vee-validate'
import { useLoader } from '../composables/useLoader.js'
import ThemeSwitcher from '../components/ThemeSwitcher.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import api from '../services/api'

const router = useRouter()
const { t: $t } = useI18n()
const { show: showLoader } = useLoader()
const email = ref('')
const password = ref('')
const error = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

async function onSubmit(values, { setErrors }, event) {
  // Prevent default form submission
  if (event && event.preventDefault) {
    event.preventDefault()
  }

  // Prevent multiple submissions
  if (isLoading.value) return

  error.value = ''
  isLoading.value = true
  // Show loading overlay
  let loader = showLoader({
    message: 'Verifying your credentials...\nPlease wait while we securely authenticate your account.',
    variant: 'default',
    spinnerType: 'circular',
    blurBackground: true
  })
  
  try {
    // Update message during API call
    setTimeout(() => {
      if (loader && loader.isVisible()) {
        loader.updateMessage('Connecting to servers...\nEstablishing secure connection.')
      }
    }, 500)
    
    const { data } = await api.post('/api/auth/login', { 
      email: values.email, 
      password: values.password 
    })
    localStorage.setItem('token', data.data.token)
    
    // Dispatch auth change event to update app bar
    window.dispatchEvent(new CustomEvent('auth-changed'))
    
    // Update loading message for success
    if (loader && loader.isVisible()) {
      loader.updateVariant('success')
      loader.updateMessage('✅ Login successful!\nRedirecting to your dashboard...')
    }
    
    // Small delay to show success message
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    router.push('/tasks')
  } catch (e) {
    
    // Handle authentication errors silently - errors are shown to user via UI
    
    // Check if it's a validation error (field-specific errors)
    if (e?.response?.status === 400 && e?.response?.data?.validationFailed && e?.response?.data?.errors) {
      // Handle new validation error format
      const serverErrors = {}
      e.response.data.errors.forEach(err => {
        const fieldName = err.field || err.path
        if (fieldName) {
          serverErrors[fieldName] = err.message
        }
      })

      if (Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors)
        // Show the main validation message
        error.value = e.response?.data?.message || $t('validation.validationFailed')
      } else {
        error.value = e.response?.data?.message || $t('validation.validationFailed')
      }
    } else {
      // Authentication or server errors - show general error message
      const statusCode = e?.response?.status
      let errorMessage = 'Login failed'
      
      if (statusCode === 401) {
        errorMessage = $t('errors.invalidCredentials')
      } else if (statusCode === 429) {
        errorMessage = $t('errors.tooManyAttempts')
      } else if (statusCode >= 500) {
        errorMessage = $t('errors.tryAgainLater')
      } else if (e?.response?.data?.message) {
        errorMessage = e.response.data.message
      }
      
      error.value = errorMessage
    }
  } finally {
    // Reset loading state
    isLoading.value = false

    // Hide loading overlay safely
    try {
      if (loader && loader.isVisible()) {
        loader.hide()
      }
    } catch (hideError) {
      // Silently handle loader hide errors
    }
  }
}</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0 !important;
  position: relative;
  transition: background 0.3s ease;
}

/* Dark theme for login page */
.dark-theme .login-page {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px !important;
  transition: background 0.3s ease, color 0.3s ease;
}

/* Dark theme for auth card */
.dark-theme .auth-card {
  background: rgba(30, 30, 30, 0.95) !important;
  color: #ffffff !important;
}

/* Dark theme for form elements */
.dark-theme .v-text-field {
  color: #ffffff !important;
}

.dark-theme .v-text-field .v-field__input {
  color: #ffffff !important;
}

.dark-theme .v-text-field .v-field__outline {
  color: rgba(255, 255, 255, 0.7) !important;
}

.dark-theme .v-text-field .v-label {
  color: rgba(255, 255, 255, 0.8) !important;
}

.dark-theme .v-card-title {
  color: #ffffff !important;
}

.dark-theme .v-btn {
  color: #ffffff !important;
}

.theme-controls-overlay {
  position: fixed;
  top: var(--spacing-xl);
  right: var(--spacing-xl);
  z-index: 1000;
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

/* RTL Support for theme controls */
.rtl .theme-controls-overlay {
  right: auto;
  left: var(--spacing-xl);
  flex-direction: row-reverse;
}

.fill-height {
  min-height: 100vh;
}

/* Enhanced RTL Support for Login Page */
.rtl .auth-card {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
}

.rtl .v-card-title {
  font-family: 'Tajawal', 'Cairo', 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
}

.rtl .v-card-subtitle {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  line-height: 1.75;
  text-align: center;
}

.rtl .v-text-field {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
}

.rtl .v-text-field .v-field__input {
  text-align: right;
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  line-height: 1.75;
}

.rtl .v-label {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
}

.rtl .v-btn {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.rtl .v-alert {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  line-height: 1.75;
}
</style>
