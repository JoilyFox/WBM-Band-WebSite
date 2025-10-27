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
import { getReleaseBySlug } from '~/data/musicLibrary'

// Use the empty layout instead of default
definePageMeta({
  layout: 'empty'
})

const route = useRoute()

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
  title: `${release.title} | WBM Band`,
  description: release.description || `Listen to ${release.title} by WBM Band on all major music platforms.`,
  ogTitle: `${release.title} | WBM Band`,
  ogDescription: release.description || `Listen to ${release.title} by WBM Band on all major music platforms.`,
  ogImage: release.imageUrl,
  ogType: 'music.song',
  twitterCard: 'summary_large_image',
  twitterTitle: `${release.title} | WBM Band`,
  twitterDescription: release.description || `Listen to ${release.title} by WBM Band on all major music platforms.`,
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
