<template>
  <CommonErrorPage
    :title="t('errors.page_not_found.title')"
    :message="t('errors.page_not_found.message')"
    :button-text="t('errors.go_home')"
    :button-link="localePath('/')"
    button-icon="pi pi-home"
  />
</template>

<script setup lang="ts">
  // Remove default layout
  import { createPageTitle } from '~/constants/app'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'

  definePageMeta({
    layout: false
  })

  const { t } = useI18n()
  const localePath = useLocalePath()

  // Set page meta - don't throw error in 404 page
  useHead({
    title: createPageTitle('404'),
    meta: [{ name: 'robots', content: 'noindex' }]
  })
</script>
