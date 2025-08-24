<template>
  <div class="performance-test-page min-h-screen bg-surface-950 text-primary-50 p-8" 
       :class="performanceClass"
       :style="performanceCSSVars">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-8">Performance Optimization Test</h1>
      
      <!-- Performance Detection Results -->
      <div class="mb-8 p-6 bg-surface-900 rounded-xl border border-surface-700">
        <h2 class="text-2xl font-semibold mb-4">Device Performance Detection</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="space-y-2">
            <p><strong>Performance Level:</strong> {{ performanceLevel.level }}</p>
            <p><strong>Performance Score:</strong> {{ performanceLevel.score }}/15</p>
            <p><strong>Performance Class:</strong> <code>{{ performanceClass }}</code></p>
          </div>
          
          <div class="space-y-2">
            <p><strong>Device Memory:</strong> {{ deviceMetrics.deviceMemory }}GB</p>
            <p><strong>CPU Cores:</strong> {{ deviceMetrics.hardwareConcurrency }}</p>
            <p><strong>Connection:</strong> {{ deviceMetrics.effectiveType }}</p>
            <p><strong>Pixel Ratio:</strong> {{ deviceMetrics.pixelRatio }}x</p>
          </div>
        </div>
        
        <div class="space-y-2">
          <p><strong>Features Enabled:</strong></p>
          <ul class="list-disc list-inside space-y-1 text-sm text-surface-200">
            <li>Animations: {{ performanceLevel.enableAnimations ? '✅ Enabled' : '❌ Disabled' }}</li>
            <li>Backdrop Blur: {{ performanceLevel.enableBackdropBlur ? '✅ Enabled' : '❌ Disabled' }}</li>
            <li>Complex Gradients: {{ performanceLevel.enableComplexGradients ? '✅ Enabled' : '❌ Disabled' }}</li>
            <li>Floating Effects: {{ performanceLevel.enableFloatingEffects ? '✅ Enabled' : '❌ Disabled' }}</li>
            <li>Parallax: {{ performanceLevel.enableParallax ? '✅ Enabled' : '❌ Disabled' }}</li>
          </ul>
        </div>
      </div>

      <!-- CSS Variables Test -->
      <div class="mb-8 p-6 bg-surface-900 rounded-xl border border-surface-700">
        <h2 class="text-2xl font-semibold mb-4">CSS Variables</h2>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Blur Strength:</strong> {{ performanceCSSVars['--perf-blur-strength'] }}</p>
            <p><strong>Animation Duration:</strong> {{ performanceCSSVars['--perf-animation-duration'] }}</p>
          </div>
          <div>
            <p><strong>Max Animations:</strong> {{ performanceCSSVars['--perf-max-animations'] }}</p>
            <p><strong>Opacity:</strong> {{ performanceCSSVars['--perf-opacity'] }}</p>
          </div>
        </div>
      </div>

      <!-- Visual Test Elements -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Visual Test Elements</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Test Card with Backdrop Blur -->
          <div 
            class="test-card p-6 rounded-xl border border-white/10 relative overflow-hidden"
            :style="performanceCSSVars"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
            <div class="relative z-10">
              <h3 class="text-lg font-semibold mb-2">Backdrop Blur Test</h3>
              <p class="text-sm text-surface-200">This card should have blur effects on high-performance devices.</p>
            </div>
          </div>
          
          <!-- Test Card with Animation -->
          <div class="test-animation-card p-6 bg-surface-800 rounded-xl">
            <h3 class="text-lg font-semibold mb-2">Animation Test</h3>
            <p class="text-sm text-surface-200">This card should have floating animation on high-performance devices.</p>
          </div>
        </div>
      </div>

      <!-- Performance Actions -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Actions</h2>
        <div class="flex gap-4">
          <button 
            @click="forceRedetection"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Force Re-detection
          </button>
          
          <NuxtLink 
            to="/music/midnight-echoes?from=music"
            class="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 rounded-lg transition-colors"
          >
            Test Music Page
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePerformanceOptimization } from '~/composables/usePerformanceOptimization'

// Page meta
definePageMeta({
  title: 'Performance Test | WBM Band',
  description: 'Performance optimization testing page'
})

// Use the performance optimization composable
const {
  deviceMetrics,
  performanceLevel,
  performanceCSSVars,
  getPerformanceClass,
  detectDeviceCapabilities
} = usePerformanceOptimization()

const performanceClass = computed(() => getPerformanceClass())

const forceRedetection = () => {
  detectDeviceCapabilities()
}
</script>

<style scoped>
.test-card {
  backdrop-filter: blur(var(--perf-blur-strength, 0px));
  -webkit-backdrop-filter: blur(var(--perf-blur-strength, 0px));
}

/* Animation only for high-performance devices */
.perf-high .test-animation-card {
  animation: testFloat 3s ease-in-out infinite;
}

@keyframes testFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Disable animation on lower performance */
.perf-medium .test-animation-card,
.perf-low .test-animation-card {
  animation: none;
}
</style>
