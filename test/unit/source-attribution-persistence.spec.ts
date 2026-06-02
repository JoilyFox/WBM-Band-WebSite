import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getOrPersistSourcePlatform,
  setExplicitSourcePlatform,
  resetSourcePlatform
} from '~/utils/sourceAttribution'

// These cover ONLY the persistence layer. The pure detector fns are covered in
// source-attribution.spec.ts and are intentionally NOT re-tested here.

const STORAGE_KEY = 'wbm_source_platform'

const igUa =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21A329 Instagram 308.0.0.31.110 (iPhone15,2; iOS 17_0; en_US; en-US; scale=3.00; 1179x2556; 528466069)'
const desktopUa =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

// Map-backed fake matching the Storage interface surface the code touches.
function makeSessionStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    store,
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, String(value))
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key)
    }),
    clear: vi.fn(() => store.clear())
  }
}

// Install a browser-like window with the supplied bits. Anything omitted gets
// sensible empty defaults so a "no signal" run resolves to direct.
function stubBrowser(opts: {
  pathname?: string
  referrer?: string
  userAgent?: string
  initialStore?: Record<string, string>
}) {
  const sessionStorage = makeSessionStorage(opts.initialStore)
  vi.stubGlobal('window', {
    location: { pathname: opts.pathname ?? '/' },
    sessionStorage
  })
  vi.stubGlobal('document', { referrer: opts.referrer ?? '' })
  vi.stubGlobal('navigator', { userAgent: opts.userAgent ?? '' })
  return sessionStorage
}

describe('getOrPersistSourcePlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('first-touch detect-and-persist', () => {
    it('detects from referrer when nothing is stored, then writes it to sessionStorage', () => {
      const ss = stubBrowser({
        pathname: '/ua/listen/mania',
        referrer: 'https://www.instagram.com/'
      })

      const result = getOrPersistSourcePlatform()

      expect(result).toBe('instagram')
      expect(ss.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'instagram')
      expect(ss.store.get(STORAGE_KEY)).toBe('instagram')
    })

    it('falls back to UA fingerprint when there is no path/referrer signal', () => {
      const ss = stubBrowser({
        pathname: '/listen/mania',
        referrer: '',
        userAgent: igUa
      })

      expect(getOrPersistSourcePlatform()).toBe('instagram')
      expect(ss.store.get(STORAGE_KEY)).toBe('instagram')
    })

    it('persists direct when there is no signal at all', () => {
      const ss = stubBrowser({
        pathname: '/listen/mania',
        referrer: '',
        userAgent: desktopUa
      })

      expect(getOrPersistSourcePlatform()).toBe('direct')
      expect(ss.store.get(STORAGE_KEY)).toBe('direct')
    })

    it('persists other for an unknown referrer with a desktop UA', () => {
      const ss = stubBrowser({
        pathname: '/listen/mania',
        referrer: 'https://example.com/',
        userAgent: desktopUa
      })

      expect(getOrPersistSourcePlatform()).toBe('other')
      expect(ss.store.get(STORAGE_KEY)).toBe('other')
    })

    it('reads location/referrer/userAgent from globals when no inputs are passed', () => {
      const ss = stubBrowser({
        pathname: '/listen/mania',
        referrer: 'https://www.tiktok.com/@user'
      })

      // No inputs argument at all — must fall through to window/document globals.
      expect(getOrPersistSourcePlatform()).toBe('tiktok')
      expect(ss.store.get(STORAGE_KEY)).toBe('tiktok')
    })

    it('explicit inputs override the globals for path/referrer/userAgent', () => {
      const ss = stubBrowser({
        pathname: '/listen/mania',
        referrer: 'https://www.instagram.com/',
        userAgent: igUa
      })

      // Inputs say tiktok via referrer even though globals point at instagram.
      const result = getOrPersistSourcePlatform({
        path: '/listen/mania',
        referrer: 'https://www.tiktok.com/',
        userAgent: ''
      })

      expect(result).toBe('tiktok')
      expect(ss.store.get(STORAGE_KEY)).toBe('tiktok')
    })

    it('uses provided path but still reads referrer/userAgent from globals', () => {
      // Only `path` supplied in inputs — referrer/UA must come from document/navigator.
      const ss = stubBrowser({
        pathname: '/some/other/page',
        referrer: '',
        userAgent: igUa
      })

      expect(getOrPersistSourcePlatform({ path: '/listen/mania' })).toBe('instagram')
      expect(ss.store.get(STORAGE_KEY)).toBe('instagram')
    })
  })

  describe('path-prefix override semantics', () => {
    it('persists the platform derived from a bio-link path prefix', () => {
      const ss = stubBrowser({ pathname: '/listen/i/mania' })

      expect(getOrPersistSourcePlatform()).toBe('instagram')
      expect(ss.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'instagram')
      expect(ss.store.get(STORAGE_KEY)).toBe('instagram')
    })

    it('a path-prefix match ALWAYS overrides a previously stored value', () => {
      const ss = stubBrowser({
        pathname: '/en/listen/yt/mania',
        initialStore: { [STORAGE_KEY]: 'instagram' }
      })

      // Stored = instagram, but the current path is a youtube bio-link click.
      expect(getOrPersistSourcePlatform()).toBe('youtube')
      expect(ss.store.get(STORAGE_KEY)).toBe('youtube')
      expect(ss.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'youtube')
    })

    it('a path-prefix match never reads referrer/UA (path wins outright)', () => {
      const ss = stubBrowser({
        pathname: '/listen/tt/mania',
        referrer: 'https://www.instagram.com/',
        userAgent: igUa
      })

      expect(getOrPersistSourcePlatform()).toBe('tiktok')
      // getItem must not have been consulted on the override path.
      expect(ss.getItem).not.toHaveBeenCalled()
    })
  })

  describe('stored value short-circuit', () => {
    it('returns the stored value when there is no path prefix', () => {
      stubBrowser({
        pathname: '/listen/mania',
        referrer: 'https://www.tiktok.com/',
        userAgent: igUa,
        initialStore: { [STORAGE_KEY]: 'facebook' }
      })

      // Stored facebook wins over referrer/UA because the path has no prefix.
      expect(getOrPersistSourcePlatform()).toBe('facebook')
    })

    it('does not re-run detection or re-persist when a value is already stored', () => {
      const ss = stubBrowser({
        pathname: '/listen/mania',
        referrer: 'https://www.tiktok.com/',
        initialStore: { [STORAGE_KEY]: 'facebook' }
      })

      getOrPersistSourcePlatform()

      // No write happens on a stored-value hit (no path prefix to override it).
      expect(ss.setItem).not.toHaveBeenCalled()
    })
  })

  describe('SSR (window undefined)', () => {
    it('returns direct without touching storage', () => {
      vi.stubGlobal('window', undefined)

      expect(getOrPersistSourcePlatform({ path: '/listen/i/mania' })).toBe('direct')
    })
  })
})

