<template>
  <CommonBaseModal
    :is-visible="isVisible"
    :preload-image-url="release?.imageUrl"
    :aria-label="release?.title || 'Release details'"
    @close="emit('close')"
  >
    <MusicDetailContent :release="release" :is-modal="true" :is-pre-save="isPreSave" />
  </CommonBaseModal>
</template>

<script setup lang="ts">
  import type { MusicRelease } from '~/data/musicLibrary'

  interface Props {
    release: MusicRelease
    isVisible: boolean
    isPreSave?: boolean
  }

  interface Emits {
    (e: 'close'): void
  }

  withDefaults(defineProps<Props>(), {
    isPreSave: false
  })
  const emit = defineEmits<Emits>()
</script>
