<template>
  <ClientOnly>
    <Transition name="loading-bar">
      <div 
        v-if="isLoading" 
        class="global-loading-bar"
      >
        <div 
          class="loading-progress"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useGlobalLoadingStore } from '~/store/globalLoading'

const globalLoadingStore = useGlobalLoadingStore()

const progress = computed(() => {
  if (!globalLoadingStore.isLoading && globalLoadingStore.loadingProgress === 100) {
    return 100
  }
  return globalLoadingStore.isLoading ? Math.max(globalLoadingStore.loadingProgress, 10) : 0
})

const isLoading = computed(() => globalLoadingStore.isLoading)
</script>

<style scoped>
.global-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 9999;
  background: rgba(148, 163, 184, 0.1);
  overflow: hidden;
}

.loading-progress {
  height: 100%;
  background: linear-gradient(
    90deg, 
    rgb(34, 197, 94), 
    rgb(59, 130, 246), 
    rgb(168, 85, 247)
  );
  background-size: 200% 100%;
  animation: progressGradient 2s ease-in-out infinite;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 2px 2px 0;
  box-shadow: 
    0 0 10px rgba(34, 197, 94, 0.5),
    0 0 20px rgba(59, 130, 246, 0.3);
}

@keyframes progressGradient {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Transition animations */
.loading-bar-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.loading-bar-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.loading-bar-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.loading-bar-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* Responsive design */
@media (max-width: 640px) {
  .global-loading-bar {
    height: 2px;
  }
}
</style>
