<script setup lang="ts">
  import { getNearestUpcomingPreSaveRelease } from '~/data/musicLibrary'
  import { generalConfig } from '~/config/general'

  // Use the empty layout instead of default
  definePageMeta({
    layout: 'empty',
    middleware: ['presave-access']
  })

  const route = useRoute()
  const localePath = useLocalePath()

  // Check if pre-save is enabled - use direct config access
  const enablePreSave = generalConfig.enablePreSave

  // Get the nearest upcoming release with pre-save links
  const nearestRelease = getNearestUpcomingPreSaveRelease()

  // Perform redirect on client side (after mount) to properly read query parameters
  onMounted(() => {
    // Check if bypass parameter is present to show custom page instead of distributor redirect
    const bypassDistributor = route.query.bypass === 'true'

    // Perform redirect based on conditions
    if (!enablePreSave || !nearestRelease) {
      // Pre-save is disabled or no upcoming releases, redirect to home
      navigateTo(localePath('/'), { redirectCode: 301, replace: true })
    } else if (
      nearestRelease.useDistributorPreSave &&
      nearestRelease.distributorPreSaveUrl &&
      !bypassDistributor
    ) {
      // Redirect to distributor's pre-save URL (only if bypass is not set)
      navigateTo(nearestRelease.distributorPreSaveUrl, { external: true, redirectCode: 302 })
    } else {
      // Redirect to the release's pre-save page
      // Preserve bypass parameter if it was set
      const query = bypassDistributor ? { bypass: 'true' } : {}
      navigateTo(localePath({ path: `/pre-save/${nearestRelease.slug}`, query }), {
        redirectCode: 302,
        replace: true
      })
    }
  })
</script>

<template>
  <div>
    <!-- This template will never be rendered as we always redirect -->
  </div>
</template>
