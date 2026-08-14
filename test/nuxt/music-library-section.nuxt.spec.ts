// @vitest-environment nuxt
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MusicLibrarySection from '~/components/sections/MusicLibrarySection.vue'
import type { MusicRelease } from '~/data/musicLibrary'
import { setTestLocale } from './helpers/i18n'

// MusicLibrarySection renders the "Our Music" grid. Its interesting logic lives in
// a cluster of gating computeds, all of which read two EXPLICIT imports:
//   • ~/data/musicLibrary  → musicLibrary (raw array), getLatestReleases, getAllReleases
//   • ~/utils/configHelpers → getConfig (feature flags), isUpcomingRelease (clock)
// plus ~/utils/countdown → getLocalizedCountdown (days-remaining label).
//
// Because those are real ES-module imports (not Nuxt auto-imports), we mock the
// modules with vi.mock + vi.hoisted and drive a mutable feature-flag / release-date
// matrix per test. This makes the component fully deterministic and independent of
// the real clock — exactly the matrix the gating computeds branch on:
//   - shouldShowPreSaveCard  (enablePreSave && upcoming has presave links/distributor URL)
//   - shouldShowNewReleasePreview (preview flag, suppressed by pre-save)
//   - shouldShowComingSoon   (coming-soon flag, suppressed by either upcoming card)
//   - upcomingRelease        (nearest upcoming, TBA-last reduce)
//   - displayedReleases      (drops upcoming + dedupes the previewed/pre-saved one)
//   - hasMoreReleases        (show-all gate)
//
// i18n is LIVE here and resolves to ENGLISH by default (see album-cover spec note),
// so we assert the en.json strings the component actually produces.

// ---- mutable mock state (hoisted so the vi.mock factories can close over it) ----
const state = vi.hoisted(() => {
  return {
    // feature-flag config the mocked getConfig serves
    config: {
      'general.bandName': 'WBM Band',
      'general.enableComingSoonCard': false,
      'general.maxReleasesBeforeHideComingSoon': 6,
      'general.enablePreSave': true,
      'general.enableNextReleasePreview': true
    } as Record<string, unknown>,
    // the raw library array the component filters/reduces over
    library: [] as MusicRelease[],
    // explicit "now" used by the mocked isUpcomingRelease (ISO string)
    now: '2026-06-02T00:00:00Z'
  }
})

vi.mock('~/utils/configHelpers', () => ({
  getConfig: (path: string) => state.config[path],
  // Real future/past comparison against the test's frozen `now`. Undefined date
  // means TBA → treated as upcoming, mirroring the production implementation.
  isUpcomingRelease: (dateString?: string) => {
    if (!dateString) return true
    return new Date(dateString).getTime() > new Date(state.now).getTime()
  }
}))

vi.mock('~/data/musicLibrary', () => {
  const time = (d?: string) => (d ? new Date(d).getTime() : 8640000000000000)
  // Export the SAME stable `state.library` array the test mutates in place. The
  // component calls `musicLibrary.filter(...)` / `.reduce(...)` directly, so it must
  // be a real array (a Proxy-of-array breaks the iteration internals of map/filter).
  return {
    musicLibrary: state.library,
    getAllReleases: () =>
      [...state.library].sort((a, b) => time(b.releaseDate) - time(a.releaseDate)),
    getLatestReleases: (limit = 4) =>
      [...state.library].sort((a, b) => time(b.releaseDate) - time(a.releaseDate)).slice(0, limit)
  }
})

// Deterministic countdown label so daysRemainingText doesn't depend on the wall
// clock. Returns '' for releases with no date (matches the real guard) and a
// fixed token otherwise — enough to assert presence/absence of the "(…)" line.
vi.mock('~/utils/countdown', () => ({
  getLocalizedCountdown: ({ releaseDate }: { releaseDate?: string }) =>
    releaseDate ? 'in 9 days' : ''
}))

// ---- release factory ----
let nextId = 0
const makeRelease = (overrides: Partial<MusicRelease> = {}): MusicRelease =>
  ({
    id: `r${++nextId}`,
    slug: `slug-${nextId}`,
    title: `Title ${nextId}`,
    type: 'single',
    releaseDate: '2025-01-01T00:00:00Z',
    imageUrl: `/images/optimized/${nextId}/cover.avif`,
    musicPlatformLinks: {},
    ...overrides
  }) as MusicRelease

