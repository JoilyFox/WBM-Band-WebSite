<template>
  <div v-if="release" class="music-page">
    <MusicDetailContent 
      :release="release"
      :is-modal="false"
      :is-pre-save="true"
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
import { isUpcomingRelease } from '~/utils/configHelpers'

// Use the empty layout instead of default
definePageMeta({
  layout: 'empty'
})

const route = useRoute()

// Get the slug from the route params
const slug = route.params.slug as string

// Find the release by slug
const release = getReleaseBySlug(slug)

// Validate that the release exists and is in pre-save mode
if (!release) {
  throw createError({
    statusCode: 404,
    statusMessage: `Pre-save track "${slug}" not found`,
    data: {
      slug
    }
  })
}

// Check if this release is actually upcoming and has pre-save links
if (!isUpcomingRelease(release.releaseDate)) {
  // Release date has passed, redirect to regular listen page
  const localePath = useLocalePath()
  await navigateTo(localePath(`/listen/${slug}`), { redirectCode: 301 })
}

if (!release.preSaveMusicPlatformLinks || Object.keys(release.preSaveMusicPlatformLinks).length === 0) {
  throw createError({
    statusCode: 404,
    statusMessage: `Pre-save not available for "${slug}"`,
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
  title: `Pre-save ${release.title} | WBM Band`,
  description: release.description || `Pre-save ${release.title} by WBM Band on your favorite music platform.`,
  ogTitle: `Pre-save ${release.title} | WBM Band`,
  ogDescription: release.description || `Pre-save ${release.title} by WBM Band on your favorite music platform.`,
  ogImage: release.imageUrl,
  ogType: 'music.song',
  twitterCard: 'summary_large_image',
  twitterTitle: `Pre-save ${release.title} | WBM Band`,
  twitterDescription: release.description || `Pre-save ${release.title} by WBM Band on your favorite music platform.`,
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
