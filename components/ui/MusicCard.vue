<template>
  <div class="music-card group cursor-pointer" @click="handleClick">
    <!-- Album Cover -->
    <UiAlbumCover :image-url="release.imageUrl" :alt="displayTitle" :release-type="release.type" />

    <!-- Release Info -->
    <div class="space-y-1 mb-3 mt-3">
      <h3
        class="text-white font-semibold text-sm group-hover:text-primary-400 transition-colors duration-300 line-clamp-1"
      >
        <!-- Real <a> so Google has a crawlable path from the home page to every
             release page — the card itself can't be an anchor because it also
             contains the streaming links, and <a> inside <a> is invalid HTML.
             A plain left click is prevented so the card's own handler still
             opens the modal exactly as before; modified clicks (cmd/ctrl/shift)
             stop propagation and let the browser open the real URL.
             See docs/search-console.md. -->
        <NuxtLink
          v-if="listenPath"
          :to="listenPath"
          class="release-title-link"
          @click.exact.prevent
          @click.meta.stop
          @click.ctrl.stop
          @click.shift.stop
        >
          {{ displayTitle }}
        </NuxtLink>
        <template v-else>{{ displayTitle }}</template>
      </h3>
      <p class="text-white/60 text-xs">
        {{ formattedDate }}
      </p>
      <p
        v-if="displayDescription"
        class="text-white/50 text-xs line-clamp-2 leading-tight hidden sm:block"
      >
        {{ displayDescription }}
      </p>
    </div>

    <!-- Streaming Links -->
    <UiStreamingButtons
      :spotify-url="release.musicPlatformLinks.spotify"
      :apple-music-url="release.musicPlatformLinks.appleMusic"
      :youtube-url="release.musicPlatformLinks.youtubeMusic"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { MusicRelease } from '~/data/musicLibrary'
  import { useI18n } from 'vue-i18n'
  import { isUpcomingRelease } from '~/utils/configHelpers'

  interface Props {
    release: MusicRelease
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    click: [release: MusicRelease]
  }>()

  // Use global i18n to keep SSR/CSR in sync
  const { t, locale } = useI18n({ useScope: 'global' })

  const stableReleaseText = (key: string, fallback: string | undefined) => {
    const translated = t(key) as string
    return translated !== key && translated ? translated : fallback || ''
  }

  // Localized title/description from locales.releases[slug]
  const displayTitle = computed(() => {
    const key = props.release.titleKey || `releases.${props.release.slug}.title`
    return stableReleaseText(key, props.release.title || props.release.slug)
  })

  const displayDescription = computed(() => {
    const key = props.release.descriptionKey || `releases.${props.release.slug}.description`
    return stableReleaseText(key, props.release.description || '')
  })

  const formattedDate = computed(() => {
    const date = new Date(props.release.releaseDate)
    const currentLocale = locale.value === 'ua' ? 'uk-UA' : 'en-US'
    const formatted = date.toLocaleDateString(currentLocale, {
      year: 'numeric',
      month: 'long',
      // Match the release pages: display in the authored Kyiv zone (fixed, so
      // SSR/CSR stay consistent).
      timeZone: 'Europe/Kyiv'
    })

    if (!formatted) return formatted
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  })

  // Canonical release URL for the current locale: the UA hub is the CLEAN
  // non-localized path (that is what /ua/listen/<slug> canonicalises to), EN is
  // its own /en/... URL. Linking to anything else would point Google at a
  // non-canonical duplicate. Unreleased tracks get no link — their /listen page
  // redirects to /404 and is a soft 404 until release day.
  const listenPath = computed(() => {
    if (isUpcomingRelease(props.release.releaseDate)) return ''
    const prefix = locale.value === 'en' ? '/en' : ''
    return `${prefix}/listen/${props.release.slug}`
  })

  const handleClick = () => {
    emit('click', props.release)
  }
</script>

<style scoped>
  /* The title link exists for crawlability, not decoration — it must be
     visually indistinguishable from the plain <h3> text it replaced. */
  .release-title-link {
    color: inherit;
    text-decoration: none;
  }

  /* Music Card Animations */
  .music-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (hover: hover) and (pointer: fine) {
    .music-card:hover {
      transform: translateY(-8px);
    }
  }

  .music-card:active {
    transform: translateY(-4px) scale(0.98);
  }

  /* Mobile-specific touch handling */
  @media (max-width: 767px) {
    @media (hover: hover) and (pointer: fine) {
      .music-card:hover {
        transform: none;
      }
    }

    .music-card:active {
      transform: scale(0.95);
      transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Show streaming buttons on mobile */
    .music-card :deep(.opacity-0) {
      opacity: 1;
    }

    .music-card :deep(.hidden.md\\:block) {
      display: block;
    }

    /* Mobile card adjustments */
    .music-card :deep(.aspect-square) {
      border-radius: 0.75rem;
      margin-bottom: 0.5rem;
    }

    /* Smaller text on mobile */
    .music-card h3 {
      font-size: 0.8rem;
      margin-bottom: -0.1rem;
    }

    .music-card p {
      font-size: 0.625rem;
    }
  }

  /* Line clamp utilities */
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Smooth transitions for text elements */
  .transition-colors {
    transition-property: color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
  }

  /* Enhanced hover effects for desktop */
  @media (min-width: 768px) {
    .music-card :deep(.aspect-square) {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @media (hover: hover) and (pointer: fine) {
      .music-card:hover :deep(.aspect-square) {
        box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
      }
    }
  }
</style>
