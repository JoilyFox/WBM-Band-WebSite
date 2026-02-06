<script setup lang="ts">
  import { getAllReleases } from '~/data/musicLibrary'
  import { isUpcomingRelease } from '~/utils/configHelpers'

  // Define page metadata - use empty layout to prevent flash
  definePageMeta({
    layout: 'empty'
  })

  const localePath = useLocalePath()

  // Get all releases and filter out upcoming ones (only show released tracks)
  const releasedTracks = getAllReleases().filter(
    (release) => !isUpcomingRelease(release.releaseDate)
  )

  // Get the latest released track (first in the sorted array)
  const latestRelease = releasedTracks[0]

  // If we have a latest release, redirect to it
  if (latestRelease) {
    await navigateTo(localePath(`/listen/${latestRelease.slug}`), {
      replace: true,
      redirectCode: 301
    })
  } else {
    // If no releases are available yet, redirect to home
    await navigateTo(localePath('/'), {
      replace: true,
      redirectCode: 302
    })
  }
</script>

<template>
  <div>
    <!-- This page redirects, so nothing should show -->
  </div>
</template>
