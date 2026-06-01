<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="popupContainer"
      class="custom-share-popup-overlay"
      @click="handleOverlayClick"
    >
      <div
        ref="popup"
        class="custom-share-popup"
        :class="{ 'custom-share-popup--optimized': isLowPerformanceDevice }"
        :style="popupStyle"
        @click.stop
      >
        <!-- Header -->
        <div class="share-popup-header">
          <h3 class="share-popup-title">{{ t('music.share_popup.title') }}</h3>
          <button
            class="share-popup-close"
            :class="{ 'share-popup-close--optimized': isLowPerformanceDevice }"
            aria-label="Close share popup"
            @click="$emit('close')"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="share-popup-content">
          <p class="share-popup-description">{{ t('music.share_popup.description') }}</p>

          <!-- URL Input with Copy Button -->
          <div class="share-popup-input-group">
            <textarea
              ref="urlInput"
              :value="shareUrl"
              readonly
              class="share-popup-input share-popup-textarea"
              :class="{ 'share-popup-input--copied': justCopied }"
              rows="1"
              @click="selectAllText"
            ></textarea>
            <Button
              class="btn-glassmorphic share-popup-copy-btn"
              :class="{
                'btn-glassmorphic--copied': justCopied,
                'btn-glassmorphic--optimized': isLowPerformanceDevice
              }"
              :disabled="isLoading"
              unstyled
              :pt="{ ripple: { style: 'display: none !important' } }"
              @click="handleCopy"
            >
              <i v-if="justCopied" class="pi pi-check"></i>
              <i v-else class="pi pi-copy"></i>
              <span>{{ justCopied ? t('music.buttons.copied') : t('music.buttons.copy') }}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, nextTick, computed, watch, onMounted, onUnmounted } from 'vue'
  import Button from 'primevue/button'
  import { useShareFunctionality } from '~/composables/useShareFunctionality'
  import { usePerformanceOptimization } from '~/composables/usePerformanceOptimization'
  import { useI18n } from 'vue-i18n'

  interface Props {
    visible: boolean
    shareText: string
    shareUrl: string
    targetElement?: HTMLElement
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    close: []
  }>()

  const { copyToClipboard } = useShareFunctionality()
  const { isLowPerformanceDevice } = usePerformanceOptimization()
  const { t } = useI18n()

  const popupContainer = ref<HTMLElement>()
  const popup = ref<HTMLElement>()
  const urlInput = ref<HTMLTextAreaElement>()
  const justCopied = ref(false)
  const isLoading = ref(false)

  // Popup positioning
  const popupStyle = ref({})

  // Calculate popup position relative to target
  const calculatePosition = () => {
    if (!props.targetElement || !popup.value) return

    const target = props.targetElement.getBoundingClientRect()
    const popupEl = popup.value
    const popupRect = popupEl.getBoundingClientRect()

    // Position popup below the target with some offset
    let top = target.bottom + 10
    let left = target.left + target.width / 2 - popupRect.width / 2

    // Ensure popup stays within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Adjust horizontal position if off-screen
    if (left < 10) {
      left = 10
    } else if (left + popupRect.width > viewportWidth - 10) {
      left = viewportWidth - popupRect.width - 10
    }

    // If popup would go off-screen at bottom, position above target
    if (top + popupRect.height > viewportHeight - 10) {
      top = target.top - popupRect.height - 10
    }

    popupStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 10002
    }
  }

  // Watch for visibility changes to position popup
  watch(
    () => props.visible,
    (newVisible) => {
      if (newVisible) {
        nextTick(() => {
          calculatePosition()
        })
      }
    }
  )

  // Handle overlay click to close
  const handleOverlayClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      emit('close')
    }
  }

  // Select all text in input when clicked
  const selectAllText = async () => {
    await nextTick()
    if (urlInput.value) {
      urlInput.value.select()
    }
  }

  // Handle copy button click
  const handleCopy = async () => {
    if (isLoading.value) return

    isLoading.value = true
    // Copy only the URL without additional text
    const success = await copyToClipboard(props.shareUrl)

    if (success) {
      justCopied.value = true
      setTimeout(() => {
        justCopied.value = false
      }, 2000)
    }

    isLoading.value = false
  }

  // Handle window resize
  const handleResize = () => {
    if (props.visible) {
      calculatePosition()
    }
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
</script>

<style scoped>
  /* Overlay */
  .custom-share-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10001;
  }

  /* Popup */
  .custom-share-popup {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 100%
    );
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.05);
    width: 400px;
    max-width: 90vw;
    color: white;
    animation: popupFadeIn 0.2s ease-out;
  }

  .custom-share-popup--optimized {
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  }

  /* Header */
  .share-popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .share-popup-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .share-popup-close {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .share-popup-close:hover {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      transform: scale(1.05);
    }
  }

  .share-popup-close--optimized {
    transition: background-color 0.2s ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .share-popup-close--optimized:hover {
      transform: none;
    }
  }

  /* Content */
  .share-popup-content {
    padding: 1.5rem;
  }

  .share-popup-description {
    margin: 0 0 1.5rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  /* Input Group */
  .share-popup-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .share-popup-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    color: white;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .share-popup-textarea {
    resize: none;
    line-height: 1.4;
    font-family: inherit;
    white-space: pre-wrap;
    word-wrap: break-word;

    /* Glassmorphic scrollbar for webkit browsers */
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: background 0.2s ease;
    }

    @media (hover: hover) and (pointer: fine) {
      &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.2);
      }
    }

    &::-webkit-scrollbar-thumb:active {
      background: rgba(255, 255, 255, 0.35);
    }

    &::-webkit-scrollbar-corner {
      background: rgba(255, 255, 255, 0.05);
    }

    /* Firefox scrollbar */
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.15) rgba(255, 255, 255, 0.05);
  }

  .share-popup-input:focus {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }

  .share-popup-input--copied {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }

  /* Copy button specific styles */
  .share-popup-copy-btn {
    white-space: nowrap;
  }

  .btn-glassmorphic--copied {
    background: linear-gradient(135deg, #10b981, #059669) !important;
  }

  @media (hover: hover) and (pointer: fine) {
    .btn-glassmorphic--copied:hover {
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4) !important;
    }
  }

  /* Animations */
  @keyframes popupFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Arrow pointing to target */
  .custom-share-popup::before {
    content: '';
    position: absolute;
    top: -9px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid rgba(255, 255, 255, 0.1);
  }

  .custom-share-popup::after {
    content: '';
    position: absolute;
    top: -9px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-bottom: 7px solid rgba(255, 255, 255, 0.05);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .custom-share-popup {
      width: 95vw;
      margin: 1rem;
    }

    .share-popup-header,
    .share-popup-content {
      padding: 1.25rem;
    }

    .share-popup-input-group {
      flex-direction: column;
      gap: 0.75rem;
    }

    .share-popup-copy-btn {
      justify-content: center;
    }
  }

  /* Performance optimizations */
  @media (prefers-reduced-motion: reduce) {
    .custom-share-popup {
      animation: none;
    }

    @media (hover: hover) and (pointer: fine) {
      .share-popup-close:hover {
        transform: none;
      }
    }
  }
</style>
