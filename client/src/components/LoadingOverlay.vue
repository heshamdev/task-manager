<template>
  <Teleport to="body">
    <Transition name="fade" appear>
      <div v-if="isVisible" class="loading-overlay" :class="{ 'blur-background': blurBackground }">
        <div class="loading-container" :class="variant">
          <div class="loading-content">
            <!-- Enhanced Spinner Animation -->
            <div class="spinner-wrapper">
              <div class="spinner" :class="spinnerType">
                <template v-if="spinnerType === 'dots'">
                  <div class="dot" v-for="i in 3" :key="i"></div>
                </template>
                <template v-else-if="spinnerType === 'ring'">
                  <div class="ring-container">
                    <div class="ring ring-1"></div>
                    <div class="ring ring-2"></div>
                  </div>
                </template>
                <template v-else-if="spinnerType === 'pulse'">
                  <div class="pulse-container">
                    <div class="pulse-circle pulse-1"></div>
                    <div class="pulse-circle pulse-2"></div>
                    <div class="pulse-circle pulse-3"></div>
                  </div>
                </template>
                <template v-else-if="spinnerType === 'modern'">
                  <div class="modern-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-dot"></div>
                  </div>
                </template>
                <template v-else>
                  <!-- Enhanced circular spinner -->
                  <div class="circular-container">
                    <svg class="circular" viewBox="0 0 50 50">
                      <circle class="path" cx="25" cy="25" r="20" fill="none" stroke="currentColor" 
                              stroke-width="3" stroke-linecap="round"/>
                      <circle class="path-bg" cx="25" cy="25" r="20" fill="none" stroke="currentColor" 
                              stroke-width="3" opacity="0.2"/>
                    </svg>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- Enhanced Loading Message -->
            <div v-if="message" class="loading-message">
              <div class="main-message">{{ mainMessage }}</div>
              <div v-if="subMessage" class="sub-message">{{ subMessage }}</div>
            </div>
            
            <!-- Enhanced Progress Bar -->
            <div v-if="showProgress" class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress + '%' }">
                  <div class="progress-shine"></div>
                </div>
              </div>
              <div class="progress-text">{{ Math.round(progress) }}%</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default', // default, success, error, warning
    validator: (value) => ['default', 'success', 'error', 'warning'].includes(value)
  },
  spinnerType: {
    type: String,
    default: 'circular', // circular, dots, ring, pulse, modern
    validator: (value) => ['circular', 'dots', 'ring', 'pulse', 'modern'].includes(value)
  },
  blurBackground: {
    type: Boolean,
    default: true
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  }
})

const mainMessage = computed(() => {
  if (!props.message) return ''
  return props.message.split('\n')[0]
})

const subMessage = computed(() => {
  if (!props.message) return ''
  const lines = props.message.split('\n')
  return lines.length > 1 ? lines.slice(1).join('\n') : ''
})
</script>

