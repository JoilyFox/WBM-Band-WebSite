import { useLocalePath } from '#i18n'
import { getReleaseBySlug } from '~/data/musicLibrary'
import { getConfig, isUpcomingRelease } from '~/utils/configHelpers'
import { hasPreSaveLinks } from '~/utils/preSave'
import { releaseGateLocation } from '~/utils/releaseGate'
import { SOURCE_PREFIXES } from '~/utils/sourceAttribution'

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

  const localePath = useLocalePath()

  // An already-released track always forwards to /listen — checked BEFORE the
  // global enablePreSave flag so old QR codes / stories / emails keep working
  // after the campaign is switched off.
  if (!isUpcomingRelease(release.releaseDate)) {
    const target = sourcePrefix ? `/listen/${sourcePrefix}/${slug}` : `/listen/${slug}`
    // Carry the query across: it holds the promo-campaign id (`?c=…`), which
    // would otherwise be dropped by the redirect.
    return navigateTo({ path: localePath(target), query: to.query ?? {} }, { redirectCode: 302 })
  }

  const enablePreSave = Boolean(getConfig('general.enablePreSave', { fallback: false }))
  if (!enablePreSave) {
    return navigateTo(releaseGateLocation(localePath, 'presave_disabled'), { replace: true })
  }

  if (!hasPreSaveLinks(release)) {
    return navigateTo(
      releaseGateLocation(localePath, 'presave_not_ready', release.releaseDate || undefined),
      { replace: true }
    )
  }
})
