<template>
  <Teleport to="body">
    <Transition
      name="modal"
      appear
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-show="isVisible"
        class="modal-backdrop"
        :class="{ 'is-animating': isAnimating }"
        @click="handleBackdropClick"
      >
        <div
          ref="dialogRef"
          class="modal-container"
          :class="{ 'is-animating': isAnimating, 'content-ready': contentReady }"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          tabindex="-1"
          @click.stop
        >
          <!-- The glass host carries NO transform/opacity/will-change of its own
               (those go on .modal-container) so its backdrop-filter frost + lens
               keep working — see the backdrop-root note in the <style> below.
               v-lg-physics adds the Chromium-only refraction lens that warps the
               (lightly darkened) page behind the panel; Safari/Firefox no-op it
               and fall back to the soft frost. -->
          <div
            v-lg-physics="LENS"
            class="modal-content liquid-glass liquid-glass--panel liquid-glass--refract"
          >
            <button
              class="modal-close-btn liquid-glass liquid-glass--pill liquid-glass-interactive"
              aria-label="Close modal"
              @click="$emit('close')"
            >
              <i class="pi pi-times"></i>
            </button>

            <div class="modal-scroll-wrapper">
              <slot />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

  interface Props {
    isVisible: boolean
    preloadImageUrl?: string
    /** Accessible name for the dialog (screen readers announce it on open). */
    ariaLabel?: string
  }

  interface Emits {
    (e: 'close'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    preloadImageUrl: undefined,
    ariaLabel: 'Dialog'
  })
  const emit = defineEmits<Emits>()

  // Refraction lens for the glass panel (v-lg-physics): a per-geometry Snell's
  // -law displacement map warps the page behind the modal, concentrated at the
  // rounded edges. Chromium-only; a no-op elsewhere (soft frost stands in).
  const LENS = { strength: 104, edge: 140, curve: 1.45 }

  const isAnimating = ref(false)
  const contentReady = ref(false)

  // --- Accessibility: focus management + trap ---
  const dialogRef = ref<HTMLElement>()
  // The element focused before the modal opened, so we can restore it on close.
  let previouslyFocused: HTMLElement | null = null

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',')

  const getFocusable = (): HTMLElement[] => {
    if (!dialogRef.value) return []
    return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    )
  }

  // Move focus into the dialog once it's shown (after the v-show paint).
  const focusDialog = () => {
    nextTick(() => {
      const focusable = getFocusable()
      ;(focusable[0] ?? dialogRef.value)?.focus()
    })
  }

  // Resolve the preload URL through the app base path — otherwise on a sub-path
  // deploy (GitHub Pages, baseURL=/WBM-Band-WebSite/) the pre-decode Image()
  // requests the unprefixed /images/... and 404s.
  const { resolveUrl } = useAssetUrl()

  const decodeImage = (url?: string) => {
    return new Promise<void>((resolve) => {
      if (!url) return resolve()
      const img = new Image()
      img.src = resolveUrl(url)
      // soft timeout so we don't block animation indefinitely
      const t = setTimeout(() => resolve(), 160)
      if ((img as any).decode) {
        img
          .decode()
          .then(() => {
            clearTimeout(t)
            resolve()
          })
          .catch(() => {
            clearTimeout(t)
            resolve()
          })
      } else {
        img.onload = () => {
          clearTimeout(t)
          resolve()
        }
        img.onerror = () => {
          clearTimeout(t)
          resolve()
        }
      }
    })
  }

  const setBodyAnimating = (on: boolean) => {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('modal-animating', on)
  }

  const prepareContent = async () => {
    contentReady.value = false
    await decodeImage(props.preloadImageUrl)
    requestAnimationFrame(() => {
      contentReady.value = true
    })
  }

  const onEnter = () => {
    isAnimating.value = true
    setBodyAnimating(true)
    prepareContent()
  }
  const onAfterEnter = () => {
    isAnimating.value = false
    setBodyAnimating(false)
  }
  const onLeave = () => {
    isAnimating.value = true
    setBodyAnimating(true)
  }
  const onAfterLeave = () => {
    isAnimating.value = false
    setBodyAnimating(false)
  }

  // Eagerly pre-decode when the preload URL changes (helps next open)
  watch(
    () => props.preloadImageUrl,
    (url) => {
      if (url) decodeImage(url)
    }
  )

  const handleBackdropClick = () => {
    emit('close')
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (!props.isVisible) return

    if (event.key === 'Escape') {
      emit('close')
      return
    }

    // Focus trap: keep Tab within the dialog so keyboard/screen-reader users
    // can't tab into the page behind the open modal.
    if (event.key !== 'Tab') return

    const focusable = getFocusable()
    if (focusable.length === 0) {
      event.preventDefault()
      dialogRef.value?.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement | null
    const inDialog = !!active && !!dialogRef.value?.contains(active)

    if (event.shiftKey && (active === first || !inDialog)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (active === last || !inDialog)) {
      event.preventDefault()
      first.focus()
    }
  }

  const preventBodyScroll = () => {
    if (typeof window === 'undefined') return

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const body = document.body

    body.style.overflow = 'hidden'
    body.style.paddingRight = `${scrollbarWidth}px`

    body.classList.add('modal-open')
  }

  const restoreBodyScroll = () => {
    if (typeof window === 'undefined') return

    const body = document.body
    body.style.overflow = ''
    body.style.paddingRight = ''

    body.classList.remove('modal-open')
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    if (props.isVisible) {
      previouslyFocused = document.activeElement as HTMLElement | null
      preventBodyScroll()
      focusDialog()
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    restoreBodyScroll()
    // Restore focus if the modal is torn down while open.
    previouslyFocused?.focus?.()
    previouslyFocused = null
  })

  watch(
    () => props.isVisible,
    (visible) => {
      if (visible) {
        // Remember the trigger so focus can return there on close.
        previouslyFocused = document.activeElement as HTMLElement | null
        preventBodyScroll()
        focusDialog()
      } else {
        restoreBodyScroll()
        // Return focus to whatever opened the modal (keyboard a11y).
        previouslyFocused?.focus?.()
        previouslyFocused = null
      }
    }
  )
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

    /* Just a SMALL darkening scrim — no blur. The page stays clearly visible
       behind it so the glass panel has something real to refract; the darkening
       is what the lens then warps + the panel tints. (Was a heavy 0.85 black +
       blur(14px) veil; the modal itself is now the glass, not the backdrop.) */
    background: rgba(0, 0, 0, 0.42);

    /* No transform/filter here: a transform on the backdrop would become the
       backdrop root for the panel inside and suppress its frost. */
    will-change: opacity;
    /* Open/close cross-fades OPACITY only — the veil's blur is fixed, so we
       drop the old backdrop-filter interpolation (cheaper, still smooth). */
    transition: opacity 0.26s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* The entrance (slide + fade) lives on the CONTAINER, not the glass host.
     A transform/opacity on the .liquid-glass element (or its ancestor mid-
     animation) makes it a backdrop root and kills its frost + lens. By moving
     the motion up one level, the glass host stays clean at rest and refracts. */
  .modal-container {
    position: relative;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    will-change: transform, opacity;
  }

  .modal-container:not(.content-ready) {
    opacity: 0;
    transform: translateY(16px);
  }

  .modal-container.content-ready {
    transition:
      transform 0.26s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.26s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .modal-container.is-animating {
    pointer-events: none;
  }

  .modal-content {
    position: relative;
    /* Glass material (frost, rim, elevation) comes from
       .liquid-glass .liquid-glass--panel. Here we push a RICH glass surface so
       it reads as a real glass slab over the dark page, not just a tinted hole:
       a lighter translucent tint, strong vibrancy (saturate + brightness) and
       bright specular highlights (rim + glossy top streak). --lg-tint-flat stays
       near-opaque for the reduced-transparency fallback. */
    --lg-radius: 24px;
    --lg-tint: rgb(13 15 24 / 0.34);
    --lg-tint-flat: rgb(10 12 18 / 0.95);
    /* Vibrancy: lift + saturate whatever's behind so the frosted glass glows
       like the macOS material rather than looking like a flat grey panel. */
    --lg-saturate: 185%;
    --lg-saturate-full: 200%;
    --lg-brightness: 1.12;
    /* Bright specular shell — crisp lit rim + a glossy top sheen streak. */
    --lg-rim: rgb(255 255 255 / 0.78);
    --lg-rim-soft: rgb(255 255 255 / 0.22);
    --lg-gloss: rgb(255 255 255 / 0.36);
    --lg-sheen: rgb(255 255 255 / 0.14);
    /* Proper FROST — a thick, clearly-glassy blur (like the header bar, but
       heavier). This is the Safari / iOS / Firefox value; Chromium gets a
       slightly lower frost via `.liquid-glass--refract` so the displacement
       lens still bends the blurred page through it. */
    --lg-blur: 22px;
    --lg-blur-full: 22px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    /* NOTE: no transform / opacity / will-change / contain:paint on this host. */
  }

  .modal-scroll-wrapper {
    overflow-y: auto;
    flex: 1;

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

    /* Round glass pill: tint/frost/rim + hover border + press glow & active
       scale all come from .liquid-glass .liquid-glass--pill
       .liquid-glass-interactive. Only force the circular radius here. */
    --lg-radius: 50%;
    /* Slightly darker tint than a default pill so the icon stays legible on
       bright cover art behind the modal. */
    --lg-tint: rgb(8 10 16 / 0.55);
    --lg-tint-flat: rgb(8 10 16 / 0.92);

    color: white;
    font-size: 1.125rem;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.modal-enter-active),
  :global(.modal-leave-active) {
    /* Cross-fade the veil on OPACITY only — its blur is a fixed value from
       .liquid-glass-veil, so there is nothing to interpolate. */
    transition: opacity 0.26s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(.modal-enter-from),
  :global(.modal-leave-to) {
    opacity: 0;
  }

  :global(.modal-enter-active) .modal-container,
  :global(.modal-leave-active) .modal-container {
    transition:
      transform 0.26s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.26s cubic-bezier(0.4, 0, 0.2, 1);
  }

  :global(.modal-enter-from) .modal-container,
  :global(.modal-leave-to) .modal-container {
    transform: translateY(16px);
    opacity: 0;
  }

  :global(.modal-enter-to) .modal-container,
  :global(.modal-leave-from) .modal-container {
    transform: translateY(0);
    opacity: 1;
  }

  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 0.5rem;
    }

    .modal-content {
      /* Radius must go through --lg-radius so the lens clip-path tracks it
         (the global tier system handles blur strength — no override here). */
      --lg-radius: 20px;
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
