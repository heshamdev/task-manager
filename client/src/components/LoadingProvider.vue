<template>
  <!-- Render all active loaders -->
  <LoadingOverlay 
    v-for="loader in activeLoaders" 
    :key="loader.id"
    :is-visible="loader.isVisible"
    :message="loader.message"
    :variant="loader.variant"
    :spinner-type="loader.spinnerType"
    :blur-background="loader.blurBackground"
    :show-progress="loader.showProgress"
    :progress="loader.progress"
  />
</template>

<script setup>
import { computed } from 'vue'
import LoadingOverlay from './LoadingOverlay.vue'
import { globalLoaders } from '../composables/useLoader.js'

// Get all active loaders from the global state
const activeLoaders = computed(() => {
  return Array.from(globalLoaders.values()).filter(loader => loader.isVisible)
})
</script>

<style scoped>
/* No additional styles needed - everything is handled in LoadingOverlay */
</style>