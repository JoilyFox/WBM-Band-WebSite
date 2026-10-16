import { useLocalePath } from '#i18n'
import { getReleaseBySlug } from '~/data/musicLibrary'
import { getConfig, isUpcomingRelease } from '~/utils/configHelpers'
import { hasPreSaveLinks } from '~/utils/preSave'
import { releaseGateLocation } from '~/utils/releaseGate'
import { SOURCE_PREFIXES } from '~/utils/sourceAttribution'

/**
 * Guards /listen/<slug> (and /listen/<source>/<slug>).
 *
 * The release state is decided at RUNTIME, never baked into the static output:
 *   - released (releaseDate passed)  → show the page. Because the prerendered
 *     HTML for an upcoming release is a real page (below), the page and its
 *     `releaseSmartLink` CTA come alive on release day without a redeploy.
 *   - upcoming + pre-save available  → 302 to the pre-save page.
 *   - upcoming otherwise             → localized "locked" page.
 *
 * During prerender we deliberately do NOT redirect. A redirect there would be
 * frozen into a meta-refresh stub with no app JS, so the client middleware would
 * never run and the URL would stay "locked" until the next deploy. Instead the
 * real page is prerendered (useReleaseHead marks it `noindex` while upcoming) and
 * this middleware takes over on the client during hydration.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const slugParam = to.params?.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) return

  const sourceParam = to.params?.source
  const sourceRaw = Array.isArray(sourceParam) ? sourceParam[0] : sourceParam
  const sourcePrefix =
    sourceRaw && Object.hasOwn(SOURCE_PREFIXES, sourceRaw) ? sourceRaw : undefined

  const release = getReleaseBySlug(slug)
  if (!release) return

  if (!isUpcomingRelease(release.releaseDate)) {
    return
  }

  // Build time: emit the real page, let the client decide (see above).
  if (import.meta.prerender) return

  const localePath = useLocalePath()
  const enablePreSave = Boolean(getConfig('general.enablePreSave', { fallback: false }))

  if (enablePreSave && hasPreSaveLinks(release)) {
    const target = sourcePrefix ? `/pre-save/${sourcePrefix}/${slug}` : `/pre-save/${slug}`
    // Carry the query across: it holds the promo-campaign id (`?c=…`), which
    // would otherwise be dropped by the redirect.
    return navigateTo({ path: localePath(target), query: to.query ?? {} }, { redirectCode: 302 })
  }

  return navigateTo(releaseGateLocation(localePath, 'release_locked', release.releaseDate), {
    replace: true
  })
})
