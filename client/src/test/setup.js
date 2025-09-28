/**
 * Test setup file for Vitest
 * Configures test environment and global test utilities
 */

import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// Mock Vue Router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      name: 'home',
      params: {},
      query: {},
      meta: {}
    }
  }
}

// Mock Vue Router globally
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRouter.currentRoute
}))

// Mock Vue I18n
const mockI18n = {
  t: (key) => key,
  locale: { value: 'en' }
}

vi.mock('vue-i18n', () => ({
  useI18n: () => mockI18n
}))

// Mock axios
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock window.dispatchEvent
window.dispatchEvent = vi.fn()

// Global test utilities
global.testUtils = {
  mockRouter,
  mockI18n,
  localStorageMock
}
