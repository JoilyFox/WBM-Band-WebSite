// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { computed, defineComponent, ref, unref, type Ref } from 'vue'
import { useReleaseHead, type ReleaseView } from '~/composables/useReleaseHead'
import { SITE_URL } from '~/constants/app'
import { setTestLocale } from './helpers/i18n'

// T-01: canonical / hreflang / og / noindex of the release + lyrics pages.
// useHead is mocked to capture the reactive head input and evaluate it.

const { heads } = vi.hoisted(() => ({ heads: [] as unknown[] }))
mockNuxtImport('useHead', () => (input: unknown) => {
  heads.push(input)
})

const Harness = defineComponent({
  props: { slug: { type: String, required: true }, view: { type: Object, required: true } },
  setup(props) {
    useReleaseHead({
      slug: props.slug,
      localizedTitle: computed(() => 'Хвилі'),
      localizedDescription: computed(() => 'Опис'),
      metaImageUrl: computed(() => `${SITE_URL}/images/cover.jpg`),
      view: props.view as Ref<ReleaseView>
    })
    return () => null
  }
})

async function head(slug: string, view: ReleaseView = 'links') {
  heads.length = 0
  const viewRef = ref<ReleaseView>(view)
  await mountSuspended(Harness, { props: { slug, view: viewRef } })
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
})
