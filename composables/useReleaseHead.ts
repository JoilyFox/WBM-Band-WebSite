import { computed, type ComputedRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SITE_URL } from '~/constants/app'
import { getReleaseBySlug } from '~/data/musicLibrary'
import { isUpcomingRelease } from '~/utils/configHelpers'

/** Real pixel size of the square release cover JPEGs used for og:image. */
const COVER_IMAGE_SIZE = 800

export type ReleaseView = 'links' | 'lyrics'

export interface UseReleaseHeadOptions {
  slug: string
  localizedTitle: ComputedRef<string>
  localizedDescription: ComputedRef<string>
  metaImageUrl: ComputedRef<string>
  /**
   * Which view the page is currently showing. The release page (/listen/<slug>)
   * starts at 'links'; the dedicated lyrics page (/lyrics/<slug>) starts at
   * 'lyrics'. When the in-page Lyrics button cross-slides between the two, the
   * component emits `view-change` and the page flips this ref — keeping the
   * <title> and <link rel="canonical"> in sync with the address bar WITHOUT a
   * full navigation. Crawlers only ever see the static prerendered head (the
   * correct one per route); this reactive swap is the client-side nicety.
   */
  view: Ref<ReleaseView>
}

/**
 * Shared, view-aware <head> for the release + lyrics pages. Both render the same
 * MusicDetailContent, so they share one head builder that swaps title / meta /
 * canonical between the "listen" and "lyrics" variants.
 *
 * Canonical is PER-LOCALE so each language ranks in its own language: the UA hub
 * is the clean, NON-localized URL (the /listen·/lyrics aliases are byte-copies of
 * the `ua` route + the sitemap entry), while EN self-canonicalizes to its /en/
 * URL. Pointing both locales at one canonical would make Google follow it and
 * drop the English page. Reciprocal hreflang (uk-UA / en-US / x-default→UA) pairs
 * the two versions; og:url tracks the canonical. (See the seo-entity skill.)
 */
export function useReleaseHead(opts: UseReleaseHeadOptions) {
  const { t, locale } = useI18n({ useScope: 'global' })

  useHead(
    computed(() => {
      const isLyrics = opts.view.value === 'lyrics'
      // Only the listen view: a lyrics page is a real, sitemap-listed document either way.
      const isUpcoming = !isLyrics && isUpcomingRelease(getReleaseBySlug(opts.slug)?.releaseDate)
      const songName = opts.localizedTitle.value
      const isEn = locale.value === 'en'
      const path = isLyrics ? `/lyrics/${opts.slug}` : `/listen/${opts.slug}`

      // UA hub = clean non-localized URL; EN self-canonical = /en/<path>.
      const uaUrl = `${SITE_URL}${path}`
      const enUrl = `${SITE_URL}/en${path}`
      const canonical = isEn ? enUrl : uaUrl

      const title = isLyrics
        ? `${t('music.detail.lyrics_page_title', { songName })} | WBM Band`
        : `${songName} | WBM Band`
      const description = isLyrics
        ? (t('music.detail.lyrics_meta_description', { songName }) as string)
        : opts.localizedDescription.value

      return {
        title,
        meta: [
          { name: 'description', content: description },
          { property: 'og:title', content: title },
          { property: 'og:description', content: description },
          { property: 'og:image', content: opts.metaImageUrl.value },
          // Release covers are 800x800 JPEGs (public/images/optimized/albums-images)
          // — declare the real size so Facebook/LinkedIn don't crop or stretch.
          { property: 'og:image:width', content: String(COVER_IMAGE_SIZE) },
          { property: 'og:image:height', content: String(COVER_IMAGE_SIZE) },
          { property: 'og:type', content: 'music.song' },
          { property: 'og:url', content: canonical },
          // OG locale uses underscores (uk_UA), unlike hreflang's hyphen.
          { property: 'og:locale', content: isEn ? 'en_US' : 'uk_UA' },
          { property: 'og:locale:alternate', content: isEn ? 'uk_UA' : 'en_US' },
          // og:type is music.song — point to the band entity (Open Graph music ns).
          { property: 'music:musician', content: SITE_URL },
          { name: 'twitter:card', content: 'summary' },
          { name: 'twitter:title', content: title },
          { name: 'twitter:description', content: description },
          { name: 'twitter:image', content: opts.metaImageUrl.value },
          // While the release is still upcoming, /listen/<slug> is prerendered as
          // a real page but is NOT the public destination yet (visitors are sent
          // to the pre-save / locked page at runtime). Keep it out of the index
          // until it is released.
          ...(isUpcoming ? [{ name: 'robots', content: 'noindex' }] : [])
        ],
        link: [
          { rel: 'canonical', href: canonical },
          // Reciprocal alternates — identical set on every URL in the cluster,
          // self-reference included. hreflang language code is `uk`, NOT the
          // `ua` route prefix; x-default → the UA hub (the default locale).
          { rel: 'alternate', hreflang: 'uk-UA', href: uaUrl },
          { rel: 'alternate', hreflang: 'en-US', href: enUrl },
          { rel: 'alternate', hreflang: 'x-default', href: uaUrl }
        ]
      }
    })
  )
}
