<template>
  <div class="presave-redirect" role="status" aria-live="polite">
    <div class="presave-redirect__inner">
      <span class="presave-redirect__spinner" aria-hidden="true" />
      <p class="presave-redirect__label">{{ label }}</p>
      <!-- Safety net: if the automatic hop never happens (blocked storage, an in-app
           browser swallowing the navigation, a failed tracking call) the visitor
           still has a way out. Client-only, after a short grace period. -->
      <a
        v-if="showFallback && fallbackHref"
        class="presave-redirect__fallback"
        :href="fallbackHref"
      >
        {{ fallbackLabel }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { MusicRelease } from '~/data/musicLibrary'

  const props = defineProps<{ release?: MusicRelease }>()

  const FALLBACK_DELAY_MS = 2000

  // Shown in place of the full pre-save body while the page auto-redirects to
  // the distributor smart-link. Keeping the body off-screen makes the hop to
  // the distributor seamless instead of flashing the (link-less) pre-save page.
  // Analytics still fire from the page's onMounted — this is presentation only.
  const { t } = useI18n({ useScope: 'global' })

  const showFallback = ref(false)
  let fallbackTimer: ReturnType<typeof setTimeout> | undefined
  onMounted(() => {
    fallbackTimer = setTimeout(() => (showFallback.value = true), FALLBACK_DELAY_MS)
  })
  onBeforeUnmount(() => clearTimeout(fallbackTimer))

  const fallbackHref = computed(() => props.release?.distributorPreSaveUrl || '')

  const fallbackLabel = computed<string>(() => {
    const translated = t('music.presave.redirect_fallback') as string
    return translated && translated !== 'music.presave.redirect_fallback'
      ? translated
      : 'Not redirected? Open the pre-save page'
  })

  const label = computed<string>(() => {
    const translated = t('music.presave.redirecting') as string
    return translated && translated !== 'music.presave.redirecting'
      ? translated
      : 'Taking you to pre-save…'
  })
</script>

<style scoped>
  .presave-redirect {
    flex: 1;
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .presave-redirect__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .presave-redirect__spinner {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: rgba(255, 255, 255, 0.85);
    animation: presave-redirect-spin 0.9s linear infinite;
  }

  .presave-redirect__label {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    letter-spacing: 0.01em;
  }

  .presave-redirect__fallback {
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.9rem;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .presave-redirect__fallback:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.9);
    outline-offset: 4px;
    border-radius: 2px;
  }

  @keyframes presave-redirect-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .presave-redirect__spinner {
      animation: none;
      border-top-color: rgba(255, 255, 255, 0.5);
    }
  }
</style>
