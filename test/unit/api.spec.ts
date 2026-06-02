import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cachedApiRequest,
  cachedGet,
  cachedPost,
  cachedPut,
  apiDelete,
  invalidateCache
} from '~/utils/api'
import { apiCache } from '~/utils/cache'

// ---------------------------------------------------------------------------
// Environment notes
// ---------------------------------------------------------------------------
//
// This is the `unit` (node env) project. There is no `window` and no Cache API,
// so the imported `apiCache` singleton runs entirely inert:
//   • apiCache.get()/set() short-circuit on `typeof window === 'undefined'`
//     (cache.ts), so the cache layer NEVER stores or returns anything here.
//   • That is exactly the contract we exercise: cache code paths are reachable
//     (enabled && GET) but yield no hits, so every request still hits fetch.
//
// We therefore drive cachedApiRequest purely through globalThis.fetch, which we
// replace with a vi.fn() mock per test and restore in afterEach.

let fetchMock: ReturnType<typeof vi.fn>

function makeResponse(
  body: any,
  init: { ok?: boolean; status?: number; statusText?: string } = {}
) {
  const { ok = true, status = 200, statusText = 'OK' } = init
  return {
    ok,
    status,
    statusText,
    json: vi.fn(async () => body)
  }
}

beforeEach(() => {
  // Silence the source's console.log/warn/error chatter.
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})

  fetchMock = vi.fn()
  globalThis.fetch = fetchMock as any
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  // Remove the fetch override so it doesn't leak into other files.
  // (Each test reassigns it in beforeEach anyway.)
  delete (globalThis as any).fetch
})

// ---------------------------------------------------------------------------
// cachedApiRequest — happy path & response parsing
// ---------------------------------------------------------------------------
describe('cachedApiRequest — success path', () => {
  it('returns the parsed JSON body on a 2xx response', async () => {
    fetchMock.mockResolvedValue(makeResponse({ id: 7, name: 'release' }))
    const result = await cachedApiRequest('/api/releases')
    expect(result).toEqual({ id: 7, name: 'release' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('defaults the method to GET and sets a JSON Content-Type header', async () => {
    fetchMock.mockResolvedValue(makeResponse({ ok: true }))
    await cachedApiRequest('/api/x')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/x')
    expect(init.method).toBe('GET')
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('merges and allows overriding caller-supplied headers', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x', {
      headers: { Authorization: 'Bearer t', 'Content-Type': 'text/plain' }
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer t')
    // Caller header overrides the default because it is spread after the default.
    expect(init.headers['Content-Type']).toBe('text/plain')
  })
})

// ---------------------------------------------------------------------------
// cachedApiRequest — query string construction
// ---------------------------------------------------------------------------
describe('cachedApiRequest — query string building', () => {
  it('appends params with a leading "?" when the URL has none', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/search', { params: { q: 'wbm', page: 2 } })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/search?q=wbm&page=2')
  })

  it('appends params with a leading "&" when the URL already has a query', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/search?existing=1', { params: { q: 'wbm' } })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/search?existing=1&q=wbm')
  })

  it('drops null and undefined params but keeps falsy values like 0 and empty string', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x', {
      params: { a: null, b: undefined, c: 0, d: '', e: 'keep' }
    })

    const [url] = fetchMock.mock.calls[0]
    // null/undefined removed; 0 and '' are preserved (serialized via String()).
    expect(url).toBe('/api/x?c=0&d=&e=keep')
    expect(url).not.toContain('a=')
    expect(url).not.toContain('b=')
  })

  it('does not append a query string when params is an empty object', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x', { params: {} })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/x')
  })

  it('does not append a query string when params is undefined', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x')

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/x')
  })

  it('URL-encodes param keys and values', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x', { params: { 'a b': 'c&d' } })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/x?a+b=c%26d')
  })
})

