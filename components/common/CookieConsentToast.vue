<template>
  <Transition name="cookie-toast">
    <div v-if="visible" class="cookie-toast" role="dialog" :aria-label="t('cookies.banner.aria')">
      <p class="cookie-toast__message">{{ t('cookies.banner.message') }}</p>
      <div class="cookie-toast__actions">
        <button type="button" class="cookie-toast__btn cookie-toast__btn--accept" @click="onAccept">
          {{ t('cookies.banner.accept') }}
        </button>
        <button
          type="button"
          class="cookie-toast__btn cookie-toast__btn--decline"
          @click="onDecline"
        >
          {{ t('cookies.banner.decline') }}
        </button>
        <NuxtLinkLocale to="/cookies-policy" class="cookie-toast__link">
          {{ t('cookies.banner.details') }}
        </NuxtLinkLocale>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useCookieConsent } from '~/composables/useCookieConsent'

  const { t } = useI18n({ useScope: 'global' })
  const { isUndecided, accept, decline, hydrate } = useCookieConsent()

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
    border-radius: 0.9rem;
    background: rgba(15, 15, 18, 0.78);
    backdrop-filter: blur(var(--perf-blur-strength, 14px)) saturate(120%);
    -webkit-backdrop-filter: blur(var(--perf-blur-strength, 14px)) saturate(120%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.92);
    font-family: inherit;
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

  .cookie-toast__btn {
    appearance: none;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: white;
    padding: 0.45rem 0.9rem;
    border-radius: 0.55rem;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 0.18s ease,
      border-color 0.18s ease,
      transform 0.18s ease;
    font-family: inherit;
  }

  .cookie-toast__btn:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.28);
  }

  .cookie-toast__btn:active {
    transform: scale(0.97);
  }

  .cookie-toast__btn--accept {
    background: rgba(255, 255, 255, 0.92);
    color: #0f0f12;
    border-color: transparent;
  }

  .cookie-toast__btn--accept:hover {
    background: white;
  }

  .cookie-toast__link {
    margin-left: auto;
    font-size: 0.78rem;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.18s ease;
  }

  .cookie-toast__link:hover {
    color: white;
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
