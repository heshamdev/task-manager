/**
 * Login View Tests
 * Tests the login component functionality including form validation and authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import Login from '../Login.vue'
import api from '../../services/api'

// Mock the API service
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn()
  }
}))

// Mock vue-loading-overlay
vi.mock('vue-loading-overlay', () => ({
  useLoading: () => ({
    show: vi.fn(() => ({
      isVisible: vi.fn(() => true),
      updateVariant: vi.fn(),
      updateMessage: vi.fn(),
      hide: vi.fn()
    }))
  })
}))

describe('Login', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(Login, {
      global: {
        mocks: {
          $t: (key) => key,
          $router: {
            push: vi.fn()
          }
        }
      }
    })
  })

  describe('Rendering', () => {
    it('should render login form', () => {
      expect(wrapper.find('form').exists()).toBe(true)
      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('should display login title', () => {
      expect(wrapper.find('h2').text()).toBe('auth.login')
    })

    it('should show register link', () => {
      expect(wrapper.find('a[href="/register"]').exists()).toBe(true)
    })

    it('should have password visibility toggle', () => {
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('.v-icon').exists()).toBe(true)
    })
  })

  describe('Form Validation', () => {
    it('should show validation errors for empty form submission', async () => {
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      // Wait for validation to complete
      await nextTick()
      
      // Check for validation error messages
      expect(wrapper.text()).toContain('required')
    })

    it('should show validation error for invalid email format', async () => {
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('invalid-email')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(wrapper.text()).toContain('email')
    })

    it('should show validation error for short password', async () => {
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(wrapper.text()).toContain('min')
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when icon is clicked', async () => {
      const passwordInput = wrapper.find('input[type="password"]')
      const toggleIcon = wrapper.find('.v-icon')
      
      expect(passwordInput.attributes('type')).toBe('password')
      
      await toggleIcon.trigger('click')
      await nextTick()
      
      expect(passwordInput.attributes('type')).toBe('text')
    })

    it('should show correct icon based on visibility state', async () => {
      const toggleIcon = wrapper.find('.v-icon')
      
      // Initially should show eye-off icon
      expect(toggleIcon.text()).toBe('mdi-eye-off')
      
      await toggleIcon.trigger('click')
      await nextTick()
      
      // After click should show eye icon
      expect(toggleIcon.text()).toBe('mdi-eye')
    })
  })

  describe('Form Submission', () => {
    it('should call API with correct data on valid form submission', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'fake-jwt-token',
            user: { id: '1', name: 'Test User', email: 'test@example.com' }
          }
        }
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should store token in localStorage on successful login', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'fake-jwt-token',
            user: { id: '1', name: 'Test User', email: 'test@example.com' }
          }
        }
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(global.testUtils.localStorageMock.setItem).toHaveBeenCalledWith('token', 'fake-jwt-token')
    })

    it('should dispatch auth-changed event on successful login', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'fake-jwt-token',
            user: { id: '1', name: 'Test User', email: 'test@example.com' }
          }
        }
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent))
    })

    it('should navigate to tasks page on successful login', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'fake-jwt-token',
            user: { id: '1', name: 'Test User', email: 'test@example.com' }
          }
        }
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/tasks')
    })

    it('should show error message on login failure', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Invalid credentials'
          }
        }
      }
      
      api.post.mockRejectedValue(mockError)
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('wrongpassword')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(wrapper.text()).toContain('Invalid credentials')
    })

    it('should show generic error message when no specific error is provided', async () => {
      const mockError = new Error('Network error')
      
      api.post.mockRejectedValue(mockError)
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(wrapper.text()).toContain('Failed to login')
    })
  })

  describe('Loading States', () => {
    it('should show loading overlay during form submission', async () => {
      // Mock a delayed response
      api.post.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          data: {
            data: {
              token: 'fake-jwt-token',
              user: { id: '1', name: 'Test User', email: 'test@example.com' }
            }
          }
        }), 100)
      }))
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      // Loading should be shown immediately
      expect(wrapper.vm.loader).toBeDefined()
    })
  })

  describe('Form Reset', () => {
    it('should clear form fields after successful submission', async () => {
      const mockResponse = {
        data: {
          data: {
            token: 'fake-jwt-token',
            user: { id: '1', name: 'Test User', email: 'test@example.com' }
          }
        }
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      // Form should be reset
      expect(wrapper.vm.email).toBe('')
      expect(wrapper.vm.password).toBe('')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      expect(emailInput.attributes('placeholder')).toBe('Enter your email')
      expect(passwordInput.attributes('placeholder')).toBe('Enter your password')
    })

    it('should have proper button text', () => {
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toContain('auth.login')
    })
  })

  describe('Error Handling', () => {
    it('should clear previous error messages on new submission', async () => {
      // First submission with error
      api.post.mockRejectedValueOnce({
        response: { data: { message: 'First error' } }
      })
      
      const emailInput = wrapper.find('input[type="email"]')
      const passwordInput = wrapper.find('input[type="password"]')
      
      await emailInput.setValue('test@example.com')
      await passwordInput.setValue('password123')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      await nextTick()
      
      expect(wrapper.text()).toContain('First error')
      
      // Second submission with success
      api.post.mockResolvedValueOnce({
        data: {
          data: {
            token: 'fake-jwt-token',
            user: { id: '1', name: 'Test User', email: 'test@example.com' }
          }
        }
      })
      
      await form.trigger('submit')
      
      await nextTick()
      
      // Error should be cleared
      expect(wrapper.text()).not.toContain('First error')
    })
  })
})
