<template>
  <div v-if="release" class="music-page">
    <MusicDetailContent 
      :release="release"
      :is-modal="false"
    />
    <!-- Minimized Footer -->
    <SectionsFooterSection :minimized="true" />
  </div>
  <div v-else>
    <!-- Loading state or error will be handled by the error handling below -->
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getReleaseBySlug } from '~/data/musicLibrary'

// Use the empty layout instead of default
definePageMeta({
  layout: 'empty',
  middleware: ['listen-access']
})

const route = useRoute()

// Get the slug from the route params
const slug = route.params.slug as string

// Find the release by slug
const release = getReleaseBySlug(slug)
const { t } = useI18n({ useScope: 'global' })

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

const releaseTitleKey = release.titleKey || `releases.${release.slug}.title`
const releaseDescriptionKey = release.descriptionKey || `releases.${release.slug}.description`
const translatedTitle = t(releaseTitleKey) as string
const localizedTitle = translatedTitle !== releaseTitleKey && translatedTitle ? translatedTitle : (release.title || release.slug)
const translatedDescription = t(releaseDescriptionKey) as string
const fallbackDescription = release.description || `Listen to ${localizedTitle} by WBM Band on all major music platforms.`
const localizedDescription = translatedDescription !== releaseDescriptionKey && translatedDescription ? translatedDescription : fallbackDescription

// Handle scroll position on page mount
onMounted(() => {
  if (process.client) {
    // Reset body overflow in case it was set by modal
    document.body.style.overflow = ''
    
    // Check if this is a navigation from the same site (not a direct load)
    const referrer = document.referrer
    const currentHost = window.location.host
    const isInternalNavigation = referrer.includes(currentHost) && referrer !== window.location.href
    
    // Only scroll to top if coming from internal navigation (like modal)
    if (isInternalNavigation) {
      nextTick(() => {
        window.scrollTo(0, 0)
      })
    }
  }
})

// Set page meta
useSeoMeta({
  title: `${localizedTitle} | WBM Band`,
  description: localizedDescription,
  ogTitle: `${localizedTitle} | WBM Band`,
  ogDescription: localizedDescription,
  ogImage: release.imageUrl,
  ogType: 'music.song',
  twitterCard: 'summary_large_image',
  twitterTitle: `${localizedTitle} | WBM Band`,
  twitterDescription: localizedDescription,
  twitterImage: release.imageUrl
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
