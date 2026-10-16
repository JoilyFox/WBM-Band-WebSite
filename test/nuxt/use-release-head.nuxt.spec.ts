// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent, ref, unref, type Ref } from 'vue'
import { useReleaseHead, type ReleaseView } from '~/composables/useReleaseHead'
import { SITE_URL } from '~/constants/app'
import { musicLibrary } from '~/data/musicLibrary'
import { setTestLocale } from './helpers/i18n'

// T-01: canonical / hreflang / og / noindex of the release + lyrics pages.
// useHead is mocked to capture the reactive head input and evaluate it.

const { heads } = vi.hoisted(() => ({ heads: [] as unknown[] }))
mockNuxtImport('useHead', () => (input: unknown) => {
  heads.push(input)
})

const Harness = defineComponent({
  props: {
    slug: { type: String, required: true },
    view: { type: Object, required: true },
    description: { type: String, default: 'Опис' },
    songName: { type: String, default: 'Хвилі' }
  },
  setup(props) {
    useReleaseHead({
      slug: props.slug,
      localizedTitle: computed(() => props.songName),
      localizedDescription: computed(() => props.description),
      metaImageUrl: computed(() => `${SITE_URL}/images/cover.jpg`),
      view: props.view as Ref<ReleaseView>
    })
    return () => null
  }
})

async function head(
  slug: string,
  view: ReleaseView = 'links',
  description?: string,
  songName?: string
) {
  heads.length = 0
  const viewRef = ref<ReleaseView>(view)
  await mountSuspended(Harness, {
    props: {
      slug,
      view: viewRef,
      ...(description ? { description } : {}),
      ...(songName ? { songName } : {})
    }
  })
  const h = unref(heads[heads.length - 1] as any)
  const meta = (key: string, attr: 'name' | 'property' = 'property') =>
    (h.meta as any[]).find((m) => m[attr] === key)?.content as string | undefined
  const link = (rel: string, hreflang?: string) =>
    (h.link as any[]).find((l) => l.rel === rel && (!hreflang || l.hreflang === hreflang))?.href as
      | string
      | undefined
  return { h, meta, link, viewRef }
}

beforeEach(async () => {
  await setTestLocale('ua')
})

afterEach(async () => {
  vi.useRealTimers()
  await setTestLocale('ua')
})

