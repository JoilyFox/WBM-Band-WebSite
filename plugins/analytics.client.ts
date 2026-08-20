import { getOrPersistSourcePlatform } from '~/utils/sourceAttribution'
import { getOrPersistCampaign } from '~/utils/campaignAttribution'

/**
 * Lock in first-touch source + promo-campaign attribution as soon as the app
 * boots and make both ride every subsequent GA4 event.
 *
 * Carriers (both set, on purpose):
 *   1. gtag('set', { source_platform })           → a DEFAULT EVENT PARAMETER
 *      (ep.source_platform) attached to every subsequent event, INCLUDING the
 *      auto-fired page_view. This is what feeds our EVENT-scoped custom
 *      dimension on the standard Acquisition / Pages reports — without it those
 *      reports read "(not set)" because page_view otherwise carries no source.
 *   2. gtag('set', 'user_properties', { source_platform }) → a USER PROPERTY
 *      (up.source_platform) that feeds a USER-scoped custom dimension, if one
 *      is registered. Kept so the value is queryable at user scope too.
 *
 * A GA4 custom dimension only reads the carrier bound to its scope (event-scoped
 * reads ep.*, user-scoped reads up.*) — they never cross-read — so we populate
 * both to be robust to however the dimension is registered in Admin.
 *
 * Path-prefix routes call setExplicitSourcePlatform() in their page setup, which
 * runs before this plugin's mount hook — so explicit attribution from a
 * /listen/i/<slug>-style URL still wins. (The cold-load first page_view fires
 * before app:mounted, so it alone won't carry source_platform; the release_view
 * conversion event always does.)
 */
// Hostnames whose traffic counts as real visitors. Anything else that still
// runs a production build (e.g. `npx serve .output/public` on localhost) gets
// tagged traffic_type=internal so GA4's "Internal Traffic" data filter can
// exclude it. Dev servers and GitHub Pages staging never send at all —
// `gtag.enabled` in nuxt.config.ts disables the module for those builds.
const PRODUCTION_HOSTS = ['wbmband.com', 'www.wbmband.com']

export default defineNuxtPlugin((nuxtApp) => {
  const { gtag } = useGtag()

  // Read the campaign id from the LANDING url, in the plugin body — route
  // middleware (pre-save → listen, unknown-prefix → clean url) runs later and
  // may replace the url; by then `?c=…` could be gone. Persisting it here means
  // the redirect target still reports the campaign. Everything else can wait
  // for app:mounted, where gtag is live.
  const campaign = getOrPersistCampaign()

  nuxtApp.hook('app:mounted', () => {
    if (!PRODUCTION_HOSTS.includes(window.location.hostname)) {
      gtag('set', { traffic_type: 'internal' })
    }
    const source = getOrPersistSourcePlatform()
    gtag('set', { source_platform: source, campaign_id: campaign })
    gtag('set', 'user_properties', { source_platform: source, campaign_id: campaign })
  })
})
