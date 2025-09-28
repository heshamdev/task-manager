import { ref, reactive } from 'vue'

// Global loading state
const globalLoaders = reactive(new Map())
let loaderId = 0

// Default configuration
const defaultConfig = {
  message: 'Loading...',
  variant: 'default',
  spinnerType: 'modern',
  blurBackground: true,
  showProgress: false,
  progress: 0,
  duration: null, // Auto-hide after duration (ms)
  preventClose: false // Prevent manual closing
}

// Main composable
export function useLoader() {
  
  // Show a new loader
  function show(config = {}) {
    const finalConfig = { ...defaultConfig, ...config }
    const id = ++loaderId
    
    const loaderState = reactive({
      id,
      isVisible: true,
      ...finalConfig
    })
    
    globalLoaders.set(id, loaderState)
    
    // Auto-hide after duration if specified
    if (finalConfig.duration) {
      setTimeout(() => {
        hide(id)
      }, finalConfig.duration)
    }
    
    // Return loader instance with control methods
    return {
      id,
      hide: () => hide(id),
      updateMessage: (message) => updateMessage(id, message),
      updateProgress: (progress) => updateProgress(id, progress),
      updateVariant: (variant) => updateVariant(id, variant),
      isVisible: () => globalLoaders.has(id) && globalLoaders.get(id)?.isVisible
    }
  }
  
  // Hide a specific loader
  function hide(id) {
    if (globalLoaders.has(id)) {
      const loader = globalLoaders.get(id)
      if (!loader.preventClose) {
        loader.isVisible = false
        // Remove from map after animation completes
        setTimeout(() => {
          globalLoaders.delete(id)
        }, 300)
      }
    }
  }
  
  // Hide all loaders
  function hideAll() {
    globalLoaders.forEach((loader, id) => {
      if (!loader.preventClose) {
        hide(id)
      }
    })
  }
  
  // Update loader message
  function updateMessage(id, message) {
    if (globalLoaders.has(id)) {
      globalLoaders.get(id).message = message
    }
  }
  
  // Update progress
  function updateProgress(id, progress) {
    if (globalLoaders.has(id)) {
      const loader = globalLoaders.get(id)
      loader.progress = Math.max(0, Math.min(100, progress))
      loader.showProgress = true
    }
  }
  
  // Update variant
  function updateVariant(id, variant) {
    if (globalLoaders.has(id)) {
      globalLoaders.get(id).variant = variant
    }
  }
  
  // Get all active loaders (for the component to render)
  function getAllLoaders() {
    return Array.from(globalLoaders.values()).filter(loader => loader.isVisible)
  }
  
  // Preset loader configurations
  const presets = {
    // Quick loading states
    quick: (message = 'Processing...') => show({
      message,
      spinnerType: 'modern',
      duration: 2000
    }),
    
    // Success message
    success: (message = 'Success!') => show({
      message,
      variant: 'success',
      spinnerType: 'pulse',
      duration: 1500
    }),
    
    // Error message  
    error: (message = 'An error occurred') => show({
      message,
      variant: 'error',
      spinnerType: 'ring',
      duration: 3000
    }),
    
    // Warning message
    warning: (message = 'Warning') => show({
      message,
      variant: 'warning',
      spinnerType: 'dots',
      duration: 2500
    }),
    
    // Long-running operation
    persistent: (message = 'Please wait...') => show({
      message,
      variant: 'default',
      spinnerType: 'circular',
      blurBackground: true,
      preventClose: false
    }),
    
    // Progress loader
    progress: (message = 'Uploading...') => show({
      message,
      variant: 'default',
      spinnerType: 'circular',
      showProgress: true,
      progress: 0
    })
  }
  
  // Utility functions for common patterns
  async function withLoader(asyncFunction, config = {}) {
    const loader = show(config)
    try {
      const result = await asyncFunction()
      loader.hide()
      return result
    } catch (error) {
      loader.updateVariant('error')
      loader.updateMessage(error.message || 'An error occurred')
      setTimeout(() => loader.hide(), 2000)
      throw error
    }
  }
  
  // Stepped loader for multi-step operations
  function createSteppedLoader(steps, config = {}) {
    const loader = show({
      ...config,
      showProgress: true,
      progress: 0
    })
    
    let currentStep = 0
    
    return {
      nextStep: (message) => {
        currentStep++
        const progress = (currentStep / steps.length) * 100
        loader.updateProgress(progress)
        if (message) loader.updateMessage(message)
        
        if (currentStep >= steps.length) {
          loader.updateVariant('success')
          setTimeout(() => loader.hide(), 1000)
        }
      },
      
      error: (message) => {
        loader.updateVariant('error')
        loader.updateMessage(message || 'Step failed')
        setTimeout(() => loader.hide(), 2000)
      },
      
      hide: () => loader.hide()
    }
  }
  
  return {
    show,
    hide,
    hideAll,
    updateMessage,
    updateProgress,
    updateVariant,
    getAllLoaders,
    presets,
    withLoader,
    createSteppedLoader
  }
}

// Export the reactive loaders for the global component
export { globalLoaders }