describe('useReleaseHead', () => {
  describe('canonical + hreflang', () => {
    it('ua listen: canonical is the clean URL; og:url tracks it', async () => {
      const { link, meta } = await head('khvyli')
      expect(link('canonical')).toBe(`${SITE_URL}/listen/khvyli`)
      expect(meta('og:url')).toBe(`${SITE_URL}/listen/khvyli`)
      expect(meta('og:locale')).toBe('uk_UA')
    })

    it('en listen: self-canonical under /en', async () => {
      await setTestLocale('en')
      const { link, meta } = await head('khvyli')
      expect(link('canonical')).toBe(`${SITE_URL}/en/listen/khvyli`)
      expect(meta('og:url')).toBe(`${SITE_URL}/en/listen/khvyli`)
      expect(meta('og:locale')).toBe('en_US')
    })

    it('emits the identical reciprocal alternate set (uk-UA / en-US / x-default→UA)', async () => {
      for (const locale of ['ua', 'en'] as const) {
        await setTestLocale(locale)
        const { link } = await head('khvyli')
        expect(link('alternate', 'uk-UA')).toBe(`${SITE_URL}/listen/khvyli`)
        expect(link('alternate', 'en-US')).toBe(`${SITE_URL}/en/listen/khvyli`)
        expect(link('alternate', 'x-default')).toBe(`${SITE_URL}/listen/khvyli`)
      }
    })

    it('lyrics view swaps canonical + alternates to /lyrics', async () => {
      const { link } = await head('khvyli', 'lyrics')
      expect(link('canonical')).toBe(`${SITE_URL}/lyrics/khvyli`)
      expect(link('alternate', 'en-US')).toBe(`${SITE_URL}/en/lyrics/khvyli`)
    })

    it('re-evaluates canonical when the view flips (client-side lyrics toggle)', async () => {
      const { h, viewRef } = await head('khvyli', 'links')
      expect((h.link as any[]).find((l) => l.rel === 'canonical').href).toContain('/listen/')
      viewRef.value = 'lyrics'
      const flipped = unref(heads[heads.length - 1] as any)
      expect(flipped.link.find((l: any) => l.rel === 'canonical').href).toContain('/lyrics/')
    })
  })

  describe('social meta', () => {
    it('declares the real 800x800 cover size (SEO-02) and the summary card', async () => {
      const { meta } = await head('khvyli')
      expect(meta('og:image')).toBe(`${SITE_URL}/images/cover.jpg`)
      expect(meta('og:image:width')).toBe('800')
      expect(meta('og:image:height')).toBe('800')
      expect(meta('twitter:card', 'name')).toBe('summary')
    })
  })

  describe('noindex while upcoming', () => {
    // 'slipa-vulytsya' is 2026-10-29T22:00:00Z. Freeze only Date.
    it('is noindex before the release instant', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-29T21:59:59.999Z'))
      const { meta } = await head('slipa-vulytsya')
      expect(meta('robots', 'name')).toBe('noindex')
    })

    it('is indexable at and after the release instant', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-29T22:00:00.000Z'))
      expect((await head('slipa-vulytsya')).meta('robots', 'name')).toBeUndefined()
      vi.setSystemTime(new Date('2026-10-29T22:00:00.001Z'))
      expect((await head('slipa-vulytsya')).meta('robots', 'name')).toBeUndefined()
    })

    it('never noindexes an already released track', async () => {
      expect((await head('khvyli')).meta('robots', 'name')).toBeUndefined()
    })

    it('never noindexes the lyrics view (a real, sitemap-listed document)', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-10-01T00:00:00Z'))
      expect((await head('slipa-vulytsya', 'lyrics')).meta('robots', 'name')).toBeUndefined()
    })
  })
  // SEO-05 / SEO-06: titles name the song AND the band; descriptions land in the
  // 120-155 char window, mention the band, and are localized.
  describe('title + description copy', () => {
    // Real runtime strings: importing the locale JSON here would yield the compiled
    // message AST that @nuxtjs/i18n's build plugin produces, not plain text.
    const copyFor = (slug: string) => {
      const { t } = (useNuxtApp() as unknown as { $i18n: { t: (k: string) => string } }).$i18n
      const key = slug.replace(/-/g, '_')
      return { title: t(`releases.${key}.title`), description: t(`releases.${key}.description`) }
    }

    for (const locale of ['ua', 'en'] as const) {
      for (const release of musicLibrary) {
        it(`${locale} ${release.slug}: listen title + description are search-ready`, async () => {
          await setTestLocale(locale)
          const { title: songName, description } = copyFor(release.slug)
          const { h, meta } = await head(release.slug, 'links', description, songName)
          const title = unref(h.title) as string
          expect(title).toContain(songName)
          expect(title).toContain('Woman Based Mechanics')
          expect(title.length).toBeLessThanOrEqual(60)
          expect(meta('og:title')).toBe(title)

          const desc = meta('description', 'name')!
          expect(desc.length).toBeGreaterThanOrEqual(120)
          expect(desc.length).toBeLessThanOrEqual(155)
          expect(desc).toContain('WBM')
          expect(meta('og:description')).toBe(desc)
        })
      }
    }

    it('lyrics titles keep the compact "<song> ... | WBM" pattern', async () => {
      const { h } = await head('khvyli', 'lyrics')
      expect(h.title).toBe('Хвилі — слова пісні | WBM')
      await setTestLocale('en')
      expect((await head('khvyli', 'lyrics', undefined, 'Khvyli')).h.title).toBe(
        'Khvyli Lyrics | WBM'
      )
    })

    it('lyrics descriptions are 120-155 chars in both locales', async () => {
      for (const locale of ['ua', 'en'] as const) {
        await setTestLocale(locale)
        for (const slug of ['khvyli', 'alina', 'mania', 'chorni-ptahy']) {
          const { meta } = await head(slug, 'lyrics')
          const len = meta('description', 'name')!.length
          expect(len).toBeGreaterThanOrEqual(120)
          expect(len).toBeLessThanOrEqual(155)
        }
      }
    })
  })
})
