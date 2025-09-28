/**
 * LoadingOverlay Component Tests
 * Tests the enhanced loading overlay component functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadingOverlay from '../LoadingOverlay.vue'

describe('LoadingOverlay', () => {
  let wrapper

  const defaultProps = {
    isVisible: true,
    message: 'Loading...',
    variant: 'default',
    spinnerType: 'modern',
    blurBackground: true,
    showProgress: false,
    progress: 0
  }

  beforeEach(() => {
    wrapper = mount(LoadingOverlay, {
      props: defaultProps
    })
  })

  describe('Rendering', () => {
    it('should render when visible', () => {
      expect(wrapper.find('.loading-overlay').exists()).toBe(true)
      expect(wrapper.find('.loading-container').exists()).toBe(true)
    })

    it('should not render when not visible', async () => {
      await wrapper.setProps({ isVisible: false })
      expect(wrapper.find('.loading-overlay').exists()).toBe(false)
    })

    it('should display the main message', () => {
      expect(wrapper.find('.main-message').text()).toBe('Loading...')
    })

    it('should display sub message when provided', async () => {
      await wrapper.setProps({ 
        message: 'Loading...\nPlease wait while we process your request.' 
      })
      
      expect(wrapper.find('.sub-message').text()).toBe('Please wait while we process your request.')
    })

    it('should not display message when empty', async () => {
      await wrapper.setProps({ message: '' })
      expect(wrapper.find('.loading-message').exists()).toBe(false)
    })
  })

  describe('Spinner Types', () => {
    it('should render modern spinner by default', () => {
      expect(wrapper.find('.modern-spinner').exists()).toBe(true)
      expect(wrapper.find('.spinner-ring').exists()).toBe(true)
      expect(wrapper.find('.spinner-dot').exists()).toBe(true)
    })

    it('should render circular spinner', async () => {
      await wrapper.setProps({ spinnerType: 'circular' })
      expect(wrapper.find('.circular-container').exists()).toBe(true)
      expect(wrapper.find('.circular').exists()).toBe(true)
    })

    it('should render dots spinner', async () => {
      await wrapper.setProps({ spinnerType: 'dots' })
      expect(wrapper.find('.spinner.dots').exists()).toBe(true)
      expect(wrapper.findAll('.dot')).toHaveLength(3)
    })

    it('should render ring spinner', async () => {
      await wrapper.setProps({ spinnerType: 'ring' })
      expect(wrapper.find('.ring-container').exists()).toBe(true)
      expect(wrapper.find('.ring-1').exists()).toBe(true)
      expect(wrapper.find('.ring-2').exists()).toBe(true)
    })

    it('should render pulse spinner', async () => {
      await wrapper.setProps({ spinnerType: 'pulse' })
      expect(wrapper.find('.pulse-container').exists()).toBe(true)
      expect(wrapper.find('.pulse-1').exists()).toBe(true)
      expect(wrapper.find('.pulse-2').exists()).toBe(true)
      expect(wrapper.find('.pulse-3').exists()).toBe(true)
    })
  })

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      expect(wrapper.find('.loading-container').classes()).toContain('default')
    })

    it('should apply success variant styles', async () => {
      await wrapper.setProps({ variant: 'success' })
      expect(wrapper.find('.loading-container').classes()).toContain('success')
    })

    it('should apply error variant styles', async () => {
      await wrapper.setProps({ variant: 'error' })
      expect(wrapper.find('.loading-container').classes()).toContain('error')
    })

    it('should apply warning variant styles', async () => {
      await wrapper.setProps({ variant: 'warning' })
      expect(wrapper.find('.loading-container').classes()).toContain('warning')
    })
  })

  describe('Progress Bar', () => {
    it('should not show progress bar by default', () => {
      expect(wrapper.find('.progress-container').exists()).toBe(false)
    })

    it('should show progress bar when enabled', async () => {
      await wrapper.setProps({ showProgress: true, progress: 50 })
      expect(wrapper.find('.progress-container').exists()).toBe(true)
      expect(wrapper.find('.progress-bar').exists()).toBe(true)
      expect(wrapper.find('.progress-fill').exists()).toBe(true)
      expect(wrapper.find('.progress-text').text()).toBe('50%')
    })

    it('should display correct progress percentage', async () => {
      await wrapper.setProps({ showProgress: true, progress: 75 })
      expect(wrapper.find('.progress-text').text()).toBe('75%')
    })

    it('should round progress percentage', async () => {
      await wrapper.setProps({ showProgress: true, progress: 75.7 })
      expect(wrapper.find('.progress-text').text()).toBe('76%')
    })

    it('should set progress fill width', async () => {
      await wrapper.setProps({ showProgress: true, progress: 60 })
      const progressFill = wrapper.find('.progress-fill')
      expect(progressFill.attributes('style')).toContain('width: 60%')
    })
  })

  describe('Blur Background', () => {
    it('should apply blur background by default', () => {
      expect(wrapper.find('.loading-overlay').classes()).toContain('blur-background')
    })

    it('should not apply blur background when disabled', async () => {
      await wrapper.setProps({ blurBackground: false })
      expect(wrapper.find('.loading-overlay').classes()).not.toContain('blur-background')
    })
  })

  describe('Message Parsing', () => {
    it('should parse single line message correctly', () => {
      expect(wrapper.find('.main-message').text()).toBe('Loading...')
      expect(wrapper.find('.sub-message').exists()).toBe(false)
    })

    it('should parse multi-line message correctly', async () => {
      await wrapper.setProps({ 
        message: 'Processing request\nPlease wait...\nThis may take a moment.' 
      })
      
      expect(wrapper.find('.main-message').text()).toBe('Processing request')
      expect(wrapper.find('.sub-message').text()).toBe('Please wait...\nThis may take a moment.')
    })

    it('should handle empty lines in message', async () => {
      await wrapper.setProps({ 
        message: 'Loading...\n\nPlease wait...' 
      })
      
      expect(wrapper.find('.main-message').text()).toBe('Loading...')
      expect(wrapper.find('.sub-message').text()).toBe('\nPlease wait...')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const overlay = wrapper.find('.loading-overlay')
      expect(overlay.attributes('role')).toBe('dialog')
      expect(overlay.attributes('aria-modal')).toBe('true')
    })

    it('should have accessible loading message', () => {
      const message = wrapper.find('.loading-message')
      expect(message.exists()).toBe(true)
    })
  })

  describe('CSS Classes', () => {
    it('should apply correct CSS classes for modern spinner', () => {
      expect(wrapper.find('.spinner').classes()).toContain('modern')
    })

    it('should apply correct CSS classes for different variants', async () => {
      await wrapper.setProps({ variant: 'success' })
      expect(wrapper.find('.spinner').classes()).toContain('success')
    })

    it('should apply spinner wrapper class', () => {
      expect(wrapper.find('.spinner-wrapper').exists()).toBe(true)
    })
  })

  describe('Animation Classes', () => {
    it('should have fade transition classes', () => {
      expect(wrapper.find('.loading-overlay').classes()).toContain('fade-enter-active')
    })
  })

  describe('Props Validation', () => {
    it('should accept valid variant values', async () => {
      const validVariants = ['default', 'success', 'error', 'warning']
      
      for (const variant of validVariants) {
        await wrapper.setProps({ variant })
        expect(wrapper.props('variant')).toBe(variant)
      }
    })

    it('should accept valid spinner type values', async () => {
      const validSpinnerTypes = ['circular', 'dots', 'ring', 'pulse', 'modern']
      
      for (const spinnerType of validSpinnerTypes) {
        await wrapper.setProps({ spinnerType })
        expect(wrapper.props('spinnerType')).toBe(spinnerType)
      }
    })

    it('should handle boolean props correctly', () => {
      expect(wrapper.props('isVisible')).toBe(true)
      expect(wrapper.props('blurBackground')).toBe(true)
      expect(wrapper.props('showProgress')).toBe(false)
    })

    it('should handle numeric props correctly', () => {
      expect(wrapper.props('progress')).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(1000)
      await wrapper.setProps({ message: longMessage })
      
      expect(wrapper.find('.main-message').text()).toBe(longMessage)
    })

    it('should handle progress values outside 0-100 range', async () => {
      await wrapper.setProps({ showProgress: true, progress: 150 })
      expect(wrapper.find('.progress-text').text()).toBe('150%')
      
      await wrapper.setProps({ progress: -10 })
      expect(wrapper.find('.progress-text').text()).toBe('-10%')
    })

    it('should handle null/undefined message', async () => {
      await wrapper.setProps({ message: null })
      expect(wrapper.find('.loading-message').exists()).toBe(false)
      
      await wrapper.setProps({ message: undefined })
      expect(wrapper.find('.loading-message').exists()).toBe(false)
    })
  })
})
