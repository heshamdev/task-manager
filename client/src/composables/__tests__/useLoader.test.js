/**
 * useLoader Composable Tests
 * Tests the loading state management composable functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLoader, globalLoaders } from '../useLoader.js'

describe('useLoader', () => {
  let loader

  beforeEach(() => {
    // Clear any existing loaders
    globalLoaders.clear()
    loader = useLoader()
  })

  afterEach(() => {
    // Clean up after each test
    globalLoaders.clear()
  })

  describe('Basic Functionality', () => {
    it('should create a loader instance', () => {
      expect(loader).toBeDefined()
      expect(typeof loader.show).toBe('function')
      expect(typeof loader.hide).toBe('function')
      expect(typeof loader.hideAll).toBe('function')
      expect(typeof loader.presets).toBe('object')
    })

    it('should show a loader with default configuration', () => {
      const loaderInstance = loader.show()
      
      expect(loaderInstance).toBeDefined()
      expect(loaderInstance.id).toBeDefined()
      expect(typeof loaderInstance.hide).toBe('function')
      expect(typeof loaderInstance.updateMessage).toBe('function')
      expect(typeof loaderInstance.updateProgress).toBe('function')
      expect(typeof loaderInstance.updateVariant).toBe('function')
      expect(typeof loaderInstance.isVisible).toBe('function')
    })

    it('should add loader to global state when shown', () => {
      const loaderInstance = loader.show()
      
      expect(globalLoaders.has(loaderInstance.id)).toBe(true)
      expect(globalLoaders.get(loaderInstance.id).isVisible).toBe(true)
    })

    it('should hide a specific loader', () => {
      const loaderInstance = loader.show()
      const loaderId = loaderInstance.id
      
      expect(globalLoaders.get(loaderId).isVisible).toBe(true)
      
      loaderInstance.hide()
      
      expect(globalLoaders.get(loaderId).isVisible).toBe(false)
    })

    it('should hide all loaders', () => {
      const loader1 = loader.show()
      const loader2 = loader.show()
      
      expect(globalLoaders.size).toBe(2)
      
      loader.hideAll()
      
      expect(globalLoaders.get(loader1.id).isVisible).toBe(false)
      expect(globalLoaders.get(loader2.id).isVisible).toBe(false)
    })
  })

  describe('Loader Configuration', () => {
    it('should use default configuration', () => {
      const loaderInstance = loader.show()
      const loaderState = globalLoaders.get(loaderInstance.id)
      
      expect(loaderState.message).toBe('Loading...')
      expect(loaderState.variant).toBe('default')
      expect(loaderState.spinnerType).toBe('modern')
      expect(loaderState.blurBackground).toBe(true)
      expect(loaderState.showProgress).toBe(false)
      expect(loaderState.progress).toBe(0)
    })

    it('should accept custom configuration', () => {
      const customConfig = {
        message: 'Custom loading message',
        variant: 'success',
        spinnerType: 'circular',
        blurBackground: false,
        showProgress: true,
        progress: 50
      }
      
      const loaderInstance = loader.show(customConfig)
      const loaderState = globalLoaders.get(loaderInstance.id)
      
      expect(loaderState.message).toBe(customConfig.message)
      expect(loaderState.variant).toBe(customConfig.variant)
      expect(loaderState.spinnerType).toBe(customConfig.spinnerType)
      expect(loaderState.blurBackground).toBe(customConfig.blurBackground)
      expect(loaderState.showProgress).toBe(customConfig.showProgress)
      expect(loaderState.progress).toBe(customConfig.progress)
    })

    it('should merge custom config with defaults', () => {
      const partialConfig = {
        message: 'Partial config',
        variant: 'error'
      }
      
      const loaderInstance = loader.show(partialConfig)
      const loaderState = globalLoaders.get(loaderInstance.id)
      
      expect(loaderState.message).toBe(partialConfig.message)
      expect(loaderState.variant).toBe(partialConfig.variant)
      expect(loaderState.spinnerType).toBe('modern') // Default value
      expect(loaderState.blurBackground).toBe(true) // Default value
    })
  })

  describe('Loader Instance Methods', () => {
    let loaderInstance

    beforeEach(() => {
      loaderInstance = loader.show()
    })

    it('should update message', () => {
      const newMessage = 'Updated message'
      loaderInstance.updateMessage(newMessage)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.message).toBe(newMessage)
    })

    it('should update progress', () => {
      const newProgress = 75
      loaderInstance.updateProgress(newProgress)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.progress).toBe(newProgress)
      expect(loaderState.showProgress).toBe(true)
    })

    it('should clamp progress values between 0 and 100', () => {
      loaderInstance.updateProgress(150)
      expect(globalLoaders.get(loaderInstance.id).progress).toBe(100)
      
      loaderInstance.updateProgress(-50)
      expect(globalLoaders.get(loaderInstance.id).progress).toBe(0)
    })

    it('should update variant', () => {
      const newVariant = 'success'
      loaderInstance.updateVariant(newVariant)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.variant).toBe(newVariant)
    })

    it('should check if loader is visible', () => {
      expect(loaderInstance.isVisible()).toBe(true)
      
      loaderInstance.hide()
      expect(loaderInstance.isVisible()).toBe(false)
    })
  })

  describe('Presets', () => {
    it('should have all preset methods', () => {
      expect(typeof loader.presets.quick).toBe('function')
      expect(typeof loader.presets.success).toBe('function')
      expect(typeof loader.presets.error).toBe('function')
      expect(typeof loader.presets.warning).toBe('function')
      expect(typeof loader.presets.persistent).toBe('function')
      expect(typeof loader.presets.progress).toBe('function')
    })

    it('should create quick loader with correct config', () => {
      const message = 'Quick processing...'
      const loaderInstance = loader.presets.quick(message)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.message).toBe(message)
      expect(loaderState.spinnerType).toBe('modern')
      expect(loaderState.duration).toBe(2000)
    })

    it('should create success loader with correct config', () => {
      const message = 'Success!'
      const loaderInstance = loader.presets.success(message)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.message).toBe(message)
      expect(loaderState.variant).toBe('success')
      expect(loaderState.spinnerType).toBe('pulse')
      expect(loaderState.duration).toBe(1500)
    })

    it('should create error loader with correct config', () => {
      const message = 'Error occurred'
      const loaderInstance = loader.presets.error(message)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.message).toBe(message)
      expect(loaderState.variant).toBe('error')
      expect(loaderState.spinnerType).toBe('ring')
      expect(loaderState.duration).toBe(3000)
    })

    it('should create warning loader with correct config', () => {
      const message = 'Warning message'
      const loaderInstance = loader.presets.warning(message)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.message).toBe(message)
      expect(loaderState.variant).toBe('warning')
      expect(loaderState.spinnerType).toBe('dots')
      expect(loaderState.duration).toBe(2500)
    })

    it('should create persistent loader with correct config', () => {
      const message = 'Long operation...'
      const loaderInstance = loader.presets.persistent(message)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.message).toBe(message)
      expect(loaderState.variant).toBe('default')
      expect(loaderState.spinnerType).toBe('circular')
      expect(loaderState.blurBackground).toBe(true)
      expect(loaderState.preventClose).toBe(false)
    })

    it('should create progress loader with correct config', () => {
      const message = 'Uploading...'
      const loaderInstance = loader.presets.progress(message)
      
      const loaderState = globalLoaders.get(loaderInstance.id)
      expect(loaderState.message).toBe(message)
      expect(loaderState.variant).toBe('default')
      expect(loaderState.spinnerType).toBe('circular')
      expect(loaderState.showProgress).toBe(true)
      expect(loaderState.progress).toBe(0)
    })
  })

  describe('Auto-hide Duration', () => {
    it('should auto-hide loader after specified duration', async () => {
      vi.useFakeTimers()
      
      const loaderInstance = loader.show({ duration: 1000 })
      expect(loaderInstance.isVisible()).toBe(true)
      
      // Fast-forward time
      vi.advanceTimersByTime(1000)
      
      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(loaderInstance.isVisible()).toBe(false)
      
      vi.useRealTimers()
    })

    it('should not auto-hide if no duration specified', async () => {
      vi.useFakeTimers()
      
      const loaderInstance = loader.show()
      expect(loaderInstance.isVisible()).toBe(true)
      
      // Fast-forward time
      vi.advanceTimersByTime(5000)
      
      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(loaderInstance.isVisible()).toBe(true)
      
      vi.useRealTimers()
    })
  })

  describe('Prevent Close', () => {
    it('should prevent manual closing when preventClose is true', () => {
      const loaderInstance = loader.show({ preventClose: true })
      
      expect(globalLoaders.get(loaderInstance.id).preventClose).toBe(true)
      
      // Try to hide
      loaderInstance.hide()
      
      // Should still be visible
      expect(loaderInstance.isVisible()).toBe(true)
    })

    it('should allow closing when preventClose is false', () => {
      const loaderInstance = loader.show({ preventClose: false })
      
      expect(globalLoaders.get(loaderInstance.id).preventClose).toBe(false)
      
      // Try to hide
      loaderInstance.hide()
      
      // Should be hidden
      expect(loaderInstance.isVisible()).toBe(false)
    })

    it('should not close via hideAll when preventClose is true', () => {
      const loader1 = loader.show({ preventClose: true })
      const loader2 = loader.show({ preventClose: false })
      
      loader.hideAll()
      
      expect(loader1.isVisible()).toBe(true)
      expect(loader2.isVisible()).toBe(false)
    })
  })

  describe('withLoader Utility', () => {
    it('should show loader during async operation', async () => {
      const asyncFunction = vi.fn().mockResolvedValue('result')
      const config = { message: 'Processing...' }
      
      const result = await loader.withLoader(asyncFunction, config)
      
      expect(result).toBe('result')
      expect(asyncFunction).toHaveBeenCalled()
    })

    it('should hide loader after successful async operation', async () => {
      const asyncFunction = vi.fn().mockResolvedValue('result')
      
      await loader.withLoader(asyncFunction)
      
      // All loaders should be hidden
      expect(globalLoaders.size).toBe(0)
    })

    it('should handle async operation errors', async () => {
      const error = new Error('Test error')
      const asyncFunction = vi.fn().mockRejectedValue(error)
      
      await expect(loader.withLoader(asyncFunction)).rejects.toThrow('Test error')
    })

    it('should update loader to error state on failure', async () => {
      const error = new Error('Test error')
      const asyncFunction = vi.fn().mockRejectedValue(error)
      
      try {
        await loader.withLoader(asyncFunction)
      } catch (e) {
        // Expected error
      }
      
      // Should have shown error state before hiding
      expect(globalLoaders.size).toBe(0)
    })
  })

  describe('Stepped Loader', () => {
    it('should create stepped loader with correct initial config', () => {
      const steps = ['Step 1', 'Step 2', 'Step 3']
      const config = { message: 'Multi-step operation...' }
      
      const steppedLoader = loader.createSteppedLoader(steps, config)
      
      expect(typeof steppedLoader.nextStep).toBe('function')
      expect(typeof steppedLoader.error).toBe('function')
      expect(typeof steppedLoader.hide).toBe('function')
    })

    it('should update progress when moving to next step', () => {
      const steps = ['Step 1', 'Step 2', 'Step 3']
      const steppedLoader = loader.createSteppedLoader(steps)
      
      steppedLoader.nextStep('Step 1')
      
      // Should be at 33% (1/3)
      expect(globalLoaders.size).toBe(1)
    })

    it('should complete and hide when all steps are done', () => {
      const steps = ['Step 1', 'Step 2']
      const steppedLoader = loader.createSteppedLoader(steps)
      
      steppedLoader.nextStep('Step 1')
      steppedLoader.nextStep('Step 2')
      
      // Should be completed
      expect(globalLoaders.size).toBe(1)
    })

    it('should handle errors in stepped loader', () => {
      const steps = ['Step 1', 'Step 2']
      const steppedLoader = loader.createSteppedLoader(steps)
      
      steppedLoader.error('Step failed')
      
      // Should show error state
      expect(globalLoaders.size).toBe(1)
    })
  })

  describe('Global State Management', () => {
    it('should maintain unique IDs for multiple loaders', () => {
      const loader1 = loader.show()
      const loader2 = loader.show()
      
      expect(loader1.id).not.toBe(loader2.id)
      expect(globalLoaders.size).toBe(2)
    })

    it('should remove loader from global state after hide timeout', async () => {
      vi.useFakeTimers()
      
      const loaderInstance = loader.show()
      const loaderId = loaderInstance.id
      
      expect(globalLoaders.has(loaderId)).toBe(true)
      
      loaderInstance.hide()
      
      // Fast-forward past the cleanup timeout
      vi.advanceTimersByTime(300)
      
      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(globalLoaders.has(loaderId)).toBe(false)
      
      vi.useRealTimers()
    })

    it('should get all active loaders', () => {
      const loader1 = loader.show()
      const loader2 = loader.show()
      const loader3 = loader.show()
      
      loader2.hide()
      
      const activeLoaders = loader.getAllLoaders()
      expect(activeLoaders).toHaveLength(2)
      expect(activeLoaders.every(l => l.isVisible)).toBe(true)
    })
  })
})
