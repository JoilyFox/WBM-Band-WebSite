<template>
  <div v-if="release" class="music-page">
    <MusicDetailContent :release="release" :is-modal="false" />
    <!-- Minimized Footer -->
    <SectionsFooterSection :minimized="true" />
  </div>
  <div v-else>
    <!-- Loading state or error will be handled by the error handling below -->
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { getReleaseBySlug } from '~/data/musicLibrary'

  // Use the empty layout instead of default
  definePageMeta({
    layout: 'empty',
    middleware: ['listen-access']
  })

  const route = useRoute()
  const { t, locale } = useI18n({ useScope: 'global' })

  // Get the slug from the route params
  const slug = route.params.slug as string

  // Find the release by slug
  const release = getReleaseBySlug(slug)

  // Handle invalid slug using Nuxt's error handling
  if (!release) {
    throw createError({
      statusCode: 404,
      statusMessage: `Music track "${slug}" not found`,
      data: {
        slug
      }
    })
  }

  // Get localized title
  const releaseTitleKey = release.titleKey || `releases.${release.slug}.title`
  const translatedTitle = t(releaseTitleKey) as string
  const localizedTitle = computed(() =>
    translatedTitle !== releaseTitleKey && translatedTitle
      ? translatedTitle
      : release.title || release.slug
  )

  // Get localized description using the new translation key
  const releaseDescriptionKey = release.descriptionKey || `releases.${release.slug}.description`
  const translatedDescription = t(releaseDescriptionKey) as string
  const fallbackDescription = computed(() =>
    t('listen.meta_description', { songName: localizedTitle.value })
  )
  const localizedDescription = computed(() =>
    translatedDescription !== releaseDescriptionKey && translatedDescription
      ? translatedDescription
      : fallbackDescription.value
  )

  // Page title for meta
  const pageTitle = computed(() => `${localizedTitle.value} | WBM Band`)

  // Get absolute URL for the image
  const metaImageUrl = computed(() => {
    const baseUrl = 'https://www.wbmband.com'
    let imageUrl = release.imageUrl

    // Convert AVIF/WEBP to JPG for better social media compatibility
    if (imageUrl.endsWith('.avif')) {
      imageUrl = imageUrl.replace('.avif', '.jpg')
    } else if (imageUrl.endsWith('.webp')) {
      imageUrl = imageUrl.replace('.webp', '.jpg')
    }

    // Handle both relative and absolute URLs
    if (imageUrl.startsWith('http')) {
      return imageUrl
    }
    return `${baseUrl}${imageUrl}`
  })

  // Get current page URL for og:url
  const pageUrl = computed(() => {
    const baseUrl = 'https://www.wbmband.com'
    // Handle both with and without locale prefix
    // /listen/mania or /ua/listen/mania or /en/listen/mania
    if (locale.value === 'ua') {
      // For Ukrainian, support both /listen/slug and /ua/listen/slug
      return `${baseUrl}/ua/listen/${slug}`
    }
    return `${baseUrl}/${locale.value}/listen/${slug}`
  })

  // Handle scroll position on page mount
  onMounted(() => {
    if (import.meta.client) {
      // Reset body overflow in case it was set by modal
      document.body.style.overflow = ''

      // Check if this is a navigation from the same site (not a direct load)
      const referrer = document.referrer
      const currentHost = window.location.host
      const isInternalNavigation =
        referrer.includes(currentHost) && referrer !== window.location.href

      // Only scroll to top if coming from internal navigation (like modal)
      if (isInternalNavigation) {
        nextTick(() => {
          window.scrollTo(0, 0)
        })
      }
    }
  })

  // Generate comprehensive keywords for SEO
  const keywords = computed(() => {
    const baseKeywords = [
      'WBM',
      'WBM Band',
      'Woman Based Mechanics',
      'ВМБ',
      'ВБМ гурт',
      'Вуман Бейсд Меканікс',
      'Вумен Бейсд Мекенікс',
      'rock',
      'punk',
      'alternative',
      'music',
      'band',
      'рок',
      'панк',
      'альтернатива',
      'музика',
      'гурт',
      'wbm music',
      'вбм музика',
      'вмб музика'
    ]

    const title = localizedTitle.value
    const titleLower = title.toLowerCase()

    // Add release specific keywords
    const releaseKeywords = [
      title,
      `${title} WBM`,
      `${title} WBM Band`,
      `${title} Woman Based Mechanics`,
      `${title} ВМБ`,
      `${title} ВБМ`,
      `${title} Вуман Бейсд Меканікс`
    ]

    // Add transliteration support if title is in Cyrillic (basic check)
    if (/[а-яА-Я]/.test(title)) {
      // This is a simplified transliteration map for common cases
      // For a robust solution, a library would be better, but this covers the user's request
      const translitMap: Record<string, string> = {
        а: 'a',
        б: 'b',
        в: 'v',
        г: 'h',
        ґ: 'g',
        д: 'd',
        е: 'e',
        є: 'ye',
        ж: 'zh',
        з: 'z',
        и: 'y',
        і: 'i',
        ї: 'yi',
        й: 'y',
        к: 'k',
        л: 'l',
        м: 'm',
        н: 'n',
        о: 'o',
        п: 'p',
        р: 'r',
        с: 's',
        т: 't',
        у: 'u',
        ф: 'f',
        х: 'kh',
        ц: 'ts',
        ч: 'ch',
        ш: 'sh',
        щ: 'shch',
        ь: '',
        ю: 'yu',
        я: 'ya'
      }

      const transliterated = titleLower
        .split('')
        .map((char) => translitMap[char] || char)
        .join('')
      if (transliterated !== titleLower) {
        releaseKeywords.push(transliterated)
        releaseKeywords.push(`${transliterated} WBM`)
        releaseKeywords.push(`${transliterated} WBM Band`)
      }
    }

    return [...new Set([...releaseKeywords, ...baseKeywords])].join(', ')
  })

  // Set comprehensive meta tags for social media sharing
  useHead({
    title: pageTitle,
    meta: [
      {
        name: 'description',
        content: localizedDescription
      },
      {
        name: 'keywords',
        content: keywords
      },
      // Open Graph
      {
        property: 'og:title',
        content: pageTitle
      },
      {
        property: 'og:description',
        content: localizedDescription
      },
      {
        property: 'og:image',
        content: metaImageUrl
      },
      {
        property: 'og:image:width',
        content: '1200'
      },
      {
        property: 'og:image:height',
        content: '1200'
      },
      {
        property: 'og:type',
        content: 'music.song'
      },
      {
        property: 'og:url',
        content: pageUrl
      },
      // Twitter Card - using 'summary' for small image on left side
      {
        name: 'twitter:card',
        content: 'summary'
      },
      {
        name: 'twitter:title',
        content: pageTitle
      },
      {
        name: 'twitter:description',
        content: localizedDescription
      },
      {
        name: 'twitter:image',
        content: metaImageUrl
      }
    ]
  })
</script>

<style scoped>
  .music-page {
    min-height: 100vh;
    width: 100%;
    background:
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.08) 0%, transparent 50%),
      linear-gradient(to bottom, #0f0f0f, #000000);
    position: relative;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Ensure the main content takes available space and footer sticks to bottom */
  .music-page :deep(.music-detail-content) {
    flex: 1;
    min-height: 0; /* Override the min-height: 100vh from the component */
  }
</style>
