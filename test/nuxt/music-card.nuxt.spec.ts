// @vitest-environment nuxt
import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MusicCard from '~/components/ui/MusicCard.vue'
import type { MusicRelease } from '~/data/musicLibrary'
import { setTestLocale } from './helpers/i18n'

// MusicCard renders a release card: a localized title, a localized (optional)
// description, a Kyiv-zone formatted release date, and click-to-open behaviour.
//
// i18n is LIVE here (default locale 'ua' → locales/uk.json), so $t('releases.*')
// returns the real Ukrainian strings. The component reads the GLOBAL i18n scope
// (useI18n({ useScope: 'global' })), so flipping `locale` on a global composer
// inside a test changes what the mounted card renders. Tests that need a specific
// locale set it in beforeEach and restore 'ua' so the suite stays order-independent.
//
// displayTitle / displayDescription use a "stable fallback": a translated value is
// only used when t(key) !== key AND non-empty; otherwise it falls back, in order,
// to release.title/description and then to release.slug / '' — this keeps SSR/CSR
// hydration consistent when a release key is missing from the locale bundle.

// Minimal MusicRelease factory. musicPlatformLinks is required by the type and the
// template (UiStreamingButtons reads .spotify/.appleMusic/.youtubeMusic); the rest
// are filled with realistic defaults mirroring data/musicLibrary.ts.
const makeRelease = (overrides: Partial<MusicRelease> = {}): MusicRelease =>
  ({
    id: '1',
    slug: 'mania',
    title: 'Mania',
    titleKey: 'releases.mania.title',
    type: 'single',
    releaseDate: '2025-11-14T12:00:00Z',
    imageUrl: '/images/optimized/albums-images/mania/cover.avif',
    descriptionKey: 'releases.mania.description',
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/album/0pjAORRhgVsS7eP4R6JbMF',
      appleMusic: 'https://music.apple.com/ua/album/1849021879',
      youtubeMusic: 'https://music.youtube.com/playlist?list=OLAK5'
    },
    ...overrides
  }) as MusicRelease

// Set the GLOBAL i18n locale (the scope MusicCard reads) AND make sure that
// locale's lazy-loaded bundle is in memory first — see test/nuxt/helpers/i18n.ts.
// Callers mount AFTER awaiting this so the computed title/date observe it.
const setLocale = (loc: 'ua' | 'en') => setTestLocale(loc)

