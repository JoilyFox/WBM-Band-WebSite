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

  if (!isUpcomingRelease(release.releaseDate)) {
    return
  }

  const hasPreSaveLinks = Boolean(
    release.preSaveMusicPlatformLinks &&
      Object.values(release.preSaveMusicPlatformLinks).some(Boolean)
  )
  const enablePreSave = Boolean(getConfig('general.enablePreSave', { fallback: false }))

  if (enablePreSave && hasPreSaveLinks) {
    const localePath = useLocalePath()
    const target = sourcePrefix ? `/pre-save/${sourcePrefix}/${slug}` : `/pre-save/${slug}`
    return navigateTo(localePath(target), { redirectCode: 302 })
  }

  const i18nLocale = useNuxtApp()?.$i18n?.locale?.value
  const normalizedLocale =
    i18nLocale === 'ua' ? 'uk-UA' : i18nLocale === 'en' ? 'en-US' : i18nLocale || 'en-US'
  const formattedDate = formatReleaseDate(release.releaseDate, normalizedLocale)

  return navigateTo(
    {
      path: '/404',
      query: {
        title: 'Release Not Available',
        message: `This track unlocks on ${formattedDate}. Please check back soon.`,
        buttonText: 'Go to Home',
        buttonLink: '/',
        buttonIcon: 'pi pi-home'
      }
    },
    { replace: true }
  )
})
