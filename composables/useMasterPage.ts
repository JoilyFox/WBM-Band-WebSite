import { computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { getReleaseBySlug, type MusicRelease } from '~/data/musicLibrary'
import { SITE_URL } from '~/constants/app'
import {
  SOURCE_PREFIXES,
  setExplicitSourcePlatform,
  type SourcePrefix,
  type SourcePlatform
} from '~/utils/sourceAttribution'

export type MasterPageType = 'listen' | 'pre-save' | 'lyrics'

export interface UseMasterPageOptions {
  slug: string
  pageType: MasterPageType
  /** When the route includes a source prefix segment (`/listen/i/<slug>`),
   *  pass it here so the composable locks in the explicit attribution. */
  sourcePrefix?: string
}

export interface UseMasterPageReturn {
  release: MusicRelease
  localizedTitle: ReturnType<typeof computed<string>>
  localizedDescription: ReturnType<typeof computed<string>>
  metaImageUrl: ReturnType<typeof computed<string>>
  pageUrl: ReturnType<typeof computed<string>>
  resolvedSource: SourcePlatform | null
}

const SITE_BASE_URL = SITE_URL

function normalizeImageUrl(imageUrl: string): string {
  let normalized = imageUrl
  if (normalized.endsWith('.avif')) normalized = normalized.replace('.avif', '.jpg')
  else if (normalized.endsWith('.webp')) normalized = normalized.replace('.webp', '.jpg')
  return normalized.startsWith('http') ? normalized : `${SITE_BASE_URL}${normalized}`
}

function buildPageUrl(
  locale: string,
  pageType: MasterPageType,
  slug: string,
  sourcePrefix?: string
): string {
  const localeSegment = locale === 'ua' ? 'ua' : locale
  const prefixSegment = sourcePrefix ? `/${sourcePrefix}` : ''
  return `${SITE_BASE_URL}/${localeSegment}/${pageType}${prefixSegment}/${slug}`
}

/**
 * Shared setup for listen + pre-save master pages: release lookup, i18n
 * title/description, OG meta image, canonical URL, and (optionally)
 * source-prefix attribution.
 *
 * Throws a 404 createError if the slug isn't in musicLibrary. Pages
 * are responsible for calling `useHead` / `useSeoMeta` with the returned
 * values — the composable doesn't apply head meta itself, so callers
 * keep full control over the shape (og:image dimensions, twitter card
 * variant, etc.).
 */
export function useMasterPage(options: UseMasterPageOptions): UseMasterPageReturn {
  const { slug, pageType, sourcePrefix } = options
  const release = getReleaseBySlug(slug)

  if (!release) {
    throw createError({
      statusCode: 404,
      statusMessage: `${pageType === 'pre-save' ? 'Pre-save track' : 'Music track'} "${slug}" not found`,
      data: { slug }
    })
  }

  const { t, locale } = useI18n({ useScope: 'global' })

  const titleKey = release.titleKey || `releases.${release.slug}.title`
  const descriptionKey = release.descriptionKey || `releases.${release.slug}.description`

  const localizedTitle = computed<string>(() => {
    const translated = t(titleKey) as string
    return translated !== titleKey && translated ? translated : release.title || release.slug
  })

  const localizedDescription = computed<string>(() => {
    const translated = t(descriptionKey) as string
    if (translated !== descriptionKey && translated) return translated
    if (pageType === 'pre-save') {
      return (
        release.description ||
        `Pre-save ${localizedTitle.value} by WBM Band on your favorite music platform.`
      )
    }
    const fallback = t('listen.meta_description', { songName: localizedTitle.value }) as string
    return fallback !== 'listen.meta_description' && fallback
      ? fallback
      : release.description || `Listen to ${localizedTitle.value} by WBM Band.`
  })

  const metaImageUrl = computed<string>(() => normalizeImageUrl(release.imageUrl))

  const pageUrl = computed<string>(() => buildPageUrl(locale.value, pageType, slug, sourcePrefix))

  let resolvedSource: SourcePlatform | null = null
  if (
    sourcePrefix &&
    (Object.keys(SOURCE_PREFIXES) as SourcePrefix[]).includes(sourcePrefix as SourcePrefix)
  ) {
    resolvedSource = SOURCE_PREFIXES[sourcePrefix as SourcePrefix]
    // Lock in attribution synchronously in setup (client side only) so
    // any subsequent code — including the page's own onMounted hooks
    // that fire trackReleaseView — reads the right source.
    if (import.meta.client) {
      setExplicitSourcePlatform(resolvedSource)
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      // Reset body overflow that the modal route may have set.
      document.body.style.overflow = ''
      // When arriving from internal nav (e.g. modal close), pop scroll to top.
      const referrer = document.referrer
      const currentHost = window.location.host
      const isInternalNavigation =
        Boolean(referrer) && referrer.includes(currentHost) && referrer !== window.location.href
      if (isInternalNavigation) {
        nextTick(() => window.scrollTo(0, 0))
      }
    }
  })

  return {
    release,
    localizedTitle,
    localizedDescription,
    metaImageUrl,
    pageUrl,
    resolvedSource
  }
}
