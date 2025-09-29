<template>
  <v-container fluid class="register-page">
    <!-- Theme Controls positioned at top-right for better visibility -->
    <div class="theme-controls-overlay">
      <ThemeSwitcher />
      <LanguageSwitcher />
    </div>

    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-card elevation="8" class="auth-card">
          <v-card-title class="text-center pa-6">
            <h2 class="text-h4 font-weight-bold primary--text">{{ $t('auth.register') }}</h2>
          </v-card-title>
          
          <v-card-text class="pa-6">
            <VeeForm @submit="onSubmit">
              <VeeField
                v-model="name"
                name="name"
                rules="required|min:2|max:50"
                v-slot="{ field, errorMessage }"
              >
                <v-text-field
                  v-bind="field"
                  :label="$t('auth.name')"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  :error-messages="errorMessage"
                  autocomplete="name"
                  class="mb-4"
                  placeholder="Enter your full name"
                />
              </VeeField>

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
                  placeholder="Enter your email address"
                />
              </VeeField>
              
              <VeeField
                v-model="password"
                name="password"
                rules="required|passwordComplexity"
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
                  autocomplete="new-password"
                  class="mb-4"
                  placeholder="Create a secure password"
                />
              </VeeField>

              <VeeField
                v-model="confirmPassword"
                name="confirmPassword"
                rules="required|confirmed:@password"
                v-slot="{ field, errorMessage }"
              >
                <v-text-field
                  v-bind="field"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  label="Confirm Password"
                  prepend-inner-icon="mdi-lock-check"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="toggleConfirmPasswordVisibility"
                  variant="outlined"
                  :error-messages="errorMessage"
                  autocomplete="new-password"
                  class="mb-4"
                  placeholder="Confirm your password"
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
                {{ isLoading ? 'Creating Account...' : $t('auth.register') }}
              </v-btn>
              
              <v-alert v-if="error" type="error" class="mb-4">
                {{ error }}
              </v-alert>
            </VeeForm>
          </v-card-text>
          
          <v-card-actions class="pa-6 pt-0">
            <v-row justify="center">
              <v-col cols="auto">
                <span class="text-body-2">{{ $t('auth.haveAccount') }}</span>
                <v-btn
                  :to="{ name: 'login' }"
                  variant="text"
                  color="primary"
                  class="px-2"
                >
                  {{ $t('auth.login') }}
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
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

function toggleConfirmPasswordVisibility() {
  showConfirmPassword.value = !showConfirmPassword.value
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
    message: 'Creating your account...\nValidating your information and setting up your profile.',
    variant: 'default',
    spinnerType: 'circular',
    blurBackground: true
  })
  
  try {
    // Update message during API call
    setTimeout(() => {
      if (loader && loader.isVisible()) {
        loader.updateMessage('Securing your account...\nEncrypting your password and generating access tokens.')
      }
    }, 600)
    
    const { data } = await api.post('/api/auth/register', { 
      name: values.name,
      email: values.email, 
      password: values.password 
    })
    
    localStorage.setItem('token', data.data.token)
    
    // Dispatch auth change event to update app bar
    window.dispatchEvent(new CustomEvent('auth-changed'))
    
    // Update loading message for success
    if (loader && loader.isVisible()) {
      loader.updateVariant('success')
      loader.updateMessage('🎉 Welcome!\nYour account has been created successfully. Redirecting...')
    }
    
    // Small delay to show success message
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    router.push('/tasks')
  } catch (e) {
    // Handle registration errors silently - errors are shown to user via UI
    
    // Check if it's a validation error (field-specific errors)
    if (e?.response?.status === 400 && e?.response?.data?.validationFailed && e?.response?.data?.errors) {
      // Handle new validation error format
      const fieldErrors = {}
      e.response.data.errors.forEach(err => {
        const fieldName = err.field || err.path || err.param
        if (fieldName) {
          fieldErrors[fieldName] = err.message || err.msg
        }
      })

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        // Show the main validation message
        error.value = e.response?.data?.message || $t('validation.validationFailed')
      } else {
        error.value = e.response?.data?.message || $t('validation.validationFailed')
      }
    } else {
      // Registration or server errors - show general error message
      const statusCode = e?.response?.status
      let errorMessage = 'Registration failed'
      
      if (statusCode === 409 || statusCode === 400) {
        errorMessage = e?.response?.data?.message || $t('errors.emailExists') || 'Email already exists'
      } else if (statusCode === 429) {
        errorMessage = $t('errors.registrationAttempts') || 'Too many registration attempts'
      } else if (statusCode >= 500) {
        errorMessage = $t('errors.tryAgainLater') || 'Server error. Please try again later'
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
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0 !important;
  position: relative;
  transition: background 0.3s ease;
}

/* Dark theme for register page */
.dark-theme .register-page {
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
</style>
