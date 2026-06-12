<template>
  <!-- Global Loading Bar -->
  <GlobalLoadingBar />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Global Snackbar Component -->
  <Snackbar />

  <!-- Liquid Glass lens filters (see docs/liquid-glass.md).
       Displacement maps are tiny gradient SVGs: R = horizontal shift,
       G = vertical shift, 128 = neutral. Edge zones sample INWARD so the
       backdrop never gets read out of bounds. Only Chromium applies these
       (body.lg-can-lens); Safari/Firefox never reference them. -->
  <svg width="0" height="0" aria-hidden="true" focusable="false" style="position: absolute">
    <defs>
      <filter
        id="lg-lens"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        color-interpolation-filters="sRGB"
      >
        <feImage
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='0'><stop offset='0' stop-color='%23ff0000'/><stop offset='0.18' stop-color='%23800000'/><stop offset='0.82' stop-color='%23800000'/><stop offset='1' stop-color='%23000000'/></linearGradient></defs><rect width='64' height='64' fill='url(%23g)'/></svg>"
          preserveAspectRatio="none"
          result="mx"
        />
        <feImage
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><defs><linearGradient id='g' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='%2300ff00'/><stop offset='0.18' stop-color='%23008000'/><stop offset='0.82' stop-color='%23008000'/><stop offset='1' stop-color='%23000000'/></linearGradient></defs><rect width='64' height='64' fill='url(%23g)'/></svg>"
          preserveAspectRatio="none"
          result="my"
        />
        <feComposite
          in="mx"
          in2="my"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="1"
          k4="0"
          result="map"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale="16"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <filter
        id="lg-lens-bar"
        x="-10%"
        y="-10%"
        width="120%"
        height="120%"
        color-interpolation-filters="sRGB"
      >
        <!-- Vertical edge-lens: G ramps high near the top edge and low near the
             bottom edge (R stays 128 = no horizontal shift, the bar is full
             width). With a large scale this samples backdrop pixels inward at
             both edges, so content scrolling under the bar visibly bends /
             magnifies at the bottom lip — the macOS lensing read. -->
        <feImage
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><defs><linearGradient id='g' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='%2380c800'/><stop offset='0.14' stop-color='%23808000'/><stop offset='0.6' stop-color='%23808000'/><stop offset='1' stop-color='%23801400'/></linearGradient></defs><rect width='64' height='64' fill='url(%23g)'/></svg>"
          preserveAspectRatio="none"
          result="map"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale="95"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
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

  // Liquid Glass tier gating (docs/liquid-glass.md). Deliberately NOT the
  // legacy getPerformanceClass() output: .mobile-conservative carries
  // `* { transform/transition: none !important }` rules that must never
  // apply site-wide from <body>. No class until client detection ran —
  // the un-gated default styling is the cheap liquid-lite look.
  const { performanceLevel } = usePerformanceOptimization()
  const lgDetected = ref(false)
  const lgCanLens = ref(false)
  onMounted(() => {
    lgDetected.value = true
    // navigator.userAgentData exists only in Chromium — the only engine that
    // renders SVG filters over backdrops. @supports can't detect this
    // (Safari/Firefox parse `filter: url()` fine, they just don't render it).
    lgCanLens.value = Boolean(navigator.userAgentData)
  })

  useHead({
    htmlAttrs: {
      lang: computed(() => LOCALE_TO_LANG[locale.value] ?? 'uk-UA')
    },
    bodyAttrs: {
      class: computed(() => {
        if (!lgDetected.value) return ''
        const classes = [`lg-tier-${performanceLevel.value.level}`]
        if (lgCanLens.value) classes.push('lg-can-lens')
        return classes.join(' ')
      })
    }
  })
</script>
