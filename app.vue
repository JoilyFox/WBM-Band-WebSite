<template>
  <!-- Global Loading Bar -->
  <GlobalLoadingBar />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Global Snackbar Component -->
  <Snackbar />
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  // Import global components
  import Snackbar from '~/components/common/Snackbar.vue'
  import GlobalLoadingBar from '~/components/common/GlobalLoadingBar.vue'

  // Set a correct, per-locale <html lang> on every (prerendered) page. The
  // i18n locale CODES are 'ua'/'en' — note 'ua' is a country-style handle, NOT
  // a language tag (Ukrainian is 'uk'). Without this the Ukrainian-default,
  // Cyrillic pages ship with an unset/English lang and get mis-signalled to
  // Google and AI crawlers. Mapped to a valid BCP-47 tag here.
  const { locale } = useI18n()
  const LOCALE_TO_LANG = { ua: 'uk-UA', en: 'en-US' }
  useHead({
    htmlAttrs: {
      lang: computed(() => LOCALE_TO_LANG[locale.value] ?? 'uk-UA')
    }
  })
</script>
