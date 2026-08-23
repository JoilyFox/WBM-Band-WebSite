// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { useMasterPage, type UseMasterPageOptions } from '~/composables/useMasterPage'
import { getReleaseBySlug } from '~/data/musicLibrary'
import { SITE_URL } from '~/constants/app'
import { setTestLocale } from './helpers/i18n'

// useMasterPage is the shared setup for the listen + pre-save "master" release
// pages. It looks the release up in data/musicLibrary, builds localized
// title/description via the GLOBAL vue-i18n scope, normalizes the OG image URL,
// builds the canonical page URL rooted at SITE_URL, and — when a source prefix
// is present — locks in source attribution. It needs setup() context (useI18n,
// onMounted, createError), so every test drives it through a tiny harness
// component. The bare nuxt runtime resolves i18n to ENGLISH by default; tests
// that need Ukrainian flip the shared locale and reset it in beforeEach so the
// file stays order-independent (other suites depend on the default 'en').

const SOURCE_KEY = 'wbm_source_platform'

// Harness: calls the composable in setup() and exposes the live return object.
const Harness = defineComponent({
  props: { options: { type: Object, required: true } },
  setup(props) {
    const master = useMasterPage(props.options as UseMasterPageOptions)
    return { master }
  },
  template: '<div />'
})

// Mount the harness and hand back the resolved (already-unwrapped) values plus
// the raw return object for the few fields that aren't refs.
async function run(options: UseMasterPageOptions) {
  const w = await mountSuspended(Harness, { props: { options } })
  const master = (w.vm as { master: ReturnType<typeof useMasterPage> }).master
  return {
    release: master.release,
    title: master.localizedTitle.value,
    description: master.localizedDescription.value,
    metaImageUrl: master.metaImageUrl.value,
    pageUrl: master.pageUrl.value,
    canonicalUrl: master.canonicalUrl.value,
    resolvedSource: master.resolvedSource
  }
}

// Capture whatever setup() throws (e.g. the 404 createError) without letting
// mountSuspended's rejection bubble out of the test.
async function runExpectThrow(options: UseMasterPageOptions) {
  try {
    await mountSuspended(Harness, { props: { options } })
  } catch (e) {
    return e as { statusCode?: number; statusMessage?: string; data?: { slug?: string } }
  }
  return null
}

// Sets the locale AND loads its lazy bundle — see test/nuxt/helpers/i18n.ts.
function setLocale(locale: 'en' | 'ua') {
  return setTestLocale(locale)
}

beforeEach(async () => {
  // This file asserts the ENGLISH strings, so it states that explicitly rather
  // than inheriting a runtime default. Also clears the attribution store.
  await setLocale('en')
  window.sessionStorage.clear()
})