// Light stubs for the child cards so the mount stays focused on this component's
// logic. We keep the names the template uses (<UiMusicCard>, <UiAlbumCover>, etc.)
// resolvable, and expose just enough surface for assertions.
const stubs = {
  // Renders the release slug so we can read displayedReleases order/content cheaply.
  MusicCard: {
    name: 'MusicCard',
    props: ['release'],
    emits: ['click'],
    template: '<div class="stub-music-card" :data-slug="release.slug">{{ release.slug }}</div>'
  },
  AlbumCover: {
    name: 'AlbumCover',
    props: ['imageUrl', 'alt', 'releaseType', 'showBadge'],
    template: '<div class="stub-album-cover" :data-img="imageUrl" :data-alt="alt" />'
  },
  AppBadge: {
    name: 'AppBadge',
    template: '<span class="stub-badge"><slot /></span>'
  },
  CommonSectionTitle: { name: 'CommonSectionTitle', template: '<h2><slot /></h2>' },
  CommonSectionSubtitle: { name: 'CommonSectionSubtitle', template: '<p><slot /></p>' }
}

const mount = () => mountSuspended(MusicLibrarySection, { global: { stubs } })

// Convenience setters for the feature flags.
const setFlag = (key: string, value: unknown) => {
  state.config[key] = value
}

// Replace the library CONTENTS in place — never reassign `state.library`, because
// the mocked module exported that exact array reference and the component holds it.
const setLibrary = (releases: MusicRelease[]) => {
  state.library.length = 0
  state.library.push(...releases)
}

// This file asserts the ENGLISH copy, so it states the locale explicitly and
// loads that bundle ONCE, before any test installs fake timers. It used to
// inherit English by accident via browser-language detection — the same
// mechanism that made Googlebot render the English home at `/`, now switched
// off (docs/search-console.md). The app's real default locale is 'ua'.
beforeAll(async () => {
  await setTestLocale('en')
})