<style scoped>
/* Modern Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(0px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.loading-overlay.blur-background {
  backdrop-filter: blur(8px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
}

/* Modern Container */
.loading-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 8px 25px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  max-width: 320px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.loading-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.loading-container.success {
  border-color: rgba(34, 197, 94, 0.3);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.loading-container.success::before {
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
  opacity: 1;
}

.loading-container.error {
  border-color: rgba(239, 68, 68, 0.3);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.loading-container.error::before {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  opacity: 1;
}

.loading-container.warning {
  border-color: rgba(245, 158, 11, 0.3);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
}

.loading-container.warning::before {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  opacity: 1;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

/* Enhanced Spinner Wrapper */
.spinner-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  color: #667eea;
  position: relative;
}

.success .spinner {
  color: #22c55e;
}

.error .spinner {
  color: #ef4444;
}

.warning .spinner {
  color: #f59e0b;
}

/* Enhanced Circular Spinner */
.circular-container {
  width: 48px;
  height: 48px;
  position: relative;
}

.circular {
  animation: rotate 2s linear infinite;
  width: 48px;
  height: 48px;
}

.path {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
  filter: drop-shadow(0 0 4px currentColor);
}

.path-bg {
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* Enhanced Dots Spinner */
.spinner.dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
  animation: dot-bounce 1.4s ease-in-out infinite both;
  box-shadow: 0 0 8px currentColor;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
.dot:nth-child(3) { animation-delay: 0s; }

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Enhanced Ring Spinner */
.ring-container {
  width: 48px;
  height: 48px;
  position: relative;
}

.ring {
  position: absolute;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.5s linear infinite;
}

.ring-1 {
  width: 48px;
  height: 48px;
  border-top: 3px solid currentColor;
  animation-duration: 1.5s;
}

.ring-2 {
  width: 36px;
  height: 36px;
  top: 6px;
  left: 6px;
  border-bottom: 3px solid currentColor;
  animation-duration: 1.2s;
  animation-direction: reverse;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Enhanced Pulse Spinner */
.pulse-container {
  width: 48px;
  height: 48px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-circle {
  position: absolute;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s ease-in-out infinite;
}

.pulse-1 {
  width: 48px;
  height: 48px;
  animation-delay: 0s;
}

.pulse-2 {
  width: 36px;
  height: 36px;
  animation-delay: 0.3s;
}

.pulse-3 {
  width: 24px;
  height: 24px;
  animation-delay: 0.6s;
}

@keyframes pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Modern Spinner */
.modern-spinner {
  width: 48px;
  height: 48px;
  position: relative;
}

.spinner-ring {
  width: 48px;
  height: 48px;
  border: 3px solid transparent;
  border-top: 3px solid currentColor;
  border-radius: 50%;
  animation: modern-spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
}

.spinner-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: currentColor;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: modern-pulse 1.2s ease-in-out infinite;
}

@keyframes modern-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes modern-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.3); }
}

/* Enhanced Message Styles */
.loading-message {
  color: #1f2937;
  line-height: 1.5;
  max-width: 280px;
}

.main-message {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.success .main-message {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error .main-message {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.warning .main-message {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sub-message {
  font-size: 14px;
  color: #6b7280;
  white-space: pre-line;
  line-height: 1.4;
}

/* Enhanced Progress Bar */
.progress-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.success .progress-fill {
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
}

.error .progress-fill {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.warning .progress-fill {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shine 2s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
}

/* Enhanced Transition Effects */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .loading-overlay {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%);
  }
  
  .loading-overlay.blur-background {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.08) 100%);
  }
  
  .loading-container {
    background: rgba(17, 24, 39, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  .loading-message {
    color: #f9fafb;
  }
  
  .sub-message {
    color: #9ca3af;
  }
  
  .progress-bar {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .progress-text {
    color: #9ca3af;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .loading-container {
    padding: 2rem 1.5rem;
    margin: 1rem;
    max-width: calc(100vw - 2rem);
    border-radius: 16px;
  }
  
  .main-message {
    font-size: 16px;
  }
  
  .sub-message {
    font-size: 13px;
  }
  
  .circular-container,
  .ring-container,
  .pulse-container,
  .modern-spinner {
    width: 40px;
    height: 40px;
  }
  
  .circular {
    width: 40px;
    height: 40px;
  }
  
  .ring-1 {
    width: 40px;
    height: 40px;
  }
  
  .ring-2 {
    width: 30px;
    height: 30px;
    top: 5px;
    left: 5px;
  }
  
  .pulse-1 {
    width: 40px;
    height: 40px;
  }
  
  .pulse-2 {
    width: 30px;
    height: 30px;
  }
  
  .pulse-3 {
    width: 20px;
    height: 20px;
  }
  
  .spinner-ring {
    width: 40px;
    height: 40px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .loading-container {
    border: 2px solid currentColor;
  }
  
  .spinner {
    filter: none;
  }
  
  .dot {
    box-shadow: none;
  }
}
</style>