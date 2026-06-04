import { computed, type ComputedRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SITE_URL } from '~/constants/app'

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
 * canonical between the "listen" and "lyrics" variants. The canonical is always
 * the clean, NON-localized URL (matching the sitemap + JSON-LD); og:url keeps the
 * localized path the visitor is actually on.
 */
export function useReleaseHead(opts: UseReleaseHeadOptions) {
  const { t, locale } = useI18n({ useScope: 'global' })

  useHead(
    computed(() => {
      const isLyrics = opts.view.value === 'lyrics'
      const songName = opts.localizedTitle.value
      const localeSeg = locale.value === 'ua' ? 'ua' : locale.value
      const canonicalPath = isLyrics ? `/lyrics/${opts.slug}` : `/listen/${opts.slug}`

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
          { property: 'og:image:width', content: '1200' },
          { property: 'og:image:height', content: '1200' },
          { property: 'og:type', content: 'music.song' },
          { property: 'og:url', content: `${SITE_URL}/${localeSeg}${canonicalPath}` },
          { name: 'twitter:card', content: 'summary' },
          { name: 'twitter:title', content: title },
          { name: 'twitter:description', content: description },
          { name: 'twitter:image', content: opts.metaImageUrl.value }
        ],
        link: [{ rel: 'canonical', href: `${SITE_URL}${canonicalPath}` }]
      }
    })
  )
}
