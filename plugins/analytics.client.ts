import { getOrPersistSourcePlatform } from '~/utils/sourceAttribution'

/**
 * Lock in first-touch source attribution as soon as the app boots, then
 * push it as a GA4 user property so every subsequent event inherits it
 * (including auto-fired page_view from nuxt-gtag).
 *
 * Path-prefix routes call setExplicitSourcePlatform() in their page
 * setup, which runs before this plugin's mount hook — so explicit
 * attribution from a /listen/i/<slug>-style URL still wins.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { gtag } = useGtag()

  nuxtApp.hook('app:mounted', () => {
    const source = getOrPersistSourcePlatform()
    gtag('set', 'user_properties', { source_platform: source })
  })
})
