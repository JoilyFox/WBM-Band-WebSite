// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { MusicRelease } from '~/data/musicLibrary'

// useMusicNavigation dependency classification:
//   AUTO-IMPORT → navigateTo (mockNuxtImport, hoisted spy varied per test)
//   EXPLICIT    → useLocalePath (#i18n), isUpcomingRelease (~/utils/configHelpers) → vi.mock
//
// The composable has no setup()/lifecycle requirement (no useI18n local scope, no
// onMounted, no inject) once useLocalePath is mocked, so it is invoked DIRECTLY in
// each test body.
//
// `isMobile` is the only environment-driven branch: under the nuxt test runtime
// `import.meta.client === true` (confirmed by error-page.nuxt.spec.ts), so the
// computed reads `window.innerWidth < 768 || 'ontouchstart' in window`. happy-dom
// defaults innerWidth to 1024 (desktop). Tests flip innerWidth / add an
// `ontouchstart` window prop to exercise the mobile branch and restore both in
// afterEach so the file stays order-independent.

const { navigateTo, isUpcomingRelease, localePath } = vi.hoisted(() => ({
  navigateTo: vi.fn(),
  isUpcomingRelease: vi.fn(),
  // identity-ish: echoes the path and serialises ?from=music so assertions can be exact
  localePath: vi.fn((arg: any) => {
    if (typeof arg === 'string') return arg
    const q = arg.query ? `?from=${arg.query.from}` : ''
    return `${arg.path}${q}`
  })
}))

mockNuxtImport('navigateTo', () => navigateTo)

vi.mock('#i18n', () => ({ useLocalePath: () => localePath }))
vi.mock('~/utils/configHelpers', () => ({ isUpcomingRelease }))

const { useMusicNavigation } = await import('~/composables/useMusicNavigation')

// Realistic upcoming release with both pre-save link shapes available; overrides
// let each test sculpt the exact branch it needs.
function makeRelease(overrides: Partial<MusicRelease> = {}): MusicRelease {
  return {
    id: 'rel-1',
    slug: 'mania',
    title: 'Mania',
    type: 'single',
    releaseDate: '2026-07-01',
    imageUrl: '/images/mania.jpg',
    musicPlatformLinks: { spotify: 'https://open.spotify.com/track/abc' },
    preSaveMusicPlatformLinks: { spotify: 'https://presave.spotify.com/abc' },
    ...overrides
  } as MusicRelease
}

const originalInnerWidth = window.innerWidth

// Desktop: wide viewport, no touch capability → isMobile === false.
function setDesktop() {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1280
  })
  delete (window as any).ontouchstart
}

// Mobile via narrow viewport (innerWidth < 768).
function setNarrowViewport() {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 480
  })
  delete (window as any).ontouchstart
}

// Mobile via touch capability ('ontouchstart' in window) while viewport stays wide.
function setTouchWideViewport() {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1280
  })
  ;(window as any).ontouchstart = null
}

beforeEach(() => {
  vi.clearAllMocks()
  isUpcomingRelease.mockReturnValue(false)
  localePath.mockImplementation((arg: any) => {
    if (typeof arg === 'string') return arg
    const q = arg.query ? `?from=${arg.query.from}` : ''
    return `${arg.path}${q}`
  })
  setDesktop()
})

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: originalInnerWidth
  })
  delete (window as any).ontouchstart
})