describe('useMasterPage', () => {
  describe('release lookup + 404 handling', () => {
    it('returns the matching release object for a known slug', async () => {
      const { release } = await run({ slug: 'mania', pageType: 'listen' })
      expect(release).toBe(getReleaseBySlug('mania'))
      expect(release.slug).toBe('mania')
    })

    it('throws a 404 createError with the slug in statusMessage + data for an unknown listen slug', async () => {
      const err = await runExpectThrow({ slug: 'no-such-slug', pageType: 'listen' })
      expect(err).toBeTruthy()
      expect(err?.statusCode).toBe(404)
      expect(err?.statusMessage).toBe('Music track "no-such-slug" not found')
      expect(err?.data).toEqual({ slug: 'no-such-slug' })
    })

    it('uses the "Pre-save track" wording in the 404 message when pageType is pre-save', async () => {
      const err = await runExpectThrow({ slug: 'ghost', pageType: 'pre-save' })
      expect(err?.statusCode).toBe(404)
      expect(err?.statusMessage).toBe('Pre-save track "ghost" not found')
      expect(err?.data).toEqual({ slug: 'ghost' })
    })
  })

  describe('localized title (global i18n scope)', () => {
    it('resolves the English title from the release i18n key by default', async () => {
      const { title } = await run({ slug: 'mania', pageType: 'listen' })
      expect(title).toBe('Mania')
    })

    it("resolves the Ukrainian title when the global locale is flipped to 'ua'", async () => {
      await setLocale('ua')
      const { title } = await run({ slug: 'mania', pageType: 'listen' })
      expect(title).toBe('Манія')
    })

    it('localizes a different release independently (chorni-ptahy)', async () => {
      const en = await run({ slug: 'chorni-ptahy', pageType: 'pre-save' })
      expect(en.title).toBe('Chorni Ptahy')
      await setLocale('ua')
      const ua = await run({ slug: 'chorni-ptahy', pageType: 'pre-save' })
      expect(ua.title).toBe('Чорні Птахи')
    })
  })

  describe('localized description', () => {
    it('resolves the English description from the release key for a listen page', async () => {
      const release = getReleaseBySlug('mania')
      const { description } = await run({ slug: 'mania', pageType: 'listen' })
      // en.json description differs from the data/musicLibrary fallback, proving
      // the i18n translation (not the release.description) is what surfaces.
      expect(description).toContain('thin line between love and obsession')
      expect(description).not.toBe(release?.description)
    })

    it('resolves the Ukrainian description when locale is ua', async () => {
      await setLocale('ua')
      const { description } = await run({ slug: 'mania', pageType: 'listen' })
      expect(description).toContain('тонку межу між любов')
    })

    it('localizes the pre-save description from the release key', async () => {
      const { description } = await run({ slug: 'alina', pageType: 'pre-save' })
      expect(description).toContain(
        'satirical song about the dangers of teenage online acquaintances'
      )
    })
  })

  describe('OG meta image URL normalization', () => {
    it('rewrites the .avif cover to .jpg and prefixes the canonical SITE_URL', async () => {
      const { metaImageUrl } = await run({ slug: 'mania', pageType: 'listen' })
      expect(metaImageUrl).toBe(`${SITE_URL}/images/optimized/albums-images/mania/cover.jpg`)
    })

    it('emits an absolute https URL rooted at the www canonical origin (not DEPLOY_TARGET-aware)', async () => {
      const { metaImageUrl } = await run({ slug: 'chorni-ptahy', pageType: 'pre-save' })
      // Pins the documented audit risk #6: SITE_URL is the www form, hardcoded.
      expect(metaImageUrl.startsWith('https://www.wbmband.com/')).toBe(true)
      expect(metaImageUrl.endsWith('.jpg')).toBe(true)
      expect(metaImageUrl).not.toContain('.avif')
    })

    it('mirrors the release.imageUrl path (only the extension changes)', async () => {
      const release = getReleaseBySlug('alina')
      const { metaImageUrl } = await run({ slug: 'alina', pageType: 'pre-save' })
      const expectedPath = release!.imageUrl.replace('.avif', '.jpg')
      expect(metaImageUrl).toBe(`${SITE_URL}${expectedPath}`)
    })
  })

  describe('canonical page URL building', () => {
    it('builds an en listen URL: SITE_URL/en/listen/<slug>', async () => {
      const { pageUrl } = await run({ slug: 'mania', pageType: 'listen' })
      expect(pageUrl).toBe(`${SITE_URL}/en/listen/mania`)
    })

    it('builds an UNPREFIXED url when the locale is ua (ua is the default locale)', async () => {
      // Regression: this used to emit `/ua/listen/<slug>`, the RETIRED prefix.
      // It shipped as the og:url of every Ukrainian share link, so social
      // scrapers consolidated shares onto a URL that now 301s away.
      await setLocale('ua')
      const { pageUrl } = await run({ slug: 'mania', pageType: 'listen' })
      expect(pageUrl).toBe(`${SITE_URL}/listen/mania`)
      expect(pageUrl).not.toContain('/ua/')
    })

    it('canonicalUrl drops the source prefix but KEEPS the locale', async () => {
      // A prefixed English variant must consolidate onto the English clean URL,
      // never across locales onto the Ukrainian one.
      const { canonicalUrl } = await run({
        slug: 'mania',
        pageType: 'listen',
        sourcePrefix: 'i'
      })
      expect(canonicalUrl).toBe(`${SITE_URL}/en/listen/mania`)

      await setLocale('ua')
      const ua = await run({ slug: 'mania', pageType: 'listen', sourcePrefix: 'i' })
      expect(ua.canonicalUrl).toBe(`${SITE_URL}/listen/mania`)
    })

    it('uses the pre-save page-type segment for pre-save pages', async () => {
      const { pageUrl } = await run({ slug: 'alina', pageType: 'pre-save' })
      expect(pageUrl).toBe(`${SITE_URL}/en/pre-save/alina`)
    })

    it('inserts the source-prefix segment between page-type and slug when provided', async () => {
      const { pageUrl } = await run({
        slug: 'chorni-ptahy',
        pageType: 'pre-save',
        sourcePrefix: 'i'
      })
      expect(pageUrl).toBe(`${SITE_URL}/en/pre-save/i/chorni-ptahy`)
    })

    it('omits the prefix segment entirely when no sourcePrefix is given', async () => {
      const { pageUrl } = await run({ slug: 'mania', pageType: 'listen' })
      expect(pageUrl).not.toContain('/listen//')
      expect(pageUrl.split('/').filter(Boolean)).toEqual([
        'https:',
        'www.wbmband.com',
        'en',
        'listen',
        'mania'
      ])
    })
  })

  describe('source-prefix attribution', () => {
    it('resolves a known prefix to its canonical platform (i → instagram)', async () => {
      const { resolvedSource } = await run({
        slug: 'mania',
        pageType: 'listen',
        sourcePrefix: 'i'
      })
      expect(resolvedSource).toBe('instagram')
    })

    it('resolves another known prefix (tt → tiktok) and persists it to sessionStorage', async () => {
      const { resolvedSource } = await run({
        slug: 'mania',
        pageType: 'listen',
        sourcePrefix: 'tt'
      })
      expect(resolvedSource).toBe('tiktok')
      // setExplicitSourcePlatform locks first-touch attribution synchronously.
      expect(window.sessionStorage.getItem(SOURCE_KEY)).toBe('tiktok')
    })

    it('resolves the email prefix (em → email)', async () => {
      const { resolvedSource } = await run({
        slug: 'alina',
        pageType: 'pre-save',
        sourcePrefix: 'em'
      })
      expect(resolvedSource).toBe('email')
      expect(window.sessionStorage.getItem(SOURCE_KEY)).toBe('email')
    })

    it('returns null and writes no attribution when no sourcePrefix is supplied', async () => {
      const { resolvedSource } = await run({ slug: 'mania', pageType: 'listen' })
      expect(resolvedSource).toBeNull()
      expect(window.sessionStorage.getItem(SOURCE_KEY)).toBeNull()
    })

    it('ignores an unrecognized prefix (resolvedSource null, nothing persisted)', async () => {
      const { resolvedSource } = await run({
        slug: 'mania',
        pageType: 'listen',
        sourcePrefix: 'not-a-real-prefix'
      })
      expect(resolvedSource).toBeNull()
      expect(window.sessionStorage.getItem(SOURCE_KEY)).toBeNull()
    })
  })

  describe('return shape', () => {
    it('exposes the full documented return object', async () => {
      const w = await mountSuspended(Harness, {
        props: { options: { slug: 'mania', pageType: 'listen' } }
      })
      const master = (w.vm as { master: ReturnType<typeof useMasterPage> }).master
      expect(Object.keys(master).sort()).toEqual(
        [
          'release',
          'localizedTitle',
          'localizedDescription',
          'metaImageUrl',
          'pageUrl',
          'canonicalUrl',
          'resolvedSource'
        ].sort()
      )
    })
  })
})
