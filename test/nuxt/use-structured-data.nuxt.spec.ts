// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent, unref } from 'vue'
import { useReleaseStructuredData } from '~/composables/useStructuredData'
import { getReleaseBySlug, musicLibrary, type MusicRelease } from '~/data/musicLibrary'
import { SITE_URL } from '~/constants/app'
import { setTestLocale } from './helpers/i18n'

// T-01: the JSON-LD is the part of the SEO surface with the least net under it.
// useHead is mocked to capture the (reactive) head input; we evaluate it and parse
// the ld+json graph exactly as a crawler would see it in the static HTML.

const { heads } = vi.hoisted(() => ({ heads: [] as unknown[] }))
mockNuxtImport('useHead', () => (input: unknown) => {
  heads.push(input)
})

const BAND_ID = `${SITE_URL}/#band`

const Harness = defineComponent({
  props: {
    release: { type: Object, required: true },
    variant: { type: String, default: 'listen' }
  },
  setup(props) {
    useReleaseStructuredData({
      release: props.release as MusicRelease,
      localizedTitle: computed(() => 'Тестова назва'),
      metaImageUrl: computed(() => `${SITE_URL}/cover.jpg`),
      variant: props.variant as 'listen' | 'lyrics'
    })
    return () => null
  }
})

async function graph(release: MusicRelease, variant: 'listen' | 'lyrics' = 'listen') {
  heads.length = 0
  await mountSuspended(Harness, { props: { release, variant } })
  const head = unref(heads[heads.length - 1] as any)
  const json = JSON.parse(head.script[0].innerHTML)
  const nodes = json['@graph'] as Record<string, any>[]
  return {
    recording: nodes.find((n) => n['@type'] === 'MusicRecording')!,
    breadcrumb: nodes.find((n) => n['@type'] === 'BreadcrumbList')!,
    raw: head.script[0].innerHTML as string
  }
}

const withLyrics = musicLibrary.find((r) => r.lyrics && r.lyrics.length > 0)!
const khvyli = getReleaseBySlug('khvyli')!

beforeEach(async () => {
  await setTestLocale('ua')
})

afterEach(async () => {
  await setTestLocale('ua')
})

describe('useReleaseStructuredData', () => {
  describe('one language-independent @id per recording (B-09)', () => {
    it('uses the Ukrainian listen URL + #recording on the listen page, in both locales', async () => {
      const expected = `${SITE_URL}/listen/${khvyli.slug}#recording`
      expect((await graph(khvyli)).recording['@id']).toBe(expected)
      await setTestLocale('en')
      expect((await graph(khvyli)).recording['@id']).toBe(expected)
    })

    it('uses the SAME @id on the lyrics page (not the lyrics URL), in both locales', async () => {
      const expected = `${SITE_URL}/listen/${withLyrics.slug}#recording`
      expect((await graph(withLyrics, 'lyrics')).recording['@id']).toBe(expected)
      await setTestLocale('en')
      expect((await graph(withLyrics, 'lyrics')).recording['@id']).toBe(expected)
    })

    it('keeps the composition @id language independent too', async () => {
      const expected = `${SITE_URL}/lyrics/${withLyrics.slug}#composition`
      expect((await graph(withLyrics, 'lyrics')).recording.recordingOf['@id']).toBe(expected)
      await setTestLocale('en')
      expect((await graph(withLyrics, 'lyrics')).recording.recordingOf['@id']).toBe(expected)
    })
  })

  describe('url + breadcrumb are locale-aware (match the page canonical)', () => {
    it('ua listen: clean, unprefixed URLs', async () => {
      const { recording, breadcrumb } = await graph(khvyli)
      expect(recording.url).toBe(`${SITE_URL}/listen/khvyli`)
      expect(breadcrumb.itemListElement.map((i: any) => i.item)).toEqual([
        SITE_URL,
        `${SITE_URL}/listen/khvyli`
      ])
    })

    it('en listen: /en URLs in url AND breadcrumb', async () => {
      await setTestLocale('en')
      const { recording, breadcrumb } = await graph(khvyli)
      expect(recording.url).toBe(`${SITE_URL}/en/listen/khvyli`)
      expect(breadcrumb.itemListElement.map((i: any) => i.item)).toEqual([
        `${SITE_URL}/en`,
        `${SITE_URL}/en/listen/khvyli`
      ])
    })

    it('en lyrics: third crumb + url point at /en/lyrics', async () => {
      await setTestLocale('en')
      const { recording, breadcrumb } = await graph(withLyrics, 'lyrics')
      expect(recording.url).toBe(`${SITE_URL}/en/lyrics/${withLyrics.slug}`)
      expect(breadcrumb.itemListElement).toHaveLength(3)
      expect(breadcrumb.itemListElement[2].item).toBe(`${SITE_URL}/en/lyrics/${withLyrics.slug}`)
      expect(breadcrumb.itemListElement[2].position).toBe(3)
    })

    it('ua lyrics: third crumb + url point at the clean /lyrics URL', async () => {
      const { recording, breadcrumb } = await graph(withLyrics, 'lyrics')
      expect(recording.url).toBe(`${SITE_URL}/lyrics/${withLyrics.slug}`)
      expect(breadcrumb.itemListElement[2].item).toBe(`${SITE_URL}/lyrics/${withLyrics.slug}`)
    })
  })

  describe('recording fields', () => {
    it('links the band by @id and sets byArtist', async () => {
      const { recording } = await graph(khvyli)
      expect(recording['@type']).toBe('MusicRecording')
      expect(recording.byArtist['@id']).toBe(BAND_ID)
    })

    it('publishes datePublished as the Kyiv calendar day, not the UTC one', async () => {
      // 2026-08-20T21:00:00Z is 00:00 on 21 Aug in Kyiv (EEST).
      expect(khvyli.releaseDate).toBe('2026-08-20T21:00:00Z')
      expect((await graph(khvyli)).recording.datePublished).toBe('2026-08-21')
    })

    it('omits datePublished for a release without a date (no crash)', async () => {
      const undated = { ...khvyli, releaseDate: undefined } as MusicRelease
      const { recording } = await graph(undated)
      expect(recording).not.toHaveProperty('datePublished')
      expect(recording.name).toBe('Тестова назва')
    })

    it('sets inLanguage "uk" in every UI locale (the songs are Ukrainian)', async () => {
      expect((await graph(khvyli)).recording.inLanguage).toBe('uk')
      await setTestLocale('en')
      expect((await graph(khvyli)).recording.inLanguage).toBe('uk')
    })

    it('falls back to the band genre when the release has none', async () => {
      const noGenre = { ...khvyli, genre: undefined } as MusicRelease
      expect((await graph(noGenre)).recording.genre).toContain('Alternative rock')
    })

    it('embeds the lyric text ONLY on the lyrics variant', async () => {
      expect((await graph(withLyrics, 'listen')).recording.recordingOf).toBeUndefined()
      const lyrics = (await graph(withLyrics, 'lyrics')).recording.recordingOf
      expect(lyrics['@type']).toBe('MusicComposition')
      expect(lyrics.lyrics.text).toContain(withLyrics.lyrics![0].lines[0])
    })

    it('escapes "<" so the JSON-LD can never close its <script> tag', async () => {
      const evil = { ...khvyli, genre: ['</script><b>'] } as MusicRelease
      const { raw } = await graph(evil)
      expect(raw).not.toContain('</script>')
      expect(raw).toContain('\\u003c/script>')
    })
  })
})