describe('MusicCard.vue', () => {
  beforeEach(async () => {
    // Default locale for the suite; individual tests override and the next
    // beforeEach resets, so tests don't leak locale into each other.
    await setLocale('ua')
  })

  describe('displayTitle', () => {
    it('renders the localized title from titleKey (Ukrainian default locale)', async () => {
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease() }
      })
      const h3 = w.get('h3')
      // locales/uk.json → releases.mania.title === 'Манія'
      expect(h3.text()).toBe('Манія')
    })

    it('renders the localized title in English when the global locale is en', async () => {
      await setLocale('en')
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease() }
      })
      // locales/en.json → releases.mania.title === 'Mania'
      expect(w.get('h3').text()).toBe('Mania')
    })

    it('falls back to release.title when the i18n key is missing', async () => {
      const w = await mountSuspended(MusicCard, {
        props: {
          release: makeRelease({
            slug: 'no-such-release',
            titleKey: 'releases.no_such_release.title',
            title: 'My Literal Title'
          })
        }
      })
      // The key is absent from both bundles → t(key) returns the key itself →
      // stableReleaseText rejects it and uses release.title.
      expect(w.get('h3').text()).toBe('My Literal Title')
    })

    it('falls back to the slug when both the i18n key and release.title are blank', async () => {
      const w = await mountSuspended(MusicCard, {
        props: {
          release: makeRelease({
            slug: 'mystery-slug',
            titleKey: 'releases.mystery_slug.title',
            title: ''
          })
        }
      })
      // Missing key + empty title → final fallback is the slug.
      expect(w.get('h3').text()).toBe('mystery-slug')
    })

    it('derives the title key from the slug when titleKey is omitted', async () => {
      // No titleKey → key becomes `releases.${slug}.title`. With slug 'mania'
      // that resolves to the real translation.
      const release = makeRelease()
      delete (release as Partial<MusicRelease>).titleKey
      const w = await mountSuspended(MusicCard, {
        props: { release }
      })
      expect(w.get('h3').text()).toBe('Манія')
    })
  })

  describe('displayDescription', () => {
    it('renders the localized description from descriptionKey', async () => {
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease() }
      })
      const paras = w.findAll('p')
      // Two <p>: the date, then the description (rendered because non-empty).
      expect(paras).toHaveLength(2)
      const expected =
        'Це пісня про тонку межу між любов’ю та обсесією, між справжніми почуттями й руйнівним прагненням володіти вигаданим образом.'
      expect(paras[1].text()).toBe(expected)
    })

    it('hides the description paragraph when no description resolves', async () => {
      const w = await mountSuspended(MusicCard, {
        props: {
          release: makeRelease({
            slug: 'descless',
            descriptionKey: 'releases.descless.description',
            description: ''
          })
        }
      })
      // Missing key + empty description → '' → v-if removes the <p>; only the
      // date paragraph remains.
      const paras = w.findAll('p')
      expect(paras).toHaveLength(1)
    })

    it('falls back to release.description when the i18n key is missing', async () => {
      const w = await mountSuspended(MusicCard, {
        props: {
          release: makeRelease({
            slug: 'descless',
            descriptionKey: 'releases.descless.description',
            description: 'Literal description text'
          })
        }
      })
      const paras = w.findAll('p')
      expect(paras).toHaveLength(2)
      expect(paras[1].text()).toBe('Literal description text')
    })
  })

  describe('formattedDate', () => {
    it('formats the release date in Ukrainian with month + year', async () => {
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease({ releaseDate: '2025-11-14T12:00:00Z' }) }
      })
      // uk-UA, Europe/Kyiv → 'листопад 2025 р.' then first char upper-cased.
      const dateText = w.findAll('p')[0].text()
      expect(dateText).toBe('Листопад 2025 р.')
    })

    it('formats the release date in English when locale is en', async () => {
      await setLocale('en')
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease({ releaseDate: '2025-11-14T12:00:00Z' }) }
      })
      expect(w.findAll('p')[0].text()).toBe('November 2025')
    })

    it('capitalizes the first character of the formatted date', async () => {
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease({ releaseDate: '2026-06-11T21:00:00Z' }) }
      })
      const dateText = w.findAll('p')[0].text()
      // Raw uk-UA output starts lowercase ('червень'); component upper-cases it.
      expect(dateText.charAt(0)).toBe(dateText.charAt(0).toUpperCase())
      expect(dateText).toBe('Червень 2026 р.')
    })

    it('applies the Europe/Kyiv timezone (UTC instant that is the NEXT day in Kyiv)', async () => {
      await setLocale('en')
      // 2025-12-31T23:30:00Z is still December in UTC, but 01:30 on 2026-01-01 in
      // Kyiv (UTC+2). The component must render 'January 2026' — proving the
      // timeZone option is actually honoured rather than defaulting to UTC/local.
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease({ releaseDate: '2025-12-31T23:30:00Z' }) }
      })
      expect(w.findAll('p')[0].text()).toBe('January 2026')
    })
  })

  describe('handleClick', () => {
    it('emits a single "click" event when the card is clicked', async () => {
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease() }
      })
      await w.get('.music-card').trigger('click')
      expect(w.emitted('click')).toHaveLength(1)
    })

    it('emits the full release object as the click payload', async () => {
      const release = makeRelease({ id: '42', slug: 'payload-test' })
      const w = await mountSuspended(MusicCard, {
        props: { release }
      })
      await w.get('.music-card').trigger('click')
      const events = w.emitted('click')
      expect(events).toBeTruthy()
      // Payload is the exact release prop reference.
      expect(events![0][0]).toBe(release)
    })
  })

  describe('structure', () => {
    it('renders the album cover container as a child', async () => {
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease() }
      })
      // UiAlbumCover mounts and renders its square cover frame. (The cover image's
      // alt is set to displayTitle, but UiProgressiveImage defers the actual <img>
      // in this test env, so we assert the container rather than the alt.)
      expect(w.find('.aspect-square').exists()).toBe(true)
    })

    it('renders streaming buttons for the provided platform links', async () => {
      const w = await mountSuspended(MusicCard, {
        props: { release: makeRelease() }
      })
      // Spotify / Apple Music / YouTube icons are present as <img> alts.
      expect(w.find('img[alt="Spotify"]').exists()).toBe(true)
      expect(w.find('img[alt="Apple Music"]').exists()).toBe(true)
      expect(w.find('img[alt="YouTube"]').exists()).toBe(true)
    })

    it('omits a streaming button when its platform link is absent', async () => {
      const w = await mountSuspended(MusicCard, {
        props: {
          release: makeRelease({
            musicPlatformLinks: { spotify: 'https://open.spotify.com/album/x' }
          })
        }
      })
      expect(w.find('img[alt="Spotify"]').exists()).toBe(true)
      expect(w.find('img[alt="Apple Music"]').exists()).toBe(false)
      expect(w.find('img[alt="YouTube"]').exists()).toBe(false)
    })
  })
})