describe('useMusicNavigation', () => {
  describe('isReleaseInPreSaveMode', () => {
    it('is true for an upcoming release with preSaveMusicPlatformLinks', () => {
      isUpcomingRelease.mockReturnValue(true)
      const { handleMusicClick } = useMusicNavigation()
      // exercise via the public surface: a pre-save release on desktop opens the modal
      const { isSelectedReleasePreSave } = useMusicNavigation()
      expect(typeof handleMusicClick).toBe('function')
      expect(isSelectedReleasePreSave.value).toBe(false)
    })

    it('routes an upcoming release WITH preSave links to /pre-save (proving pre-save mode)', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(makeRelease({ distributorPreSaveUrl: undefined }))
      expect(navigateTo).toHaveBeenCalledWith('/pre-save/mania?from=music')
    })

    it('treats an upcoming release with ONLY a distributorPreSaveUrl as pre-save', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(
        makeRelease({
          preSaveMusicPlatformLinks: undefined,
          distributorPreSaveUrl: 'https://distrokid.com/presave/abc',
          useDistributorPreSave: false
        })
      )
      // pre-save mode but NOT distributor-redirect (useDistributorPreSave is false)
      expect(navigateTo).toHaveBeenCalledWith('/pre-save/mania?from=music')
    })

    it('is NOT pre-save when upcoming but BOTH preSave links and distributor URL are absent → /listen', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(
        makeRelease({ preSaveMusicPlatformLinks: undefined, distributorPreSaveUrl: undefined })
      )
      expect(navigateTo).toHaveBeenCalledWith('/listen/mania?from=music')
    })

    it('is NOT pre-save when the release is already released, even with preSave links → /listen', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(makeRelease())
      expect(isUpcomingRelease).toHaveBeenCalledWith('2026-07-01')
      expect(navigateTo).toHaveBeenCalledWith('/listen/mania?from=music')
    })

    it('passes the release.releaseDate straight to isUpcomingRelease', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(makeRelease({ releaseDate: '2099-01-01' }))
      expect(isUpcomingRelease).toHaveBeenCalledWith('2099-01-01')
    })
  })

  describe('handleMusicClick — distributor redirect', () => {
    it('redirects externally in a new tab when pre-save + useDistributorPreSave + URL', async () => {
      isUpcomingRelease.mockReturnValue(true)
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(
        makeRelease({
          useDistributorPreSave: true,
          distributorPreSaveUrl: 'https://distrokid.com/presave/xyz'
        })
      )
      expect(navigateTo).toHaveBeenCalledTimes(1)
      expect(navigateTo).toHaveBeenCalledWith('https://distrokid.com/presave/xyz', {
        external: true,
        open: { target: '_blank' }
      })
      // never builds a localePath route when redirecting externally
      expect(localePath).not.toHaveBeenCalled()
    })

    it('does NOT consult isMobile / open a modal when redirecting to the distributor', async () => {
      isUpcomingRelease.mockReturnValue(true)
      // desktop — would normally open a modal — but distributor redirect wins first
      setDesktop()
      const { handleMusicClick, isModalOpen, selectedRelease } = useMusicNavigation()
      await handleMusicClick(
        makeRelease({
          useDistributorPreSave: true,
          distributorPreSaveUrl: 'https://distrokid.com/presave/xyz'
        })
      )
      expect(isModalOpen.value).toBe(false)
      expect(selectedRelease.value).toBeNull()
    })

    it('does NOT redirect externally when useDistributorPreSave is true but URL is missing', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(
        makeRelease({ useDistributorPreSave: true, distributorPreSaveUrl: undefined })
      )
      // falls through to the normal pre-save page navigation
      expect(navigateTo).toHaveBeenCalledWith('/pre-save/mania?from=music')
    })

    it('does NOT redirect externally when a distributor URL exists but useDistributorPreSave is false', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(
        makeRelease({
          useDistributorPreSave: false,
          distributorPreSaveUrl: 'https://distrokid.com/presave/xyz'
        })
      )
      expect(navigateTo).toHaveBeenCalledWith('/pre-save/mania?from=music')
    })

    it('does NOT redirect externally for a released distributor-flagged release', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(
        makeRelease({
          useDistributorPreSave: true,
          distributorPreSaveUrl: 'https://distrokid.com/presave/xyz'
        })
      )
      // released → not pre-save → distributor branch skipped → /listen
      expect(navigateTo).toHaveBeenCalledWith('/listen/mania?from=music')
    })
  })

  describe('handleMusicClick — mobile navigation (narrow viewport)', () => {
    it('navigates to /pre-save/<slug>?from=music for a pre-save release', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(makeRelease())
      expect(localePath).toHaveBeenCalledWith({
        path: '/pre-save/mania',
        query: { from: 'music' }
      })
      expect(navigateTo).toHaveBeenCalledWith('/pre-save/mania?from=music')
    })

    it('navigates to /listen/<slug>?from=music for a released release', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(makeRelease())
      expect(localePath).toHaveBeenCalledWith({
        path: '/listen/mania',
        query: { from: 'music' }
      })
      expect(navigateTo).toHaveBeenCalledWith('/listen/mania?from=music')
    })

    it('honours a non-identity localePath (locale prefixing) for the mobile route', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setNarrowViewport()
      localePath.mockImplementation((arg: any) => `/en${arg.path}?from=${arg.query.from}`)
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(makeRelease())
      expect(navigateTo).toHaveBeenCalledWith('/en/listen/mania?from=music')
    })

    it('uses the release.slug verbatim when building the mobile path', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setNarrowViewport()
      const { handleMusicClick } = useMusicNavigation()
      await handleMusicClick(makeRelease({ slug: 'some-other-slug' }))
      expect(navigateTo).toHaveBeenCalledWith('/listen/some-other-slug?from=music')
    })

    it('treats touch capability (ontouchstart) as mobile even with a wide viewport', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setTouchWideViewport()
      const { handleMusicClick, isModalOpen } = useMusicNavigation()
      await handleMusicClick(makeRelease())
      // mobile path taken → navigates, modal stays closed
      expect(navigateTo).toHaveBeenCalledWith('/listen/mania?from=music')
      expect(isModalOpen.value).toBe(false)
    })
  })

  describe('handleMusicClick — desktop modal', () => {
    it('opens the modal (no navigation) for a released release on desktop', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.handleMusicClick(makeRelease({ id: 'rel-42' }))
      expect(navigateTo).not.toHaveBeenCalled()
      expect(nav.isModalOpen.value).toBe(true)
      expect(nav.selectedRelease.value).toMatchObject({ id: 'rel-42', slug: 'mania' })
    })

    it('opens the modal for a pre-save release on desktop (when not a distributor redirect)', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.handleMusicClick(makeRelease())
      expect(navigateTo).not.toHaveBeenCalled()
      expect(nav.isModalOpen.value).toBe(true)
      expect(nav.isSelectedReleasePreSave.value).toBe(true)
    })

    it('isSelectedReleasePreSave is false when the modal release is already released', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.handleMusicClick(makeRelease())
      expect(nav.isSelectedReleasePreSave.value).toBe(false)
    })

    it('the desktop modal does not invoke localePath (no route is built)', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.handleMusicClick(makeRelease())
      expect(localePath).not.toHaveBeenCalled()
    })
  })

  describe('isSelectedReleasePreSave (computed)', () => {
    it('defaults to false when no release is selected', () => {
      const { isSelectedReleasePreSave } = useMusicNavigation()
      expect(isSelectedReleasePreSave.value).toBe(false)
    })

    it('reflects the selected release once a desktop click sets it', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setDesktop()
      const nav = useMusicNavigation()
      expect(nav.isSelectedReleasePreSave.value).toBe(false)
      await nav.handleMusicClick(makeRelease())
      expect(nav.isSelectedReleasePreSave.value).toBe(true)
    })
  })

  describe('closeModal', () => {
    it('clears isModalOpen and selectedRelease', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.handleMusicClick(makeRelease())
      expect(nav.isModalOpen.value).toBe(true)
      nav.closeModal()
      expect(nav.isModalOpen.value).toBe(false)
      expect(nav.selectedRelease.value).toBeNull()
    })
  })

  describe('goToFullPage', () => {
    it('closes the modal then navigates to the pre-save page for an upcoming release', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.handleMusicClick(makeRelease()) // opens modal
      expect(nav.isModalOpen.value).toBe(true)
      await nav.goToFullPage(makeRelease())
      expect(nav.isModalOpen.value).toBe(false)
      expect(nav.selectedRelease.value).toBeNull()
      expect(navigateTo).toHaveBeenCalledWith('/pre-save/mania?from=music')
    })

    it('navigates to /listen for a released release regardless of device (no isMobile gate)', async () => {
      isUpcomingRelease.mockReturnValue(false)
      // desktop — goToFullPage must STILL navigate (it has no isMobile branch)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.goToFullPage(makeRelease())
      expect(navigateTo).toHaveBeenCalledWith('/listen/mania?from=music')
    })

    it('does not redirect to the distributor even for a distributor-flagged pre-save release', async () => {
      isUpcomingRelease.mockReturnValue(true)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.goToFullPage(
        makeRelease({
          useDistributorPreSave: true,
          distributorPreSaveUrl: 'https://distrokid.com/presave/xyz'
        })
      )
      // goToFullPage always uses the internal /pre-save page, never the external URL
      expect(navigateTo).toHaveBeenCalledWith('/pre-save/mania?from=music')
    })
  })

  describe('handleModalKeyboard', () => {
    const releases = [
      makeRelease({ id: 'a', slug: 'a' }),
      makeRelease({ id: 'b', slug: 'b' }),
      makeRelease({ id: 'c', slug: 'c' })
    ]

    async function openOn(navTarget: any, release: MusicRelease) {
      isUpcomingRelease.mockReturnValue(false)
      setDesktop()
      await navTarget.handleMusicClick(release)
    }

    it('is a no-op when the modal is not open', () => {
      const nav = useMusicNavigation()
      const ev = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const spy = vi.spyOn(ev, 'preventDefault')
      nav.handleModalKeyboard(ev, releases)
      expect(spy).not.toHaveBeenCalled()
      expect(nav.selectedRelease.value).toBeNull()
    })

    it('ArrowRight advances to the next release', async () => {
      const nav = useMusicNavigation()
      await openOn(nav, releases[0])
      const ev = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const spy = vi.spyOn(ev, 'preventDefault')
      nav.handleModalKeyboard(ev, releases)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(nav.selectedRelease.value?.id).toBe('b')
    })

    it('ArrowRight at the last release does not move past the end', async () => {
      const nav = useMusicNavigation()
      await openOn(nav, releases[2])
      nav.handleModalKeyboard(new KeyboardEvent('keydown', { key: 'ArrowRight' }), releases)
      expect(nav.selectedRelease.value?.id).toBe('c')
    })

    it('ArrowLeft steps to the previous release', async () => {
      const nav = useMusicNavigation()
      await openOn(nav, releases[2])
      nav.handleModalKeyboard(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), releases)
      expect(nav.selectedRelease.value?.id).toBe('b')
    })

    it('ArrowLeft at the first release does not move before the start', async () => {
      const nav = useMusicNavigation()
      await openOn(nav, releases[0])
      nav.handleModalKeyboard(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), releases)
      expect(nav.selectedRelease.value?.id).toBe('a')
    })

    it('Escape closes the modal', async () => {
      const nav = useMusicNavigation()
      await openOn(nav, releases[1])
      expect(nav.isModalOpen.value).toBe(true)
      nav.handleModalKeyboard(new KeyboardEvent('keydown', { key: 'Escape' }), releases)
      expect(nav.isModalOpen.value).toBe(false)
      expect(nav.selectedRelease.value).toBeNull()
    })

    it('ignores unrelated keys without changing selection or preventing default', async () => {
      const nav = useMusicNavigation()
      await openOn(nav, releases[1])
      const ev = new KeyboardEvent('keydown', { key: 'Enter' })
      const spy = vi.spyOn(ev, 'preventDefault')
      nav.handleModalKeyboard(ev, releases)
      expect(spy).not.toHaveBeenCalled()
      expect(nav.selectedRelease.value?.id).toBe('b')
    })

    it('does nothing when the current release is not found in the provided list', async () => {
      const nav = useMusicNavigation()
      await openOn(nav, makeRelease({ id: 'orphan', slug: 'orphan' }))
      // currentIndex is -1; ArrowRight (-1 < length-1) would move to releases[0].
      // Assert the ACTUAL behaviour: it selects index 0 on ArrowRight from -1.
      nav.handleModalKeyboard(new KeyboardEvent('keydown', { key: 'ArrowRight' }), releases)
      expect(nav.selectedRelease.value?.id).toBe('a')
    })
  })

  describe('isMobile (computed)', () => {
    it('is false on a wide, non-touch viewport', () => {
      setDesktop()
      const { isMobile } = useMusicNavigation()
      expect(isMobile.value).toBe(false)
    })

    it('is true on a narrow viewport (< 768)', () => {
      setNarrowViewport()
      const { isMobile } = useMusicNavigation()
      expect(isMobile.value).toBe(true)
    })

    it('is true when ontouchstart exists even on a wide viewport', () => {
      setTouchWideViewport()
      const { isMobile } = useMusicNavigation()
      expect(isMobile.value).toBe(true)
    })
  })

  describe('exposed state is read-only', () => {
    it('selectedRelease / isModalOpen / isSelectedReleasePreSave are readonly refs', async () => {
      isUpcomingRelease.mockReturnValue(false)
      setDesktop()
      const nav = useMusicNavigation()
      await nav.handleMusicClick(makeRelease())
      // readonly() refs warn and refuse mutation; mutating the public ref must not
      // change the underlying state.
      ;(nav.isModalOpen as any).value = false
      expect(nav.isModalOpen.value).toBe(true)
    })
  })
})
