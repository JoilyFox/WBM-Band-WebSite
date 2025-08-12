<template>
  <Teleport to="body">
    <Transition name="modal" appear @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave" @after-leave="onAfterLeave">
      <div 
        v-show="isVisible"
        class="modal-backdrop"
        :class="{ 'is-animating': isAnimating }"
        @click="handleBackdropClick"
      >
        <div 
          class="modal-container"
          @click.stop
        >
          <div class="modal-content" :class="{ 'is-animating': isAnimating, 'content-ready': contentReady }">
            <!-- Close Button -->
            <button
              class="modal-close-btn"
              @click="$emit('close')"
              aria-label="Close modal"
            >
              <i class="pi pi-times"></i>
            </button>

            <!-- Scrollable Content Wrapper -->
            <div class="modal-scroll-wrapper">
              <!-- Music Detail Content -->
              <MusicDetailContent 
                :release="release"
                :is-modal="true"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { MusicRelease } from '~/data/musicLibrary'

interface Props {
  release: MusicRelease
  isVisible: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isAnimating = ref(false)
const contentReady = ref(false)

const decodeImage = (url?: string) => {
  return new Promise<void>((resolve) => {
    if (!url) return resolve()
    const img = new Image()
    img.src = url
    // soft timeout so we don't block animation indefinitely
    const t = setTimeout(() => resolve(), 160)
    if ((img as any).decode) {
      img.decode().then(() => { clearTimeout(t); resolve() }).catch(() => { clearTimeout(t); resolve() })
    } else {
      img.onload = () => { clearTimeout(t); resolve() }
      img.onerror = () => { clearTimeout(t); resolve() }
    }
  })
}

const setBodyAnimating = (on: boolean) => {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('modal-animating', on)
}

const prepareContent = async () => {
  contentReady.value = false
  await decodeImage(props.release?.imageUrl)
  // one more frame to ensure styles apply
  requestAnimationFrame(() => { contentReady.value = true })
}

const onEnter = () => { 
  isAnimating.value = true; 
  setBodyAnimating(true)
  prepareContent()
}
const onAfterEnter = () => { isAnimating.value = false; setBodyAnimating(false) }
const onLeave = () => { isAnimating.value = true; setBodyAnimating(true) }
const onAfterLeave = () => { isAnimating.value = false; setBodyAnimating(false) }

// Eagerly pre-decode when the release changes (helps next open)
watch(() => props.release?.imageUrl, (url) => { if (url) decodeImage(url) })

const handleBackdropClick = () => {
  emit('close')
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

const preventBodyScroll = () => {
  if (typeof window === 'undefined') return
  
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  const body = document.body
  
  body.style.overflow = 'hidden'
  body.style.paddingRight = `${scrollbarWidth}px`
  
  // Pause expensive animations when modal opens
  body.classList.add('modal-open')
}

const restoreBodyScroll = () => {
  if (typeof window === 'undefined') return
  
  const body = document.body
  body.style.overflow = ''
  body.style.paddingRight = ''
  
  // Resume animations when modal closes
  body.classList.remove('modal-open')
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  // Prevent body scroll when modal is open
  if (props.isVisible) {
    preventBodyScroll()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  // Restore body scroll
  restoreBodyScroll()
})

// Watch for visibility changes to control body scroll
watch(() => props.isVisible, (visible) => {
  if (visible) {
    preventBodyScroll()
  } else {
    restoreBodyScroll()
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  
  /* Optimized glassmorphic background for better performance */
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  /* GPU acceleration for smooth animations */
  transform: translateZ(0);
  will-change: opacity;
  transition: opacity 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Temporarily disable expensive effects during animation */
.modal-backdrop.is-animating {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  /* keep the same background to avoid visual jump */
}

.modal-container {
  position: relative;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-content {
  position: relative;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  
  /* Performance optimizations */
  transform: translateZ(0);
  will-change: transform, opacity;
  contain: layout style paint;
  backface-visibility: hidden;
}

/* Hide content until the cover is decoded, then fade/slide it in */
.modal-content:not(.content-ready) {
  opacity: 0;
  transform: translateY(16px);
}

.modal-content.content-ready {
  transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Reduce heavy effects only during the animation frames */
.modal-content.is-animating {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  pointer-events: none; /* prevent hover-triggered paints while animating */
}

.modal-scroll-wrapper {
  overflow-y: auto;
  flex: 1;
  
  /* Custom scrollbar for the modal content */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.modal-scroll-wrapper::-webkit-scrollbar {
  width: 6px;
}

.modal-scroll-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.modal-scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.modal-scroll-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.modal-close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  
  width: 2.5rem;
  height: 2.5rem;
  
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  color: white;
  font-size: 1.125rem;
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
  
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Disable hover effects on mobile/touch devices */
@media (hover: none) and (pointer: coarse) {
  .modal-close-btn:hover {
    background: rgba(0, 0, 0, 0.7);
    border-color: rgba(255, 255, 255, 0.2);
    transform: none;
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
}

.modal-close-btn:active {
  transform: scale(0.95);
}

/* Modal Transitions - explicit and non-conflicting */
/* Backdrop/overlay fades on root element (use :global for scoped + teleport) */
:global(.modal-enter-active),
:global(.modal-leave-active) {
  transition: opacity 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.modal-enter-from),
:global(.modal-leave-to) {
  opacity: 0;
}

/* Content slide + fade (target transition classes globally) */
:global(.modal-enter-active) .modal-content,
:global(.modal-leave-active) .modal-content {
  transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}

:global(.modal-enter-from) .modal-content,
:global(.modal-leave-to) .modal-content {
  transform: translateY(16px);
  opacity: 0;
}

:global(.modal-enter-to) .modal-content,
:global(.modal-leave-from) .modal-content {
  transform: translateY(0);
  opacity: 1;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .modal-backdrop {
    padding: 0.5rem;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  
  .modal-content {
    border-radius: 20px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  
  .modal-close-btn {
    top: 1rem;
    right: 1rem;
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1rem;
  }
}
</style>