// ---------------------------------------------------------------------------
// cachedApiRequest — request body handling
// ---------------------------------------------------------------------------
describe('cachedApiRequest — body handling', () => {
  it('serializes the body as JSON for non-GET methods', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x', { method: 'POST', body: { a: 1 } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ a: 1 }))
  })

  it('does NOT attach a body for GET even when a body is supplied', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x', { method: 'GET', body: { a: 1 } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBeUndefined()
  })

  it('does NOT attach a body for non-GET when body is falsy/omitted', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x', { method: 'DELETE' })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBeUndefined()
  })

  it('treats a lowercase "get" method the same as GET for body suppression', async () => {
    fetchMock.mockResolvedValue(makeResponse({}))
    await cachedApiRequest('/api/x', { method: 'get', body: { a: 1 } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('get')
    expect(init.body).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// cachedApiRequest — error handling
// ---------------------------------------------------------------------------
describe('cachedApiRequest — non-2xx responses', () => {
  it('throws an Error whose message includes "HTTP <status>" by default (rethrow)', async () => {
    fetchMock.mockResolvedValue(
      makeResponse(null, { ok: false, status: 404, statusText: 'Not Found' })
    )
    await expect(cachedApiRequest('/api/missing')).rejects.toThrow('HTTP 404: Not Found')
  })

  it('includes the numeric status code in the thrown message for a 500', async () => {
    fetchMock.mockResolvedValue(
      makeResponse(null, { ok: false, status: 500, statusText: 'Server Error' })
    )
    await expect(cachedApiRequest('/api/boom')).rejects.toThrow('HTTP 500')
  })

  it('does not call .json() when the response is not ok', async () => {
    const resp = makeResponse({ should: 'not be read' }, { ok: false, status: 403 })
    fetchMock.mockResolvedValue(resp)
    await expect(cachedApiRequest('/api/forbidden')).rejects.toThrow('HTTP 403')
    expect(resp.json).not.toHaveBeenCalled()
  })

  it('returns the defaultValue (no throw) when rethrow is false', async () => {
    fetchMock.mockResolvedValue(makeResponse(null, { ok: false, status: 404 }))
    const result = await cachedApiRequest(
      '/api/missing',
      {},
      {},
      { rethrow: false, defaultValue: { fallback: true } }
    )
    expect(result).toEqual({ fallback: true })
  })

  it('returns null when rethrow is false and no defaultValue is provided', async () => {
    fetchMock.mockResolvedValue(makeResponse(null, { ok: false, status: 500 }))
    const result = await cachedApiRequest('/api/boom', {}, {}, { rethrow: false })
    expect(result).toBeNull()
  })

  it('rethrows a network-level fetch rejection', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    await expect(cachedApiRequest('/api/x')).rejects.toThrow('network down')
  })

  it('swallows a network-level rejection into defaultValue when rethrow is false', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const result = await cachedApiRequest(
      '/api/x',
      {},
      {},
      { rethrow: false, defaultValue: 'recovered' }
    )
    expect(result).toBe('recovered')
  })
})

// ---------------------------------------------------------------------------
// cachedApiRequest — cache layer interaction (inert in node, but reachable)
// ---------------------------------------------------------------------------
describe('cachedApiRequest — cache layer gating', () => {
  it('consults the cache (get) only when enabled and method is GET', async () => {
    const getSpy = vi.spyOn(apiCache, 'get')
    fetchMock.mockResolvedValue(makeResponse({ v: 1 }))

    await cachedApiRequest('/api/x', { method: 'GET' }, { enabled: true })
    expect(getSpy).toHaveBeenCalledTimes(1)
  })

  it('does NOT consult the cache when caching is disabled (default)', async () => {
    const getSpy = vi.spyOn(apiCache, 'get')
    const setSpy = vi.spyOn(apiCache, 'set')
    fetchMock.mockResolvedValue(makeResponse({ v: 1 }))

    await cachedApiRequest('/api/x', { method: 'GET' })
    expect(getSpy).not.toHaveBeenCalled()
    expect(setSpy).not.toHaveBeenCalled()
  })

  it('does NOT consult the cache for a non-GET method even when enabled', async () => {
    const getSpy = vi.spyOn(apiCache, 'get')
    const setSpy = vi.spyOn(apiCache, 'set')
    fetchMock.mockResolvedValue(makeResponse({ v: 1 }))

    await cachedApiRequest('/api/x', { method: 'POST', body: { a: 1 } }, { enabled: true })
    expect(getSpy).not.toHaveBeenCalled()
    expect(setSpy).not.toHaveBeenCalled()
  })

  it('attempts to store the response (set) after a successful enabled GET', async () => {
    const setSpy = vi.spyOn(apiCache, 'set')
    fetchMock.mockResolvedValue(makeResponse({ v: 1 }))

    await cachedApiRequest('/api/x', { method: 'GET' }, { enabled: true })
    // In node, set() is inert but the source still invokes it.
    expect(setSpy).toHaveBeenCalledTimes(1)
  })

  it('returns the cached value and skips fetch when the cache reports a hit', async () => {
    // Force a synthetic hit to exercise the early-return branch that node's
    // inert cache normally cannot reach (window undefined → always null).
    const getSpy = vi.spyOn(apiCache, 'get').mockResolvedValue({ cached: true })

    const result = await cachedApiRequest('/api/x', { method: 'GET' }, { enabled: true })
    expect(result).toEqual({ cached: true })
    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls through to fetch when the cache reports a miss (null)', async () => {
    vi.spyOn(apiCache, 'get').mockResolvedValue(null)
    fetchMock.mockResolvedValue(makeResponse({ fresh: true }))

    const result = await cachedApiRequest('/api/x', { method: 'GET' }, { enabled: true })
    expect(result).toEqual({ fresh: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('uses a caller-supplied custom cache key when provided', async () => {
    const getSpy = vi.spyOn(apiCache, 'get').mockResolvedValue({ cached: true })

    await cachedApiRequest('/api/x', { method: 'GET' }, { enabled: true, key: 'custom-key' })
    expect(getSpy).toHaveBeenCalledWith('custom-key', expect.any(Number))
  })

  it('passes the configured ttl through to the cache get', async () => {
    const getSpy = vi.spyOn(apiCache, 'get').mockResolvedValue({ cached: true })

    await cachedApiRequest('/api/x', { method: 'GET' }, { enabled: true, ttl: 1234 })
    expect(getSpy).toHaveBeenCalledWith(expect.any(String), 1234)
  })
})

// ---------------------------------------------------------------------------
// Shorthand helpers
// ---------------------------------------------------------------------------
describe('shorthand helpers', () => {
  it('cachedGet forces method GET', async () => {
    fetchMock.mockResolvedValue(makeResponse({ ok: true }))
    await cachedGet('/api/x', { headers: { X: '1' } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('GET')
    expect(init.headers.X).toBe('1')
  })

  it('cachedPost forces method POST and serializes the data as the body', async () => {
    fetchMock.mockResolvedValue(makeResponse({ ok: true }))
    await cachedPost('/api/x', { a: 1 })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ a: 1 }))
  })

  it('cachedPut forces method PUT and serializes the data as the body', async () => {
    fetchMock.mockResolvedValue(makeResponse({ ok: true }))
    await cachedPut('/api/x', { a: 2 })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('PUT')
    expect(init.body).toBe(JSON.stringify({ a: 2 }))
  })

  it('apiDelete forces method DELETE and disables caching (no cache.get)', async () => {
    const getSpy = vi.spyOn(apiCache, 'get')
    fetchMock.mockResolvedValue(makeResponse({ ok: true }))

    await apiDelete('/api/x')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('DELETE')
    // enabled:false is hard-coded inside apiDelete, so the cache is never read.
    expect(getSpy).not.toHaveBeenCalled()
  })

  it('cachedGet still skips the cache when the caller does not enable it', async () => {
    const getSpy = vi.spyOn(apiCache, 'get')
    fetchMock.mockResolvedValue(makeResponse({ ok: true }))

    await cachedGet('/api/x')
    expect(getSpy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// invalidateCache
// ---------------------------------------------------------------------------
describe('invalidateCache', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is a no-op under SSR (window undefined) and never touches localStorage', async () => {
    // window is undefined in node by default; be explicit.
    vi.stubGlobal('window', undefined)
    // Should resolve without throwing and without reading apiCache state.
    await expect(invalidateCache('anything')).resolves.toBeUndefined()
  })

  it('selects the string `includes` branch for a string pattern (localStorage backend)', async () => {
    const removed: string[] = []
    const ls: any = {
      'wbm-band-api-cache:GET|/api/releases': 'x',
      'wbm-band-api-cache:GET|/api/songs': 'x',
      'unrelated-key': 'x',
      removeItem: vi.fn((k: string) => removed.push(k))
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', ls)

    // Force the localStorage-fallback branch of invalidateCache.
    const useLsSpy = vi.spyOn(apiCache, 'useLocalStorage', 'get').mockReturnValue(true)

    await invalidateCache('releases')

    expect(useLsSpy).toHaveBeenCalled()
    // Only the key whose decoded cacheKey includes "releases" is removed.
    expect(removed).toEqual(['wbm-band-api-cache:GET|/api/releases'])
  })

  it('selects the RegExp `test` branch for a RegExp pattern (localStorage backend)', async () => {
    const removed: string[] = []
    const ls: any = {
      'wbm-band-api-cache:GET|/api/releases': 'x',
      'wbm-band-api-cache:GET|/api/songs': 'x',
      'wbm-band-api-cache:POST|/api/contact': 'x',
      removeItem: vi.fn((k: string) => removed.push(k))
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', ls)
    vi.spyOn(apiCache, 'useLocalStorage', 'get').mockReturnValue(true)

    // Matches GET cache keys only.
    await invalidateCache(/^GET\|/)

    expect(removed.sort()).toEqual(
      ['wbm-band-api-cache:GET|/api/releases', 'wbm-band-api-cache:GET|/api/songs'].sort()
    )
  })

  it('ignores keys without the cacheName prefix in the localStorage backend', async () => {
    const removed: string[] = []
    const ls: any = {
      'wbm-band-api-cache:GET|/api/x': 'x',
      'some-other-cache:GET|/api/x': 'x',
      removeItem: vi.fn((k: string) => removed.push(k))
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', ls)
    vi.spyOn(apiCache, 'useLocalStorage', 'get').mockReturnValue(true)

    // Pattern matches both keys' suffix, but only the prefixed one is eligible.
    await invalidateCache('/api/x')

    expect(removed).toEqual(['wbm-band-api-cache:GET|/api/x'])
  })

  it('removes nothing when no key matches the pattern', async () => {
    const removed: string[] = []
    const ls: any = {
      'wbm-band-api-cache:GET|/api/releases': 'x',
      removeItem: vi.fn((k: string) => removed.push(k))
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', ls)
    vi.spyOn(apiCache, 'useLocalStorage', 'get').mockReturnValue(true)

    await invalidateCache('no-such-thing')
    expect(removed).toEqual([])
  })

  it('returns early (no Cache API access) when caches is absent and not using localStorage', async () => {
    // window present but no `caches`, and useLocalStorage is false → the function
    // hits `if (!('caches' in window)) return` and resolves quietly.
    vi.stubGlobal('window', {})
    vi.spyOn(apiCache, 'useLocalStorage', 'get').mockReturnValue(false)

    await expect(invalidateCache('anything')).resolves.toBeUndefined()
  })

  it('swallows errors thrown while invalidating (does not reject)', async () => {
    const ls: any = {
      'wbm-band-api-cache:GET|/api/x': 'x',
      removeItem: vi.fn(() => {
        throw new Error('storage blew up')
      })
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', ls)
    vi.spyOn(apiCache, 'useLocalStorage', 'get').mockReturnValue(true)

    await expect(invalidateCache('/api/x')).resolves.toBeUndefined()
  })

  it('uses the Cache API backend: matches decoded keys and deletes matching requests', async () => {
    const encode = (k: string) => `cache://wbm-band-api-cache/${encodeURIComponent(k)}`
    const deleted: string[] = []
    const requests = [{ url: encode('GET|/api/releases') }, { url: encode('GET|/api/songs') }]
    const cacheObj = {
      keys: vi.fn(async () => requests),
      delete: vi.fn(async (req: { url: string }) => {
        deleted.push(req.url)
        return true
      })
    }
    const cachesStub = { open: vi.fn(async () => cacheObj) }

    vi.stubGlobal('window', { caches: cachesStub })
    vi.stubGlobal('caches', cachesStub)
    vi.spyOn(apiCache, 'useLocalStorage', 'get').mockReturnValue(false)

    await invalidateCache('releases')

    expect(deleted).toEqual([encode('GET|/api/releases')])
  })

  it('Cache API backend matches against the DECODED key, so pipe-containing patterns work', async () => {
    const encode = (k: string) => `cache://wbm-band-api-cache/${encodeURIComponent(k)}`
    const deleted: string[] = []
    const requests = [{ url: encode('GET|/api/x') }, { url: encode('POST|/api/x') }]
    const cacheObj = {
      keys: vi.fn(async () => requests),
      delete: vi.fn(async (req: { url: string }) => {
        deleted.push(req.url)
        return true
      })
    }
    const cachesStub = { open: vi.fn(async () => cacheObj) }

    vi.stubGlobal('window', { caches: cachesStub })
    vi.stubGlobal('caches', cachesStub)
    vi.spyOn(apiCache, 'useLocalStorage', 'get').mockReturnValue(false)

    // The raw stored url has `|` percent-encoded; matching on the DECODED key
    // (which contains a literal `|`) is what makes this pattern hit.
    await invalidateCache('GET|/api/x')

    expect(deleted).toEqual([encode('GET|/api/x')])
  })
})
