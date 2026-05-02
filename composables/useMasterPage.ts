import { computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { getReleaseBySlug, type MusicRelease } from '~/data/musicLibrary'
import {
  SOURCE_PREFIXES,
  setExplicitSourcePlatform,
  type SourcePrefix,
  type SourcePlatform
} from '~/utils/sourceAttribution'

export type MasterPageType = 'listen' | 'pre-save'

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
  keywords: ReturnType<typeof computed<string>>
  resolvedSource: SourcePlatform | null
}

const SITE_BASE_URL = 'https://www.wbmband.com'

const CYRILLIC_TRANSLIT_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ye',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'yi',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'yu',
  я: 'ya'
}

const BASE_KEYWORDS = [
  'WBM',
  'WBM Band',
  'Woman Based Mechanics',
  'ВМБ',
  'ВБМ гурт',
  'Вуман Бейсд Меканікс',
  'Вумен Бейсд Мекенікс',
  'rock',
  'punk',
  'alternative',
  'music',
  'band',
  'рок',
  'панк',
  'альтернатива',
  'музика',
  'гурт',
  'wbm music',
  'вбм музика',
  'вмб музика'
]

function buildKeywords(title: string): string {
  const titleLower = title.toLowerCase()
  const releaseKeywords = [
    title,
    `${title} WBM`,
    `${title} WBM Band`,
    `${title} Woman Based Mechanics`,
    `${title} ВМБ`,
    `${title} ВБМ`,
    `${title} Вуман Бейсд Меканікс`
  ]

  if (/[а-яА-Я]/.test(title)) {
    const transliterated = titleLower
      .split('')
      .map((char) => CYRILLIC_TRANSLIT_MAP[char] ?? char)
      .join('')
    if (transliterated !== titleLower) {
      releaseKeywords.push(transliterated, `${transliterated} WBM`, `${transliterated} WBM Band`)
    }
  }

  return [...new Set([...releaseKeywords, ...BASE_KEYWORDS])].join(', ')
}

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
 * title/description, OG meta image, canonical URL, SEO keyword list, and
 * (optionally) source-prefix attribution.
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

  const keywords = computed<string>(() => buildKeywords(localizedTitle.value))

  let resolvedSource: SourcePlatform | null = null
  if (
    sourcePrefix &&
    (Object.keys(SOURCE_PREFIXES) as SourcePrefix[]).includes(sourcePrefix as SourcePrefix)
  ) {
    resolvedSource = SOURCE_PREFIXES[sourcePrefix as SourcePrefix]
  }

  onMounted(() => {
    if (resolvedSource) {
      setExplicitSourcePlatform(resolvedSource)
    }

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
    keywords,
    resolvedSource
  }
}
