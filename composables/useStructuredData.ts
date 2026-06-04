import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { SITE_URL } from '~/constants/app'
import { generalConfig } from '~/config/general'
import type { MusicRelease } from '~/data/musicLibrary'

/**
 * schema.org JSON-LD structured data for the band + releases.
 *
 * Why this exists: it gives Google and AI/LLM crawlers a machine-readable,
 * consistent description of the band entity (name, aliases, genre, official
 * profiles via `sameAs`) and each release. This is ENTITY HYGIENE — it helps
 * engines correctly identify and consolidate the band across the web. It is NOT
 * an "AI visibility unlock" (Google states structured data isn't required for AI
 * features) and there is NO Google music rich result, so MusicRecording won't
 * produce a song card; the one earnable rich result here is the BreadcrumbList.
 *
 * Hard rules baked in (see docs/ai-search-optimization-strategy.md §5):
 *  - ONE band entity, referenced everywhere by a stable @id, so a release's
 *    MusicRecording links back to the same MusicGroup instead of declaring a
 *    second, conflicting band node.
 *  - `sameAs` contains ONLY real, non-empty profile URLs — empty config
 *    placeholders (Spotify/Apple/MusicBrainz/Wikidata, pending the off-site
 *    Phase 3) are filtered out, because a broken sameAs target hurts the signal.
 *  - NO `member` nodes yet — the team data still uses i.pravatar.cc placeholders
 *    (data/teamMembers.ts); shipping those as the band's verified identity would
 *    poison the entity. Add members here only after real data replaces them.
 *  - NO Review / aggregateRating — there are no genuine user reviews, and self
 *    ratings are the top trigger for a "Spammy structured markup" manual action.
 *  - Everything runs at setup level so the JSON-LD is baked into the SSG HTML
 *    (AI search crawlers execute zero JavaScript).
 */

// Stable @id anchors so every page references ONE band / website entity.
const BAND_ID = `${SITE_URL}/#band`
const WEBSITE_ID = `${SITE_URL}/#website`

// Band genre — stable identity, kept consistent with the bio (about.content)
// and the DSP genre. Descriptive metadata, not a ranking lever.
const BAND_GENRE = ['Alternative rock', 'Rock', 'Punk']

// Square raster logo (>= 112px) per Google's Organization logo guidance.
const BAND_LOGO = `${SITE_URL}/android-chrome-512x512.png`

/**
 * Collect the band's external profile URLs for `sameAs` — the single most
 * important property for entity reconciliation. Only non-empty, real
 * artist-level URLs survive the filter.
 */
function bandSameAs(): string[] {
  const { socialMedia, streamingPlatforms, entityProfiles } = generalConfig
  return [
    socialMedia.instagram,
    socialMedia.tiktok,
    socialMedia.youtube,
    socialMedia.facebook,
    socialMedia.twitter,
    streamingPlatforms.spotify,
    streamingPlatforms.appleMusic,
    streamingPlatforms.youtubeMusic,
    // Highest-leverage entity anchors — populated in Phase 3 once the records
    // exist. Empty today, so filtered out below.
    entityProfiles?.musicbrainz,
    entityProfiles?.wikidata
  ].filter((url): url is string => Boolean(url))
}

/** Serialize a JSON-LD graph, escaping `<` so it can never break out of the
 *  inline <script> tag. */
function jsonLd(graph: object[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(
    /</g,
    '\\u003c'
  )
}

/** Build the canonical band node. Referenced by @id from release pages. */
function bandNode(description: string) {
  return {
    '@type': 'MusicGroup',
    '@id': BAND_ID,
    // Lead with the full, unambiguous name; "WBM"/"WBM Band" are aliases (the
    // acronym collides with unrelated entities).
    name: generalConfig.fullBandName,
    alternateName: [generalConfig.bandName, 'WBM'],
    url: SITE_URL,
    logo: BAND_LOGO,
    image: BAND_LOGO,
    description,
    genre: BAND_GENRE,
    foundingLocation: { '@type': 'Place', name: 'Kyiv, Ukraine' },
    sameAs: bandSameAs()
  }
}

/**
 * Inject the site-wide band entity: MusicGroup + WebSite. Call once, on the
 * home page (where the band/about content lives).
 */
export function useBandStructuredData() {
  const { t } = useI18n({ useScope: 'global' })

  useHead(
    computed(() => ({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: jsonLd([
            bandNode(t('about.content') as string),
            {
              '@type': 'WebSite',
              '@id': WEBSITE_ID,
              name: generalConfig.bandName,
              alternateName: generalConfig.fullBandName,
              url: SITE_URL,
              inLanguage: ['uk', 'en'],
              publisher: { '@id': BAND_ID }
            }
          ])
        }
      ]
    }))
  )
}

