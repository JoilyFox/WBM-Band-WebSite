<script setup lang="ts">
import { getNearestUpcomingPreSaveRelease } from '~/data/musicLibrary'
import { generalConfig } from '~/config/general'

// Use the empty layout instead of default
definePageMeta({
  layout: 'empty',
  middleware: ['presave-access']
})

const localePath = useLocalePath()

// Check if pre-save is enabled - use direct config access
const enablePreSave = generalConfig.enablePreSave

// Get the nearest upcoming release with pre-save links
const nearestRelease = getNearestUpcomingPreSaveRelease()

// Perform redirect based on conditions
if (!enablePreSave || !nearestRelease) {
  // Pre-save is disabled or no upcoming releases, redirect to home
  await navigateTo(localePath('/'), { redirectCode: 301, replace: true })
} else if (nearestRelease.useDistributorPreSave && nearestRelease.distributorPreSaveUrl) {
  // Redirect to distributor's pre-save URL
  await navigateTo(nearestRelease.distributorPreSaveUrl, { external: true, redirectCode: 302 })
} else {
  // Redirect to the release's pre-save page
  await navigateTo(localePath(`/pre-save/${nearestRelease.slug}`), { redirectCode: 302, replace: true })
}
</script>

<template>
  <div>
    <!-- This template will never be rendered as we always redirect -->
  </div>
</template>
