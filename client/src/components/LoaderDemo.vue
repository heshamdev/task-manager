<template>
  <div class="loader-demo">
    <h3>New Stable Loader System Demo</h3>
    <div class="demo-buttons">
      <button @click="showQuickLoader" class="demo-btn">Modern Loader</button>
      <button @click="showSuccessLoader" class="demo-btn success">Success</button>
      <button @click="showErrorLoader" class="demo-btn error">Error</button>
      <button @click="showProgressLoader" class="demo-btn">Progress</button>
      <button @click="showSteppedLoader" class="demo-btn">Stepped</button>
      <button @click="showWithLoaderDemo" class="demo-btn">With Async</button>
      <button @click="showSpinnerVariants" class="demo-btn">All Spinners</button>
    </div>
  </div>
</template>

<script setup>
import { useLoader } from '../composables/useLoader.js'

const { show, presets, withLoader, createSteppedLoader } = useLoader()

function showQuickLoader() {
  presets.quick('Processing your request...')
}

function showSuccessLoader() {
  presets.success('✅ Operation completed successfully!')
}

function showErrorLoader() {
  presets.error('❌ Something went wrong\nPlease try again later')
}

function showProgressLoader() {
  const loader = presets.progress('Uploading file...')
  let progress = 0
  
  const interval = setInterval(() => {
    progress += 10
    loader.updateProgress(progress)
    
    if (progress >= 100) {
      clearInterval(interval)
      loader.updateVariant('success')
      loader.updateMessage('✅ Upload completed!')
      setTimeout(() => loader.hide(), 1500)
    }
  }, 200)
}

function showSteppedLoader() {
  const steps = ['Validating data', 'Processing request', 'Saving changes', 'Updating UI']
  const steppedLoader = createSteppedLoader(steps, {
    message: 'Multi-step operation...',
    spinnerType: 'circular'
  })
  
  let currentStep = 0
  const interval = setInterval(() => {
    steppedLoader.nextStep(steps[currentStep])
    currentStep++
    
    if (currentStep >= steps.length) {
      clearInterval(interval)
    }
  }, 800)
}

async function showWithLoaderDemo() {
  try {
    await withLoader(async () => {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      return 'Success result'
    }, {
      message: 'Calling API...\nPlease wait while we process your request.',
      spinnerType: 'modern'
    })
    
    presets.success('API call completed!')
  } catch (error) {
    // Error is automatically handled by withLoader
  }
}

function showSpinnerVariants() {
  const spinnerTypes = ['modern', 'circular', 'dots', 'ring', 'pulse']
  let currentIndex = 0
  
  const showNextSpinner = () => {
    if (currentIndex < spinnerTypes.length) {
      const spinnerType = spinnerTypes[currentIndex]
      const loader = show({
        message: `Testing ${spinnerType} spinner...\nThis is a demonstration of the ${spinnerType} animation.`,
        spinnerType: spinnerType,
        duration: 2000
      })
      
      currentIndex++
      setTimeout(showNextSpinner, 2500)
    } else {
      presets.success('All spinner variants demonstrated!')
    }
  }
  
  showNextSpinner()
}
</script>

<style scoped>
.loader-demo {
  padding: 20px;
  border: 2px solid #1ebbf0;
  border-radius: 8px;
  margin: 20px 0;
  background: linear-gradient(135deg, rgba(30, 187, 240, 0.05) 0%, rgba(57, 223, 170, 0.05) 100%);
}

.demo-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.demo-btn {
  padding: 8px 16px;
  border: 1px solid #1ebbf0;
  background: white;
  color: #1ebbf0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.demo-btn:hover {
  background: #1ebbf0;
  color: white;
  transform: translateY(-1px);
}

.demo-btn.success {
  border-color: #28a745;
  color: #28a745;
}

.demo-btn.success:hover {
  background: #28a745;
  color: white;
}

.demo-btn.error {
  border-color: #dc3545;
  color: #dc3545;
}

.demo-btn.error:hover {
  background: #dc3545;
  color: white;
}
</style>