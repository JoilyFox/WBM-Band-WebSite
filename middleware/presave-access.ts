import { useLocalePath } from '#i18n'
import { getReleaseBySlug } from '~/data/musicLibrary'
import { formatReleaseDate, getConfig, isUpcomingRelease } from '~/utils/configHelpers'
import { SOURCE_PREFIXES } from '~/utils/sourceAttribution'

export default defineNuxtRouteMiddleware(async (to) => {
  const slugParam = to.params?.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) return

  const sourceParam = to.params?.source
  const sourceRaw = Array.isArray(sourceParam) ? sourceParam[0] : sourceParam
  const sourcePrefix = sourceRaw && sourceRaw in SOURCE_PREFIXES ? sourceRaw : undefined

  const release = getReleaseBySlug(slug)
  if (!release) return

  const enablePreSave = Boolean(getConfig('general.enablePreSave', { fallback: false }))
  if (!enablePreSave) {
    return navigateTo(
      {
        path: '/404',
        query: {
          title: 'Pre-save Disabled',
          message: 'Pre-save access is currently turned off for this release.',
          buttonText: 'Go to Home',
          buttonLink: '/',
          buttonIcon: 'pi pi-home'
        }
      },
      { replace: true }
    )
  }

  if (!isUpcomingRelease(release.releaseDate)) {
    const localePath = useLocalePath()
    const target = sourcePrefix ? `/listen/${sourcePrefix}/${slug}` : `/listen/${slug}`
    return navigateTo(localePath(target), { redirectCode: 302 })
  }

  const hasPreSaveLinks = Boolean(
    (release.preSaveMusicPlatformLinks &&
      Object.values(release.preSaveMusicPlatformLinks).some(Boolean)) ||
      release.distributorPreSaveUrl
  )
  if (!hasPreSaveLinks) {
    const i18nLocale = useNuxtApp()?.$i18n?.locale?.value
    const normalizedLocale =
      i18nLocale === 'ua' ? 'uk-UA' : i18nLocale === 'en' ? 'en-US' : i18nLocale || 'en-US'
    const formattedDate = release.releaseDate
      ? formatReleaseDate(release.releaseDate, normalizedLocale)
      : 'TBA'
    return navigateTo(
      {
        path: '/404',
        query: {
          title: 'Pre-save Not Ready',
          message: `Pre-save links for this release are not configured yet. Please try again closer to ${formattedDate}.`,
          buttonText: 'Go to Home',
          buttonLink: '/',
          buttonIcon: 'pi pi-home'
        }
      },
      { replace: true }
    )
  }
})
