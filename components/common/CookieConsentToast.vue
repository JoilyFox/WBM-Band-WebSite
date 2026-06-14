<template>
  <Transition name="cookie-toast">
    <div
      v-if="visible"
      class="cookie-toast liquid-glass liquid-glass--panel"
      :style="dragStyle"
      role="dialog"
      :aria-label="t('cookies.banner.aria')"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
    >
      <p class="cookie-toast__message">{{ t('cookies.banner.message') }}</p>
      <div class="cookie-toast__actions">
        <UiButton
          variant="solid"
          size="sm"
          shape="rounded"
          class="cookie-toast__btn--accept"
          @click="onAccept"
        >
          {{ t('cookies.banner.accept') }}
        </UiButton>
        <UiButton
          variant="outline"
          size="sm"
          shape="rounded"
          class="cookie-toast__btn--decline"
          @click="onDecline"
        >
          {{ t('cookies.banner.decline') }}
        </UiButton>
        <NuxtLinkLocale to="/cookies-policy" class="cookie-toast__link">
          {{ t('cookies.banner.details') }}
        </NuxtLinkLocale>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed, type CSSProperties } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useCookieConsent } from '~/composables/useCookieConsent'

  const { t } = useI18n({ useScope: 'global' })
  const { isUndecided, accept, decline, snooze, hydrate } = useCookieConsent()

  // Suppress during SSR + first paint to avoid hydration flash and to
  // keep LCP clean. delayed flips true ~1.2s after mount so the toast
  // animates in after the page has settled.
  const delayed = ref(false)

  const visible = computed(() => delayed.value && isUndecided.value)

  onMounted(() => {
    hydrate()
    if (!isUndecided.value) return
    setTimeout(() => {
      delayed.value = true
    }, 1200)
  })

  function onAccept() {
    accept()
  }

  function onDecline() {
    decline()
  }

  // --- Swipe-to-snooze gesture (mobile) ---
  // Past this displacement, releasing the touch flies the toast off-screen
  // and snoozes it for the rest of this session (next reload re-shows it).
  const SWIPE_DISMISS_PX = 80
  // Lower threshold to commit to "this is a horizontal drag, not a tap".
  const SWIPE_LOCK_PX = 8

  const dragX = ref(0)
  const isDragging = ref(false)
  const releasing = ref(false)
  let startX = 0
  let startY = 0
  let axisLocked: 'horizontal' | 'vertical' | null = null

  const dragStyle = computed<CSSProperties>(() => {
    if (!isDragging.value && !releasing.value) return {}
    const fade = Math.max(0.2, 1 - Math.abs(dragX.value) / 350)
    return {
      transform: `translateX(${dragX.value}px)`,
      opacity: String(fade),
      transition: releasing.value
        ? 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease'
        : 'none'
    }
  })

  function onTouchStart(e: TouchEvent) {
    // Touches that start on an interactive element should behave as taps.
    const target = e.target as HTMLElement | null
    if (target?.closest('button, a')) return
    if (e.touches.length !== 1) return

    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    dragX.value = 0
    isDragging.value = false
    releasing.value = false
    axisLocked = null
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 1 || axisLocked === 'vertical') return

    const dx = e.touches[0].clientX - startX
    const dy = e.touches[0].clientY - startY

    // Lock onto the dominant axis on first significant movement so we
    // don't fight vertical scroll.
    if (!axisLocked) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_LOCK_PX) {
        axisLocked = 'vertical'
        return
      }
      if (Math.abs(dx) > SWIPE_LOCK_PX) {
        axisLocked = 'horizontal'
        isDragging.value = true
      }
    }

    if (axisLocked === 'horizontal') {
      dragX.value = dx
    }
  }

  function onTouchEnd() {
    if (!isDragging.value) {
      axisLocked = null
      return
    }

    const distance = Math.abs(dragX.value)
    releasing.value = true

    if (distance >= SWIPE_DISMISS_PX) {
      // Fly off in the swipe direction, then snooze. Snooze flips
      // isUndecided → false, which removes the toast from the DOM via
      // v-if; the leave transition still plays one frame so the user
      // sees the slide-off motion.
      const direction = dragX.value > 0 ? 1 : -1
      const offscreen = direction * Math.max(window.innerWidth, 400)
      dragX.value = offscreen
      window.setTimeout(() => {
        snooze()
        // Local UI state will reset when v-if unmounts the element.
        isDragging.value = false
        releasing.value = false
        dragX.value = 0
      }, 260)
    } else {
      // Spring back to centre.
      dragX.value = 0
      window.setTimeout(() => {
        isDragging.value = false
        releasing.value = false
        axisLocked = null
      }, 280)
    }
  }
</script>

<style scoped>
  .cookie-toast {
    position: fixed;
    left: 1rem;
    bottom: 1rem;
    /* Below the mobile burger-menu overlay (z-50) so the menu can cover
       the toast cleanly when active. Above page content. */
    z-index: 40;
    width: min(20rem, calc(100vw - 2rem));
    padding: 1rem 1.1rem;
    /* Liquid-glass material: radius drives the lens clip, tint replaces the
       bespoke dark wash. Saturate uses the panel/base default. */
    --lg-radius: 0.9rem;
    --lg-tint: rgb(15 15 18 / 0.78);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.92);
    font-family: inherit;
    /* Hint to the browser that we own horizontal panning here. The JS
       gesture only kicks in past SWIPE_LOCK_PX, so vertical scroll
       still works for short upward/downward drags. */
    touch-action: pan-y;
    /* Disable iOS Safari's tap highlight on the toast background; buttons
       have their own focus states. */
    -webkit-tap-highlight-color: transparent;
  }

  /* Phones: stretch full width with a symmetric 1rem margin so the toast
     uses the available room properly. */
  @media (max-width: 640px) {
    .cookie-toast {
      right: 1rem;
      width: auto;
    }
  }

  .cookie-toast__message {
    margin: 0 0 0.7rem;
    font-size: 0.82rem;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.86);
  }

  .cookie-toast__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* Accept/decline are now <UiButton variant="solid|outline" size="sm"> — styling
     + interaction come from the unified button. Only the details link is bespoke. */
  .cookie-toast__link {
    margin-left: auto;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.18s ease;
  }

  @media (hover: hover) and (pointer: fine) {
    .cookie-toast__link:hover {
      color: white;
    }
  }

  /* No forced wrap — flex-wrap on the actions row handles it naturally
     when (and only when) the link genuinely doesn't fit alongside the
     buttons. */

  .cookie-toast-enter-active,
  .cookie-toast-leave-active {
    transition:
      opacity 0.35s ease,
      transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .cookie-toast-enter-from,
  .cookie-toast-leave-to {
    opacity: 0;
    transform: translateY(0.75rem);
  }

  @media (prefers-reduced-motion: reduce) {
    .cookie-toast-enter-active,
    .cookie-toast-leave-active {
      transition: opacity 0.2s ease;
    }
    .cookie-toast-enter-from,
    .cookie-toast-leave-to {
      transform: none;
    }
  }
</style>
