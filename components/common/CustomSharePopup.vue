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
        class="custom-share-popup liquid-glass liquid-glass--panel liquid-glass--lens"
        :style="popupStyle"
        @click.stop
      >
        <!-- Glass pointer toward the share button (desktop). A separate element,
             not a ::before/::after — those pseudos belong to the liquid-glass
             material (frost + rim). -->
        <span
          class="share-popup-arrow"
          :class="arrowPlacement"
          :style="arrowStyle"
          aria-hidden="true"
        />

        <!-- Header -->
        <div class="share-popup-header">
          <h3 class="share-popup-title">{{ t('music.share_popup.title') }}</h3>
          <UiButton
            variant="dimmed"
            size="sm"
            shape="circle"
            icon-only
            icon="pi pi-times"
            aria-label="Close share popup"
            @click="$emit('close')"
          />
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
  import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
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
  // Arrow (pointer toward the share button). placement = which side of the button
  // the popup sits on; arrowStyle.left aligns the arrow with the button's centre.
  const arrowPlacement = ref<'below' | 'above'>('below')
  const arrowStyle = ref({})

  const ARROW_GAP = 12 // space between button and popup, leaving room for the arrow

  // Calculate popup position relative to target
  const calculatePosition = () => {
    if (!props.targetElement || !popup.value) return

    const target = props.targetElement.getBoundingClientRect()
    const popupEl = popup.value
    const popupRect = popupEl.getBoundingClientRect()

    // Position popup below the target with some offset
    let top = target.bottom + ARROW_GAP
    let placement: 'below' | 'above' = 'below'
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
      top = target.top - popupRect.height - ARROW_GAP
      placement = 'above'
    }

    // Align the arrow with the button's horizontal centre, clamped so it never
    // slides past the popup's rounded corners (even when the popup was nudged to
    // stay on-screen).
    const buttonCenterX = target.left + target.width / 2
    const arrowLeft = Math.max(18, Math.min(popupRect.width - 18, buttonCenterX - left))

    arrowPlacement.value = placement
    arrowStyle.value = { left: `${arrowLeft}px` }
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

  /* Popup — liquid-glass panel (frost/rim/lens handled by the global system).
     Keep the light translucent wash as the tint so legibility matches the
     original look; --lg-radius preserves the original 1rem corners (the lens
     layer clips to it, so it must be set via this var, not border-radius). */
  .custom-share-popup {
    --lg-radius: 1rem;
    --lg-tint: linear-gradient(135deg, rgb(255 255 255 / 0.1) 0%, rgb(255 255 255 / 0.05) 100%);
    width: 400px;
    max-width: 90vw;
    color: white;
  }

  /* Materialize from the first frame the popup mounts (like the release modal):
     NO opacity/transform on the host — those would make it a backdrop root and
     suppress the frost — so the blur ramps in immediately. The frost grows on
     the ::before, the content (+ arrow) fades and rises. */
  .custom-share-popup::before {
    animation: popupFrostIn 0.4s ease-out both;
  }

  @keyframes popupFrostIn {
    from {
      -webkit-backdrop-filter: blur(0) saturate(var(--lg-saturate)) brightness(var(--lg-brightness));
      backdrop-filter: blur(0) saturate(var(--lg-saturate)) brightness(var(--lg-brightness));
    }
    to {
      -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate))
        brightness(var(--lg-brightness));
      backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate))
        brightness(var(--lg-brightness));
    }
  }

  .share-popup-header,
  .share-popup-content {
    animation: popupContentIn 0.4s ease-out both;
  }

  @keyframes popupContentIn {
    from {
      opacity: 0;
      transform: translateY(7px);
    }
    to {
      opacity: 1;
      transform: none;
    }
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

  /* Close button is now <UiButton variant="clear" shape="circle" icon-only> —
     liquid-glass material + the shared Apple-glass morph come from the system. */

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

  /* Glass pointer toward the share button. A frosted triangle (clip-path on a
     small backdrop-filtered box) that samples the page just like the popup, so
     it reads as the same glass tapering to a point. Horizontal position comes
     from arrowStyle (aligned to the button centre); placement flips it up/down
     depending on whether the popup sits below or above the button. */
  .share-popup-arrow {
    position: absolute;
    width: 22px;
    height: 12px;
    margin-left: -11px; /* centre on the arrowStyle.left anchor */
    /* A touch more tint than the body so the small point still reads as glass
       over the dark gap, plus the page frost behind it. */
    background: linear-gradient(160deg, rgb(255 255 255 / 0.17) 0%, rgb(255 255 255 / 0.07) 100%);
    -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate))
      brightness(var(--lg-brightness));
    backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate))
      brightness(var(--lg-brightness));
    z-index: -1;
    animation: popupFrostIn 0.4s ease-out both;
  }

  .share-popup-arrow.below {
    top: -11px; /* base meets the popup's top edge, tip points up at the button */
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
    /* specular rim on the leading (top) point + a little depth below */
    filter: drop-shadow(0 -1px 0.5px rgb(255 255 255 / 0.3))
      drop-shadow(0 1px 2px rgb(0 0 0 / 0.22));
  }

  .share-popup-arrow.above {
    bottom: -11px; /* tip points down at the button */
    clip-path: polygon(0 0, 100% 0, 50% 100%);
    filter: drop-shadow(0 1px 0.5px rgb(255 255 255 / 0.3))
      drop-shadow(0 -1px 2px rgb(0 0 0 / 0.22));
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
    .custom-share-popup,
    .custom-share-popup::before,
    .share-popup-arrow,
    .share-popup-header,
    .share-popup-content {
      animation: none;
    }
  }
</style>