describe('setExplicitSourcePlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('writes the given platform to sessionStorage under the storage key', () => {
    const ss = stubBrowser({})

    setExplicitSourcePlatform('whatsapp')

    expect(ss.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'whatsapp')
    expect(ss.store.get(STORAGE_KEY)).toBe('whatsapp')
  })

  it('overwrites an existing stored value', () => {
    const ss = stubBrowser({ initialStore: { [STORAGE_KEY]: 'instagram' } })

    setExplicitSourcePlatform('reddit')

    expect(ss.store.get(STORAGE_KEY)).toBe('reddit')
  })

  it('is a no-op under SSR (window undefined)', () => {
    vi.stubGlobal('window', undefined)

    expect(() => setExplicitSourcePlatform('instagram')).not.toThrow()
  })
})

describe('resetSourcePlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('removes the stored value from sessionStorage', () => {
    const ss = stubBrowser({ initialStore: { [STORAGE_KEY]: 'instagram' } })

    resetSourcePlatform()

    expect(ss.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
    expect(ss.store.has(STORAGE_KEY)).toBe(false)
  })

  it('does not throw when nothing is stored', () => {
    const ss = stubBrowser({})

    expect(() => resetSourcePlatform()).not.toThrow()
    expect(ss.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
  })

  it('is a no-op under SSR (window undefined)', () => {
    vi.stubGlobal('window', undefined)

    expect(() => resetSourcePlatform()).not.toThrow()
  })
})

describe('persistence round-trip', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reset clears a stored value so the next getOrPersist re-detects', () => {
    const ss = stubBrowser({
      pathname: '/listen/mania',
      referrer: 'https://www.instagram.com/',
      initialStore: { [STORAGE_KEY]: 'facebook' }
    })

    // First call honors the stored facebook value.
    expect(getOrPersistSourcePlatform()).toBe('facebook')

    resetSourcePlatform()
    expect(ss.store.has(STORAGE_KEY)).toBe(false)

    // After reset, detection runs fresh against the referrer.
    expect(getOrPersistSourcePlatform()).toBe('instagram')
    expect(ss.store.get(STORAGE_KEY)).toBe('instagram')
  })

  it('setExplicit then getOrPersist (no prefix) returns the explicit value', () => {
    const ss = stubBrowser({
      pathname: '/listen/mania',
      referrer: 'https://www.tiktok.com/'
    })

    setExplicitSourcePlatform('email')

    // No path prefix → stored explicit value short-circuits detection.
    expect(getOrPersistSourcePlatform()).toBe('email')
    expect(ss.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'email')
  })
})
