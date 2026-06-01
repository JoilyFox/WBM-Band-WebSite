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

    <!-- Play Overlay (Desktop only) -->
    <div
      class="absolute inset-0 md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 hidden"
    >
      <div
        class="bg-white/90 rounded-full w-12 h-12 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl"
      >
        <i class="pi pi-play text-surface-900 text-lg ml-0.5"></i>
      </div>
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
  /* Ensure perfect circle for play button */
  .rounded-full {
    border-radius: 50%;
  }

  /* Enhanced shadow for cards */
  .shadow-lg {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  /* Custom animations for play icon */
  .pi-play {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (hover: hover) and (pointer: fine) {
    .group:hover .pi-play {
      transform: scale(1.1);
    }
  }
</style>