interface ReleaseStructuredDataOptions {
  release: MusicRelease
  localizedTitle: ComputedRef<string>
  metaImageUrl: ComputedRef<string>
  /**
   * 'listen' (default) → the standard release page schema. 'lyrics' → the
   * dedicated /lyrics/<slug> page: the recording's @id/url/canonical point at
   * the lyrics URL, the full lyric text is embedded via recordingOf →
   * MusicComposition.lyrics, and a third breadcrumb crumb is added. The band
   * OWNS these lyrics, so embedding the text carries no rights concern.
   */
  variant?: 'listen' | 'lyrics'
}

/** Flatten a release's lyrics into a single newline-separated text block
 *  (sections separated by a blank line) for MusicComposition.lyrics. */
function lyricsToPlainText(release: MusicRelease): string {
  if (!release.lyrics || !release.lyrics.length) return ''
  return release.lyrics
    .map((section) => section.lines.join('\n'))
    .join('\n\n')
    .trim()
}

/**
 * Inject per-release structured data on a /listen/<slug> page: a MusicRecording
 * (referencing the band by @id) + a BreadcrumbList (the one active rich result
 * these deep pages can earn). URLs match the page's NON-localized canonical so
 * schema, canonical and sitemap all agree.
 *
 * With `variant: 'lyrics'` the same recording is re-anchored to the dedicated
 * /lyrics/<slug> page and gains the embedded lyric text + a "Lyrics" breadcrumb.
 */
export function useReleaseStructuredData(options: ReleaseStructuredDataOptions) {
  const { release, localizedTitle, metaImageUrl } = options
  const isLyrics = options.variant === 'lyrics'
  const { t } = useI18n({ useScope: 'global' })
  // Self-referential canonical for this page variant. Matches the canonical
  // declared by the page (pages/listen/[slug].vue or pages/lyrics/[slug].vue).
  const listenUrl = `${SITE_URL}/listen/${release.slug}`
  const lyricsUrl = `${SITE_URL}/lyrics/${release.slug}`
  const canonicalUrl = isLyrics ? lyricsUrl : listenUrl
  // Story key derived from the (correct) description key — some slugs use hyphens
  // while their i18n keys use underscores (e.g. chorni-ptahy → chorni_ptahy).
  const storyKey = (release.descriptionKey || `releases.${release.slug}.description`).replace(
    /\.description$/,
    '.story'
  )

  useHead(
    computed(() => {
      // The band's first-hand "about the song" prose lives ONLY in the structured
      // data — it feeds search + AI crawlers without any visible change to the
      // page, and without the spam risk that visually-hidden body text carries
      // (Google treats CSS-hidden text as a manipulation signal; JSON-LD is the
      // legitimate machine-only channel). The visible page keeps its short
      // description; this is the long form for bots.
      const story = t(storyKey) as string
      const recording: Record<string, unknown> = {
        '@type': 'MusicRecording',
        '@id': `${canonicalUrl}#recording`,
        name: localizedTitle.value,
        url: canonicalUrl,
        image: metaImageUrl.value,
        // Date only (no time) — matches the visible release date.
        datePublished: release.releaseDate.slice(0, 10),
        genre: release.genre && release.genre.length ? release.genre : BAND_GENRE,
        byArtist: {
          '@type': 'MusicGroup',
          '@id': BAND_ID,
          name: generalConfig.fullBandName
        }
      }
      if (story && story !== storyKey) recording.description = story

      // On the lyrics page, embed the actual lyric text as the composition the
      // recording is of — the machine-readable counterpart to the visible lyrics.
      if (isLyrics) {
        const lyricsText = lyricsToPlainText(release)
        if (lyricsText) {
          recording.recordingOf = {
            '@type': 'MusicComposition',
            '@id': `${lyricsUrl}#composition`,
            name: localizedTitle.value,
            lyrics: {
              '@type': 'CreativeWork',
              text: lyricsText
            }
          }
        }
      }

      const breadcrumbItems: object[] = [
        {
          '@type': 'ListItem',
          position: 1,
          name: generalConfig.fullBandName,
          item: SITE_URL
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: localizedTitle.value,
          item: listenUrl
        }
      ]
      if (isLyrics) {
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: 3,
          name: t('music.detail.lyrics_title') as string,
          item: lyricsUrl
        })
      }

      return {
        script: [
          {
            type: 'application/ld+json',
            innerHTML: jsonLd([
              recording,
              {
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbItems
              }
            ])
          }
        ]
      }
    })
  )
}