describe('MusicLibrarySection.vue', () => {
  beforeEach(() => {
    nextId = 0
    state.now = '2026-06-02T00:00:00Z'
    setLibrary([])
    // Reset flags to the production defaults each test (order-independence).
    state.config = {
      'general.bandName': 'WBM Band',
      'general.enableComingSoonCard': false,
      'general.maxReleasesBeforeHideComingSoon': 6,
      'general.enablePreSave': true,
      'general.enableNextReleasePreview': true
    }
  })

  const slugsInGrid = (w: Awaited<ReturnType<typeof mount>>) =>
    w.findAll('.stub-music-card').map((n) => n.attributes('data-slug'))

  // ---------------------------------------------------------------------------
  describe('displayedReleases — upcoming filtering + dedupe', () => {
    it('renders all released cards when there is no upcoming release', async () => {
      setLibrary([
        makeRelease({ slug: 'past-a', releaseDate: '2025-03-01T00:00:00Z' }),
        makeRelease({ slug: 'past-b', releaseDate: '2024-01-01T00:00:00Z' })
      ])
      const w = await mount()
      expect(slugsInGrid(w)).toEqual(['past-a', 'past-b'])
    })

    it('filters out an upcoming release from the released grid', async () => {
      // The upcoming one is also surfaced as the pre-save/preview card, but it must
      // never appear in the released grid below it.
      setLibrary([
        makeRelease({ slug: 'future', releaseDate: '2026-12-01T00:00:00Z' }),
        makeRelease({ slug: 'past', releaseDate: '2025-01-01T00:00:00Z' })
      ])
      const w = await mount()
      expect(slugsInGrid(w)).toEqual(['past'])
      expect(slugsInGrid(w)).not.toContain('future')
    })

    it('dedupes the previewed upcoming release out of the grid (no double render)', async () => {
      // Pre-save off, preview on → the upcoming release shows in the preview card,
      // and the dedupe branch (matching upcomingRelease.id) removes it from the grid.
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      const upcoming = makeRelease({
        id: 'UP',
        slug: 'upcoming-one',
        releaseDate: '2026-09-01T00:00:00Z'
      })
      setLibrary([upcoming, makeRelease({ slug: 'old', releaseDate: '2024-01-01T00:00:00Z' })])
      const w = await mount()
      // Preview card is present, grid contains only the released one.
      expect(w.find('.new-release-preview').exists()).toBe(true)
      expect(slugsInGrid(w)).toEqual(['old'])
    })

    it('orders the grid newest-first (released cards sorted by getLatestReleases)', async () => {
      setLibrary([
        makeRelease({ slug: 'oldest', releaseDate: '2023-01-01T00:00:00Z' }),
        makeRelease({ slug: 'newest', releaseDate: '2025-12-31T00:00:00Z' }),
        makeRelease({ slug: 'middle', releaseDate: '2024-06-01T00:00:00Z' })
      ])
      const w = await mount()
      expect(slugsInGrid(w)).toEqual(['newest', 'middle', 'oldest'])
    })

    it('respects maxItems (default 8) via getLatestReleases', async () => {
      // 10 released items → only the newest 8 render (no upcoming card active).
      setLibrary(
        Array.from({ length: 10 }, (_v, i) =>
          makeRelease({
            slug: `rel-${i}`,
            // Increasing dates so newest-first ordering is well defined.
            releaseDate: `2020-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`
          })
        )
      )
      const w = await mount()
      expect(slugsInGrid(w)).toHaveLength(8)
    })
  })

  // ---------------------------------------------------------------------------
  describe('upcomingRelease — nearest-future reduce', () => {
    it('picks the nearest-dated upcoming release for the card title', async () => {
      setFlag('general.enablePreSave', false) // preview card (uses upcoming title)
      setLibrary([
        makeRelease({ slug: 'far', title: 'Far Away', releaseDate: '2027-01-01T00:00:00Z' }),
        makeRelease({ slug: 'near', title: 'Coming Soon One', releaseDate: '2026-07-01T00:00:00Z' })
      ])
      const w = await mount()
      // upcomingReleaseTitle falls back to release.title (no titleKey, key missing).
      expect(w.find('.new-release-title').text()).toBe('Coming Soon One')
    })

    it('picks the DATED upcoming release over a date-less (TBA) one', async () => {
      // A date-less (TBA) release is treated as "further in the future", so the
      // dated release wins as the nearest upcoming one. (Fixed reduce guards —
      // previously the TBA release was wrongly selected whenever one existed.)
      setFlag('general.enablePreSave', false)
      setLibrary([
        makeRelease({ slug: 'tba', title: 'TBA Drop', releaseDate: undefined }),
        makeRelease({ slug: 'dated', title: 'Dated Drop', releaseDate: '2026-08-01T00:00:00Z' })
      ])
      const w = await mount()
      expect(w.find('.new-release-title').text()).toBe('Dated Drop')
      // The dated winner renders its days-remaining line (not the TBA caption).
      expect(w.find('.new-release-days').exists()).toBe(true)
    })

    it('picks the nearer of two DATED upcoming releases (no TBA present)', async () => {
      // When every upcoming release has a date, the numeric comparison runs and the
      // nearest-future one wins — the path the reduce was actually designed for.
      setFlag('general.enablePreSave', false)
      setLibrary([
        makeRelease({ slug: 'far', title: 'Far Drop', releaseDate: '2027-03-01T00:00:00Z' }),
        makeRelease({ slug: 'near', title: 'Near Drop', releaseDate: '2026-07-15T00:00:00Z' })
      ])
      const w = await mount()
      expect(w.find('.new-release-title').text()).toBe('Near Drop')
    })

    it('shows neither upcoming card when nothing is upcoming', async () => {
      setLibrary([makeRelease({ slug: 'past', releaseDate: '2025-01-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.new-release-preview').exists()).toBe(false)
      expect(w.find('.presave-card').exists()).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  describe('shouldShowPreSaveCard', () => {
    it('shows the pre-save card when enablePreSave + upcoming has preSave links', async () => {
      setFlag('general.enablePreSave', true)
      setLibrary([
        makeRelease({
          slug: 'presave-me',
          releaseDate: '2026-10-01T00:00:00Z',
          preSaveMusicPlatformLinks: { spotify: 'https://open.spotify.com/x' }
        })
      ])
      const w = await mount()
      expect(w.find('.presave-card').exists()).toBe(true)
      expect(w.find('.new-release-preview').exists()).toBe(false)
    })

    it('shows the pre-save card when the upcoming release only has a distributor URL', async () => {
      setFlag('general.enablePreSave', true)
      setLibrary([
        makeRelease({
          slug: 'distro',
          releaseDate: '2026-10-01T00:00:00Z',
          distributorPreSaveUrl: 'https://id.ffm.to/distro'
        })
      ])
      const w = await mount()
      expect(w.find('.presave-card').exists()).toBe(true)
    })

    it('does NOT show pre-save when enablePreSave is off (falls back to preview)', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([
        makeRelease({
          slug: 'has-links',
          releaseDate: '2026-10-01T00:00:00Z',
          preSaveMusicPlatformLinks: { spotify: 'https://open.spotify.com/x' }
        })
      ])
      const w = await mount()
      expect(w.find('.presave-card').exists()).toBe(false)
      expect(w.find('.new-release-preview').exists()).toBe(true)
    })

    it('does NOT show pre-save when the upcoming release has no presave links and no distributor URL', async () => {
      setFlag('general.enablePreSave', true)
      setFlag('general.enableNextReleasePreview', false)
      setLibrary([makeRelease({ slug: 'bare', releaseDate: '2026-10-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.presave-card').exists()).toBe(false)
      // Preview also off → no upcoming card at all.
      expect(w.find('.new-release-preview').exists()).toBe(false)
    })

    it('treats an empty preSaveMusicPlatformLinks object as "no links"', async () => {
      setFlag('general.enablePreSave', true)
      setFlag('general.enableNextReleasePreview', false)
      setLibrary([
        makeRelease({
          slug: 'empty-links',
          releaseDate: '2026-10-01T00:00:00Z',
          preSaveMusicPlatformLinks: {}
        })
      ])
      const w = await mount()
      expect(w.find('.presave-card').exists()).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  describe('shouldShowNewReleasePreview', () => {
    it('shows the preview card when preview is on, pre-save off, and a release is upcoming', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([makeRelease({ slug: 'soon', releaseDate: '2026-10-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.new-release-preview').exists()).toBe(true)
    })

    it('pre-save takes precedence over preview (both flags on)', async () => {
      setFlag('general.enablePreSave', true)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([
        makeRelease({
          slug: 'both',
          releaseDate: '2026-10-01T00:00:00Z',
          preSaveMusicPlatformLinks: { spotify: 'https://open.spotify.com/x' }
        })
      ])
      const w = await mount()
      expect(w.find('.presave-card').exists()).toBe(true)
      expect(w.find('.new-release-preview').exists()).toBe(false)
    })

    it('does NOT show the preview when the preview flag is off', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', false)
      setLibrary([makeRelease({ slug: 'soon', releaseDate: '2026-10-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.new-release-preview').exists()).toBe(false)
    })

    it('does NOT show the preview when there is no upcoming release', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([makeRelease({ slug: 'past', releaseDate: '2025-01-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.new-release-preview').exists()).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  describe('shouldShowComingSoon', () => {
    it('is hidden by default (enableComingSoonCard is false)', async () => {
      setFlag('general.enableComingSoonCard', false)
      setLibrary([makeRelease({ slug: 'past', releaseDate: '2025-01-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.coming-soon-card').exists()).toBe(false)
    })

    it('shows when enabled and total releases are below the threshold', async () => {
      setFlag('general.enableComingSoonCard', true)
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', false)
      setFlag('general.maxReleasesBeforeHideComingSoon', 6)
      setLibrary([makeRelease({ slug: 'past', releaseDate: '2025-01-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.coming-soon-card').exists()).toBe(true)
    })

    it('hides once total releases reach the threshold', async () => {
      setFlag('general.enableComingSoonCard', true)
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', false)
      setFlag('general.maxReleasesBeforeHideComingSoon', 2)
      setLibrary([
        makeRelease({ slug: 'a', releaseDate: '2025-01-01T00:00:00Z' }),
        makeRelease({ slug: 'b', releaseDate: '2024-01-01T00:00:00Z' })
      ])
      const w = await mount()
      // total (2) is NOT < threshold (2) → hidden.
      expect(w.find('.coming-soon-card').exists()).toBe(false)
    })

    it('is suppressed when a pre-save card is active', async () => {
      setFlag('general.enableComingSoonCard', true)
      setFlag('general.enablePreSave', true)
      setFlag('general.maxReleasesBeforeHideComingSoon', 10)
      setLibrary([
        makeRelease({
          slug: 'presave',
          releaseDate: '2026-10-01T00:00:00Z',
          distributorPreSaveUrl: 'https://id.ffm.to/x'
        })
      ])
      const w = await mount()
      expect(w.find('.presave-card').exists()).toBe(true)
      expect(w.find('.coming-soon-card').exists()).toBe(false)
    })

    it('is suppressed when a preview card is active', async () => {
      setFlag('general.enableComingSoonCard', true)
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setFlag('general.maxReleasesBeforeHideComingSoon', 10)
      setLibrary([makeRelease({ slug: 'soon', releaseDate: '2026-10-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.new-release-preview').exists()).toBe(true)
      expect(w.find('.coming-soon-card').exists()).toBe(false)
    })

    it('renders the empty-library coming-soon copy (text_none) when total is 0', async () => {
      setFlag('general.enableComingSoonCard', true)
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', false)
      setLibrary([])
      const w = await mount()
      // en.json music.coming_soon.text_none
      expect(w.find('.coming-soon-text').text()).toBe('Our debut release is in the works.')
    })

    it('renders the single-release coming-soon copy (text_one) when total is 1', async () => {
      setFlag('general.enableComingSoonCard', true)
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', false)
      setLibrary([makeRelease({ slug: 'only', releaseDate: '2025-01-01T00:00:00Z' })])
      const w = await mount()
      expect(w.find('.coming-soon-text').text()).toBe('More tracks are on the horizon.')
    })

    it('renders the many-releases coming-soon copy (text_many) when total > 1', async () => {
      setFlag('general.enableComingSoonCard', true)
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', false)
      setFlag('general.maxReleasesBeforeHideComingSoon', 10)
      setLibrary([
        makeRelease({ slug: 'a', releaseDate: '2025-01-01T00:00:00Z' }),
        makeRelease({ slug: 'b', releaseDate: '2024-01-01T00:00:00Z' })
      ])
      const w = await mount()
      expect(w.find('.coming-soon-text').text()).toBe('More music coming soon!')
    })
  })

  // ---------------------------------------------------------------------------
  describe('hasMoreReleases — Show All button gate', () => {
    it('shows the button when total releases exceed maxItems and not in show-all mode', async () => {
      setLibrary(
        Array.from({ length: 9 }, (_v, i) =>
          makeRelease({ slug: `r-${i}`, releaseDate: `2020-01-${String(i + 1).padStart(2, '0')}` })
        )
      )
      const w = await mount() // default maxItems 8, showAll false → 9 > 8
      expect(w.find('.show-more-button').exists()).toBe(true)
    })

    it('hides the button when total releases do not exceed maxItems', async () => {
      setLibrary(
        Array.from({ length: 5 }, (_v, i) =>
          makeRelease({ slug: `r-${i}`, releaseDate: `2020-01-0${i + 1}` })
        )
      )
      const w = await mount()
      expect(w.find('.show-more-button').exists()).toBe(false)
    })

    it('hides the button in show-all mode regardless of count', async () => {
      setLibrary(
        Array.from({ length: 9 }, (_v, i) =>
          makeRelease({ slug: `r-${i}`, releaseDate: `2020-01-0${(i % 9) + 1}` })
        )
      )
      const w = await mountSuspended(MusicLibrarySection, {
        props: { showAll: true },
        global: { stubs }
      })
      expect(w.find('.show-more-button').exists()).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  describe('card badges + headings + image source', () => {
    it('renders the section title and band-name subtitle from i18n', async () => {
      setLibrary([])
      const w = await mount()
      // en.json music.section_title / music.section_subtitle (band name interpolated)
      expect(w.find('h2').text()).toBe('Our Music')
      expect(w.text()).toContain('Listen to us on all platforms!')
    })

    it('shows the PRE-SAVE badge label on the pre-save card', async () => {
      setFlag('general.enablePreSave', true)
      setLibrary([
        makeRelease({
          slug: 'presave',
          releaseDate: '2026-10-01T00:00:00Z',
          distributorPreSaveUrl: 'https://id.ffm.to/x'
        })
      ])
      const w = await mount()
      // en.json music.presave.card_title_fallback === 'Pre-save' → upper-cased.
      expect(w.find('.presave-card .stub-badge').text()).toBe('PRE-SAVE')
    })

    it('shows the NEW RELEASE badge label on the preview card', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([makeRelease({ slug: 'soon', releaseDate: '2026-10-01T00:00:00Z' })])
      const w = await mount()
      // en.json music.new_release.card_title_fallback === 'New Release' → upper-cased.
      expect(w.find('.new-release-preview .stub-badge').text()).toBe('NEW RELEASE')
    })

    it('uses the regular (unblurred) image for the pre-save card cover', async () => {
      setFlag('general.enablePreSave', true)
      setLibrary([
        makeRelease({
          slug: 'presave',
          imageUrl: '/images/optimized/presave/cover.avif',
          blurredImageUrl: '/images/presave/cover-blurred.jpg',
          releaseDate: '2026-10-01T00:00:00Z',
          distributorPreSaveUrl: 'https://id.ffm.to/x'
        })
      ])
      const w = await mount()
      // Pre-save mode → upcomingReleaseImageUrl returns the optimized imageUrl.
      expect(w.find('.presave-card .stub-album-cover').attributes('data-img')).toBe(
        '/images/optimized/presave/cover.avif'
      )
    })

    it('uses the explicit blurredImageUrl for the preview card cover', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([
        makeRelease({
          slug: 'soon',
          imageUrl: '/images/optimized/soon/cover.avif',
          blurredImageUrl: '/images/soon/cover-blurred.jpg',
          releaseDate: '2026-10-01T00:00:00Z'
        })
      ])
      const w = await mount()
      // Preview mode → blurred variant (explicit blurredImageUrl wins).
      expect(w.find('.new-release-preview .stub-album-cover').attributes('data-img')).toBe(
        '/images/soon/cover-blurred.jpg'
      )
    })

    it('derives a "-blurred" suffix variant when blurredImageUrl is absent (preview)', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([
        makeRelease({
          slug: 'soon',
          imageUrl: '/images/optimized/soon/cover.avif',
          blurredImageUrl: undefined,
          releaseDate: '2026-10-01T00:00:00Z'
        })
      ])
      const w = await mount()
      expect(w.find('.new-release-preview .stub-album-cover').attributes('data-img')).toBe(
        '/images/optimized/soon/cover-blurred.avif'
      )
    })

    it('renders the days-remaining line only when a release date is present', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([makeRelease({ slug: 'soon', releaseDate: '2026-10-01T00:00:00Z' })])
      const w = await mount()
      // Mocked getLocalizedCountdown returns a non-empty token → the (…) line shows.
      expect(w.find('.new-release-days').exists()).toBe(true)
      expect(w.find('.new-release-days').text()).toContain('in 9 days')
    })

    it('omits the days-remaining line for a date-less (TBA) upcoming release', async () => {
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([makeRelease({ slug: 'tba', releaseDate: undefined })])
      const w = await mount()
      expect(w.find('.new-release-days').exists()).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  describe('interactions', () => {
    it('emits releaseClick with the upcoming release when the pre-save card is clicked', async () => {
      setFlag('general.enablePreSave', true)
      setLibrary([
        makeRelease({
          id: 'PS',
          slug: 'presave',
          releaseDate: '2026-10-01T00:00:00Z',
          distributorPreSaveUrl: 'https://id.ffm.to/x'
        })
      ])
      const w = await mount()
      await w.find('.presave-card').trigger('click')
      const events = w.emitted('releaseClick')
      expect(events).toHaveLength(1)
      // Payload is upcomingReleaseData (the upcoming release, augmented with
      // formattedDate) — assert the identifying slug carries through.
      expect((events![0][0] as MusicRelease).slug).toBe('presave')
    })

    it('does NOT emit releaseClick when the (non-clickable) preview card is clicked', async () => {
      // Preview mode emits no releaseClick — it shows a snackbar instead.
      setFlag('general.enablePreSave', false)
      setFlag('general.enableNextReleasePreview', true)
      setLibrary([makeRelease({ slug: 'soon', releaseDate: '2026-10-01T00:00:00Z' })])
      const w = await mount()
      await w.find('.new-release-preview').trigger('click')
      expect(w.emitted('releaseClick')).toBeFalsy()
    })

    it('re-emits releaseClick when a grid MusicCard emits click', async () => {
      setLibrary([makeRelease({ slug: 'released', releaseDate: '2025-01-01T00:00:00Z' })])
      const w = await mount()
      const card = w.findComponent({ name: 'MusicCard' })
      card.vm.$emit('click', { slug: 'released' })
      await w.vm.$nextTick()
      const events = w.emitted('releaseClick')
      expect(events).toHaveLength(1)
      expect((events![0][0] as { slug: string }).slug).toBe('released')
    })

    it('emits showMore when the Show All button is clicked', async () => {
      setLibrary(
        Array.from({ length: 9 }, (_v, i) =>
          makeRelease({ slug: `r-${i}`, releaseDate: `2020-01-0${(i % 9) + 1}` })
        )
      )
      const w = await mount()
      await w.find('.show-more-button').trigger('click')
      expect(w.emitted('showMore')).toHaveLength(1)
    })
  })
})
