import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// B-06: sessionStorage THROWS (SecurityError) when site data is blocked — Chrome's
// "block all cookies", some in-app WebViews. Source attribution must degrade to an
// in-memory copy instead of crashing the page's setup. The module keeps a
// "storage is broken" flag at module scope, so every test gets a fresh import.

const blockedStorage = () => ({
  getItem: vi.fn(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  }),
  setItem: vi.fn(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  }),
  removeItem: vi.fn(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  })
})

const stubBrowser = (sessionStorage: unknown, pathname = '/') => {
  vi.stubGlobal('window', { location: { pathname }, sessionStorage })
  vi.stubGlobal('document', { referrer: '' })
  vi.stubGlobal('navigator', { userAgent: '' })
}

const load = async () => {
  vi.resetModules()
  return await import('../../utils/sourceAttribution')
}

describe('source attribution with blocked sessionStorage', () => {
  beforeEach(() => {
    stubBrowser(blockedStorage())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('getOrPersistSourcePlatform does not throw and still detects the source', async () => {
    const { getOrPersistSourcePlatform } = await load()
    expect(getOrPersistSourcePlatform({ path: '/', referrer: '', userAgent: '' })).toBe('direct')
    expect(
      getOrPersistSourcePlatform({ path: '/', referrer: 'https://l.instagram.com/', userAgent: '' })
    ).toBe('direct') // first touch is remembered in memory, not re-detected
  })

  it('keeps first-touch attribution in memory for the rest of the page load', async () => {
    const { getOrPersistSourcePlatform } = await load()
    expect(
      getOrPersistSourcePlatform({ path: '/', referrer: 'https://l.instagram.com/', userAgent: '' })
    ).toBe('instagram')
    // A later call with no signal returns the remembered value, not 'direct'.
    expect(getOrPersistSourcePlatform({ path: '/', referrer: '', userAgent: '' })).toBe('instagram')
  })

  it('a path-prefix match still overrides, and setExplicitSourcePlatform does not throw', async () => {
    const { getOrPersistSourcePlatform, setExplicitSourcePlatform } = await load()
    expect(() => setExplicitSourcePlatform('tiktok')).not.toThrow()
    expect(getOrPersistSourcePlatform({ path: '/', referrer: '', userAgent: '' })).toBe('tiktok')
    expect(getOrPersistSourcePlatform({ path: '/listen/i/khvyli' })).toBe('instagram')
  })

  it('resetSourcePlatform does not throw and clears the in-memory copy', async () => {
    const { getOrPersistSourcePlatform, setExplicitSourcePlatform, resetSourcePlatform } =
      await load()
    setExplicitSourcePlatform('facebook')
    expect(() => resetSourcePlatform()).not.toThrow()
    expect(getOrPersistSourcePlatform({ path: '/', referrer: '', userAgent: '' })).toBe('direct')
  })

  it('stops touching the broken storage after the first failure', async () => {
    const storage = blockedStorage()
    stubBrowser(storage)
    const { getOrPersistSourcePlatform } = await load()
    getOrPersistSourcePlatform({ path: '/', referrer: '', userAgent: '' })
    getOrPersistSourcePlatform({ path: '/', referrer: '', userAgent: '' })
    expect(storage.getItem).toHaveBeenCalledTimes(1)
  })
})

describe('source attribution with a working sessionStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not leak an earlier in-memory value over a cleared storage', async () => {
    const store = new Map<string, string>()
    stubBrowser({
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k)
    })
    const { getOrPersistSourcePlatform, setExplicitSourcePlatform } = await load()
    setExplicitSourcePlatform('tiktok')
    store.clear() // e.g. the session ended
    expect(getOrPersistSourcePlatform({ path: '/', referrer: '', userAgent: '' })).toBe('direct')
  })
})
