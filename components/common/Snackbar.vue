<template>
  <ClientOnly>
    <div class="snackbar-container">
      <div class="snackbar-wrapper">
        <TransitionGroup
          name="snackbar"
          tag="div"
          class="snackbar-list"
        >
          <div
            v-for="snackbar in visibleSnackbars"
            :key="snackbar.id"
            class="snackbar-item"
            :class="getSnackbarClasses(snackbar.type)"
            @mouseenter="pauseTimer(snackbar.id)"
            @mouseleave="resumeTimer(snackbar.id)"
          >
            <!-- Icon -->
            <div class="snackbar-icon">
              <i :class="getIconClass(snackbar.type)"></i>
            </div>

            <!-- Content -->
            <div class="snackbar-content">
              <div class="snackbar-message">
                {{ snackbar.message }}
              </div>
              <div v-if="snackbar.subtitle" class="snackbar-subtitle">
                {{ snackbar.subtitle }}
              </div>
            </div>

          <!-- Close Button -->
          <button
            class="snackbar-close"
            @click="hideSnackbar(snackbar.id)"
            aria-label="Close notification"
          >
            <i class="pi pi-times"></i>
          </button>

          <!-- Progress Bar -->
          <div 
            v-if="snackbar.timeout > 0"
            class="snackbar-progress"
            :class="getProgressClasses(snackbar.type)"
            :data-snackbar-id="snackbar.id"
            :style="{ animationDuration: `${snackbar.timeout}ms` }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSnackbarStore } from '~/store/snackbar';

const snackbarStore = useSnackbarStore();

const visibleSnackbars = computed(() => snackbarStore.visibleSnackbars);

const hideSnackbar = (id: number) => {
  snackbarStore.hideSnackbar(id);
};

const pauseTimer = (id: number) => {
  snackbarStore.pauseTimer(id);
  const progressBar = document.querySelector(`[data-snackbar-id="${id}"]`) as HTMLElement;
  if (progressBar) {
    progressBar.style.animationPlayState = 'paused';
  }
};

const resumeTimer = (id: number) => {
  snackbarStore.resumeTimer(id);
  const progressBar = document.querySelector(`[data-snackbar-id="${id}"]`) as HTMLElement;
  if (progressBar) {
    progressBar.style.animationPlayState = 'running';
  }
};

const getSnackbarClasses = (type: string) => {
  const baseClasses = 'snackbar-base';
  const typeClasses = {
    success: 'snackbar-success',
    error: 'snackbar-error',
    warning: 'snackbar-warning',
    info: 'snackbar-info',
  };
  return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses] || typeClasses.info}`;
};

const getIconClass = (type: string) => {
  const iconClasses = {
    success: 'pi pi-check-circle',
    error: 'pi pi-times-circle',
    warning: 'pi pi-exclamation-triangle',
    info: 'pi pi-info-circle',
  };
  return iconClasses[type as keyof typeof iconClasses] || iconClasses.info;
};

const getProgressClasses = (type: string) => {
  const progressClasses = {
    success: 'progress-success',
    error: 'progress-error',
    warning: 'progress-warning',
    info: 'progress-info',
  };
  return progressClasses[type as keyof typeof progressClasses] || progressClasses.info;
};
</script>

<style lang="scss" scoped>
.snackbar-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1200;
}

.snackbar-wrapper {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  max-width: 420px;
  width: 100%;
}

.snackbar-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.snackbar-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  pointer-events: auto;
  min-width: 320px;
  max-width: 420px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.snackbar-item:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.snackbar-base {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: rgb(248, 250, 252);
}

.snackbar-success {
  background: rgba(5, 46, 22, 0.85);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-left: 4px solid rgb(34, 197, 94);
  
  .snackbar-icon {
    color: rgb(74, 222, 128);
  }
}

.snackbar-error {
  background: rgba(69, 10, 10, 0.85);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-left: 4px solid rgb(239, 68, 68);
  
  .snackbar-icon {
    color: rgb(248, 113, 113);
  }
}

.snackbar-warning {
  background: rgba(69, 26, 3, 0.85);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-left: 4px solid rgb(245, 158, 11);
  
  .snackbar-icon {
    color: rgb(251, 191, 36);
  }
}

.snackbar-info {
  background: rgba(23, 37, 84, 0.85);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-left: 4px solid rgb(59, 130, 246);
  
  .snackbar-icon {
    color: rgb(96, 165, 250);
  }
}

.snackbar-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.snackbar-content {
  flex: 1;
  min-width: 0;
}

.snackbar-message {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
  color: rgb(248, 250, 252);
  font-family: 'Space Grotesk', sans-serif;
  margin: 0;
}

.snackbar-subtitle {
  font-size: 0.75rem;
  color: rgb(203, 213, 225);
  margin-top: 0.25rem;
  line-height: 1;
  font-family: 'Space Grotesk', sans-serif;
  margin-bottom: 0;
}

.snackbar-close {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(148, 163, 184);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgb(248, 250, 252);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .pi {
    font-size: 0.875rem;
  }
}

.snackbar-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  border-radius: 0 0 0.75rem 0.75rem;
  width: 100%;
}

.progress-success {
  background: linear-gradient(90deg, rgb(34, 197, 94), rgb(74, 222, 128));
  animation: progress-shrink linear forwards;
}

.progress-error {
  background: linear-gradient(90deg, rgb(239, 68, 68), rgb(248, 113, 113));
  animation: progress-shrink linear forwards;
}

.progress-warning {
  background: linear-gradient(90deg, rgb(245, 158, 11), rgb(251, 191, 36));
  animation: progress-shrink linear forwards;
}

.progress-info {
  background: linear-gradient(90deg, rgb(59, 130, 246), rgb(96, 165, 250));
  animation: progress-shrink linear forwards;
}

@keyframes progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

// Smooth transition animations
.snackbar-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.snackbar-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53);
  position: absolute;
  right: 0;
}

.snackbar-enter-from {
  transform: translateX(120%) scale(0.9);
  opacity: 0;
}

.snackbar-leave-to {
  transform: translateX(120%) scale(0.9);
  opacity: 0;
}

.snackbar-move {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

// Responsive design
@media (max-width: 640px) {
  .snackbar-wrapper {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
  
  .snackbar-item {
    min-width: auto;
    max-width: none;
  }
}
</style>
