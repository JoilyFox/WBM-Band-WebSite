<template>
  <div
    class="relative overflow-hidden rounded-xl bg-surface-800 aspect-square shadow-lg"
    style="--pi-zoom-duration: 300ms"
  >
    <!-- Album Cover Image with Progressive Loading -->
    <UiProgressiveImage
      v-if="!imageError"
      :src="imageUrl"
      :alt="alt"
      container-class="w-full h-full"
      image-class="md:group-hover:scale-105"
      loading="lazy"
      preset="album"
      :sizes="IMAGE_SIZES.album"
      :show-placeholder="true"
      :error-text="t('music.album_cover.unavailable')"
      @error="handleImageError"
    />

    <!-- Fallback Component -->
    <div
      v-else
      class="w-full h-full bg-gradient-to-br from-surface-700 to-surface-800 flex items-center justify-center"
    >
      <div class="text-center text-white/60">
        <i class="pi pi-image text-4xl mb-2"></i>
        <p class="text-xs font-medium uppercase tracking-wider">
          {{ t('music.album_cover.no_image') }}
        </p>
      </div>
    </div>

    <!-- Play Overlay (Desktop only) — clear liquid-glass play button. Decorative
         (the card itself is the click target), so it's aria-hidden / not focusable
         and just lets the click bubble. The overlay is NOT opacity-faded: an
         ancestor opacity < 1 suppresses the button's backdrop-filter mid-fade (the
         blur would pop in late). Instead the button "frosts in" on hover — its
         blur, tint, rim and icon all ramp while the host stays opaque (see CSS). -->
    <div class="absolute inset-0 md:flex items-center justify-center z-20 hidden">
      <UiButton
        variant="clear"
        shape="circle"
        icon-only
        size="lg"
        icon="pi pi-play"
        class="album-play-btn"
        aria-hidden="true"
        tabindex="-1"
      />
    </div>

    <!-- Release Type Badge -->
    <div v-if="showBadge" class="absolute top-2 left-2 z-20">
      <UiAppBadge :variant="badgeVariant">
        {{ displayTypeName }}
      </UiAppBadge>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { MusicRelease } from '~/data/musicLibrary'
  import { useI18n } from 'vue-i18n'
  import { IMAGE_SIZES } from '~/utils/imageHelpers'

  interface Props {
    imageUrl: string
    alt: string
    releaseType: MusicRelease['type']
    showBadge?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showBadge: true
  })
  // Use global composer to align SSR/CSR
  const { t, locale } = useI18n({ useScope: 'global' })

  const imageError = ref(false)

  const badgeVariant = computed(() => {
    const type = (props.releaseType || '').toString().toLowerCase()
    if (type === 'single') return 'single'
    if (type === 'album') return 'album'
    if (type === 'ep') return 'ep'
    return 'glass'
  })

  const displayTypeName = computed(() => {
    const raw = (props.releaseType || '').toString().toLowerCase().replace(/\s+/g, '_')
    const key = `music.types.${raw}`
    const value = t(key) as string
    if (value !== key) return value
    // Deterministic fallback per locale to avoid hydration mismatch
    const mapUA: Record<string, string> = {
      single: 'Сингл',
      album: 'Альбом',
      ep: 'EP',
      new_release: 'Новий реліз'
    }
    const mapEN: Record<string, string> = {
      single: 'Single',
      album: 'Album',
      ep: 'EP',
      new_release: 'New release'
    }
    return (locale.value === 'ua' ? mapUA : mapEN)[raw] || raw
  })

  const handleImageError = () => {
    imageError.value = true
  }
</script>

<style scoped>
  /* Enhanced shadow for cards */
  .shadow-lg {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  /* Optically centre the play triangle (it reads slightly left-heavy dead-centre). */
  .album-play-btn :deep(.lg-btn__icon) {
    margin-left: 2px;
  }

  /* --- Frost-in reveal ---------------------------------------------------
     The play button materialises on card hover by ramping its OWN blur + fading
     its tint/rim/icon — never via an ancestor opacity (that suppresses the
     backdrop-filter while < 1, making the blur pop in late). The host stays
     opaque the whole time, so the frost paints smoothly as it appears. */
  .album-play-btn {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    transition:
      background 0.3s ease,
      border-color 0.3s ease,
      box-shadow 0.3s ease;
  }
  .album-play-btn::before {
    -webkit-backdrop-filter: blur(0) saturate(1) brightness(1);
    backdrop-filter: blur(0) saturate(1) brightness(1);
    transition:
      backdrop-filter 0.3s ease,
      -webkit-backdrop-filter 0.3s ease;
  }
  .album-play-btn::after {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .album-play-btn :deep(.lg-btn__content) {
    opacity: 0;
    transition:
      opacity 0.3s ease,
      transform 0.46s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @media (hover: hover) and (pointer: fine) {
    .group:hover .album-play-btn {
      background: var(--lg-tint);
      border-color: rgb(255 255 255 / 0.12);
      box-shadow:
        0 8px 24px rgb(0 0 0 / 0.25),
        0 2px 6px rgb(0 0 0 / 0.16);
    }
    .group:hover .album-play-btn::before {
      -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate))
        brightness(var(--lg-brightness));
      backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate))
        brightness(var(--lg-brightness));
    }
    .group:hover .album-play-btn::after {
      opacity: 1;
    }
    .group:hover .album-play-btn :deep(.lg-btn__content) {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .album-play-btn,
    .album-play-btn::before,
    .album-play-btn::after,
    .album-play-btn :deep(.lg-btn__content) {
      transition: none;
    }
  }
</style>
