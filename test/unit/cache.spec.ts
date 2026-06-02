import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiCache } from '~/utils/cache'
import { CACHE_NAME } from '~/constants/app'

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------
//
// The source reads `typeof window`, `'caches' in window` and the GLOBAL `caches`
// (not `window.caches`). It also constructs `Request`/`Response`. In the `node`
// unit env none of those browser globals exist, so we stub them faithfully:
//   • a minimal in-memory Cache API backed by a Map keyed on request.url
//   • Request/Response shims good enough for the code paths under test
//   • a localStorage shim for the fallback path
//
// `window` is stubbed as a plain object whose ONLY job is to carry the `caches`
// key so the `'caches' in window` guard reflects whether we want Cache-API mode
// or localStorage-fallback mode. The actual cache work goes through globalThis.

// --- In-memory Web Cache API ------------------------------------------------
function createInMemoryCaches() {
  // Map<cacheName, Map<url, { body: string }>>
  const stores = new Map<string, Map<string, { body: string }>>()

  function storeFor(name: string) {
    if (!stores.has(name)) stores.set(name, new Map())
    return stores.get(name)!
  }

  const caches = {
    open: vi.fn(async (name: string) => {
      const store = storeFor(name)
      return {
        match: vi.fn(async (request: { url: string }) => {
          const entry = store.get(request.url)
          if (!entry) return undefined
          return makeResponse(entry.body)
        }),
        put: vi.fn(async (request: { url: string }, response: { _body: string }) => {
          store.set(request.url, { body: response._body })
        }),
        delete: vi.fn(async (request: { url: string }) => {
          return store.delete(request.url)
        }),
        keys: vi.fn(async () => {
          return [...store.keys()].map((url) => ({ url }))
        })
      }
    }),
    delete: vi.fn(async (name: string) => {
      return stores.delete(name)
    }),
    _stores: stores
  }

  return caches
}

function makeResponse(body: string) {
  return {
    _body: body,
    json: async () => JSON.parse(body),
    text: async () => body
  }
}

// --- Request / Response shims ----------------------------------------------
class FakeRequest {
  url: string
  constructor(url: string) {
    this.url = url
  }
}

class FakeResponse {
  _body: string
  headers: Record<string, string>
  constructor(body: string, init?: { headers?: Record<string, string> }) {
    this._body = body
    this.headers = init?.headers ?? {}
  }
  async json() {
    return JSON.parse(this._body)
  }
  async text() {
    return this._body
  }
}

// --- localStorage shim ------------------------------------------------------
// The source's clearLocalStorage()/getLocalStorageStats() iterate via
// `Object.keys(localStorage)`, so stored keys MUST be enumerable own props of
// the object (as they are on the real Storage). We back the data with a Map for
// a clean `_map` view AND mirror each key onto the object itself.
function createLocalStorage(initial: Record<string, string> = {}) {
  const map = new Map<string, string>()

  const ls: any = {}

  const sync = () => {
    // Drop any previously-mirrored data keys, then re-mirror current ones.
    for (const k of Object.keys(ls)) {
      if (k in methods) continue
      Reflect.deleteProperty(ls, k)
    }
    for (const [k, v] of map) ls[k] = v
  }

  const methods = {
    getItem: vi.fn((k: string) => (map.has(k) ? map.get(k)! : null)),
    setItem: vi.fn((k: string, v: string) => {
      map.set(k, String(v))
      sync()
    }),
    removeItem: vi.fn((k: string) => {
      map.delete(k)
      sync()
    }),
    key: (i: number) => [...map.keys()][i] ?? null
  }

  // Methods are non-enumerable so Object.keys(localStorage) only yields data keys
  // (matching real Storage semantics, where getItem/setItem/etc. aren't own keys).
  for (const [name, fn] of Object.entries(methods)) {
    Object.defineProperty(ls, name, { value: fn, enumerable: false })
  }
  Object.defineProperty(ls, 'length', {
    get: () => map.size,
    enumerable: false
  })
  Object.defineProperty(ls, '_map', { get: () => map, enumerable: false })

  for (const [k, v] of Object.entries(initial)) {
    map.set(k, v)
  }
  sync()

  return ls as {
    getItem: ReturnType<typeof vi.fn>
    setItem: ReturnType<typeof vi.fn>
    removeItem: ReturnType<typeof vi.fn>
    key: (i: number) => string | null
    length: number
    _map: Map<string, string>
  }
}

// Helpers to install globals the source reads.
function installCacheApiEnv() {
  const caches = createInMemoryCaches()
  // window only needs to carry `caches` so `'caches' in window` is true.
  vi.stubGlobal('window', { caches })
  vi.stubGlobal('caches', caches)
  vi.stubGlobal('Request', FakeRequest)
  vi.stubGlobal('Response', FakeResponse)
  return caches
}

function installLocalStorageEnv(initial: Record<string, string> = {}) {
  const ls = createLocalStorage(initial)
  // window present but WITHOUT `caches` → localStorage fallback path.
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', ls)
  return ls
}

beforeEach(() => {
  // Silence the console noise the source emits on its error/info paths.
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// generateCacheKey — pure, no globals needed
// ---------------------------------------------------------------------------
describe('generateCacheKey', () => {
  // The constructor reads `window`; in SSR (window undefined) it just no-ops the
  // support check, so a bare ApiCache is safe to construct without any globals.
  function makeCache() {
    return new ApiCache('test-cache')
  }

  it('defaults to GET and emits just the URL when no params/body', () => {
    const cache = makeCache()
    expect(cache.generateCacheKey('/api/releases')).toBe('GET|/api/releases')
  })

  it('uppercases the method', () => {
    const cache = makeCache()
    expect(cache.generateCacheKey('/api/x', { method: 'post' })).toBe('POST|/api/x')
    expect(cache.generateCacheKey('/api/x', { method: 'Delete' })).toBe('DELETE|/api/x')
  })

  it('serializes params and body into the pipe-delimited key', () => {
    const cache = makeCache()
    const key = cache.generateCacheKey('/api/x', {
      method: 'GET',
      params: { a: 1 },
      body: { b: 2 }
    })
    expect(key).toBe('GET|/api/x|{"a":1}|{"b":2}')
  })

  it('drops empty params/body parts so there is no dangling pipe', () => {
    const cache = makeCache()
    // Only body, no params: the empty params slot must NOT leave `||`.
    const key = cache.generateCacheKey('/api/x', { body: { b: 2 } })
    expect(key).toBe('GET|/api/x|{"b":2}')
    expect(key).not.toContain('||')
  })

  it('is deterministic for identical inputs', () => {
    const cache = makeCache()
    const opts = { method: 'GET', params: { a: 1, b: 2 } }
    expect(cache.generateCacheKey('/api/x', opts)).toBe(cache.generateCacheKey('/api/x', opts))
  })

  it('produces DIFFERENT keys when param-key ORDER differs (JSON.stringify is order-sensitive)', () => {
    const cache = makeCache()
    const k1 = cache.generateCacheKey('/api/x', { params: { a: 1, b: 2 } })
    const k2 = cache.generateCacheKey('/api/x', { params: { b: 2, a: 1 } })
    // Documented behavior: object key order changes the serialized params slot,
    // so two semantically-equal param sets cache under different keys.
    expect(k1).not.toBe(k2)
    expect(k1).toBe('GET|/api/x|{"a":1,"b":2}')
    expect(k2).toBe('GET|/api/x|{"b":2,"a":1}')
  })
})

// ---------------------------------------------------------------------------
// Cache API path — set/get round-trip, TTL boundary, corrupt JSON
// ---------------------------------------------------------------------------
describe('Cache API backend', () => {
  it('does not flag localStorage fallback when caches is available', () => {
    installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    expect(cache.useLocalStorage).toBe(false)
  })

  it('round-trips set → get', async () => {
    installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('k1', { hello: 'world' })
    const got = await cache.get('k1')
    expect(got).toEqual({ hello: 'world' })
  })

  it('returns null for a key that was never set', async () => {
    installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    expect(await cache.get('missing')).toBeNull()
  })

  it('returns the entry when it is exactly at the TTL boundary (age === ttl, not > ttl)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'))
    installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('k', { v: 1 })

    // Advance exactly ttl ms. Guard is `now - ts > ttl`, so age === ttl survives.
    const ttl = 1000
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z').getTime() + ttl)
    expect(await cache.get('k', ttl)).toEqual({ v: 1 })
  })

  it('returns null AND deletes the entry one ms past the TTL boundary', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-06-01T00:00:00Z').getTime()
    vi.setSystemTime(start)
    const caches = installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('k', { v: 1 })

    const ttl = 1000
    vi.setSystemTime(start + ttl + 1) // age = ttl + 1 > ttl → expired
    expect(await cache.get('k', ttl)).toBeNull()

    // The expired entry must have been evicted, so a fresh read also misses.
    const store = caches._stores.get('test-cache')!
    expect(store.size).toBe(0)
  })

  it('honors the default 5-minute TTL', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-06-01T00:00:00Z').getTime()
    vi.setSystemTime(start)
    installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('k', { v: 1 })

    const fiveMin = 5 * 60 * 1000
    vi.setSystemTime(start + fiveMin) // exactly at boundary → still valid
    expect(await cache.get('k')).toEqual({ v: 1 })

    vi.setSystemTime(start + fiveMin + 1) // just past → expired
    expect(await cache.get('k')).toBeNull()
  })

  it('returns null on corrupt JSON in the cached response', async () => {
    const caches = installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    // Inject a bad body directly into the in-memory store at the matching url.
    // The store map is created lazily on caches.open(), so seed it ourselves.
    const url = `cache://test-cache/${encodeURIComponent('badkey')}`
    if (!caches._stores.has('test-cache')) caches._stores.set('test-cache', new Map())
    caches._stores.get('test-cache')!.set(url, { body: 'not-json{' })

    expect(await cache.get('badkey')).toBeNull()
  })

  it('remove() deletes a single Cache API entry', async () => {
    installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('a', { v: 1 })
    await cache.set('b', { v: 2 })
    await cache.remove('a')
    expect(await cache.get('a')).toBeNull()
    expect(await cache.get('b')).toEqual({ v: 2 })
  })

  it('clear() deletes the whole named cache', async () => {
    const caches = installCacheApiEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('a', { v: 1 })
    await cache.clear()
    expect(caches.delete).toHaveBeenCalledWith('test-cache')
    expect(caches._stores.has('test-cache')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// localStorage fallback path
// ---------------------------------------------------------------------------
describe('localStorage fallback backend', () => {
  it('uses the fallback (and logs info) when caches is absent from window', () => {
    installLocalStorageEnv()
    const cache = new ApiCache('test-cache')
    expect(cache.useLocalStorage).toBe(true)
  })

  it('writes under a cacheName-prefixed key', async () => {
    const ls = installLocalStorageEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('mykey', { v: 1 })
    expect(ls.setItem).toHaveBeenCalledWith('test-cache:mykey', expect.stringContaining('"v":1'))
    expect([...ls._map.keys()]).toContain('test-cache:mykey')
  })

  it('round-trips set → get through localStorage', async () => {
    installLocalStorageEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('mykey', { foo: 'bar' })
    expect(await cache.get('mykey')).toEqual({ foo: 'bar' })
  })

  it('expires localStorage entries past the TTL and removes them', async () => {
    vi.useFakeTimers()
    const start = new Date('2026-06-01T00:00:00Z').getTime()
    vi.setSystemTime(start)
    const ls = installLocalStorageEnv()
    const cache = new ApiCache('test-cache')
    await cache.set('mykey', { v: 1 })

    const ttl = 1000
    vi.setSystemTime(start + ttl + 1)
    expect(await cache.get('mykey', ttl)).toBeNull()
    expect(ls.removeItem).toHaveBeenCalledWith('test-cache:mykey')
  })

  it('clear() removes prefixed keys but leaves foreign (non-prefixed) keys intact', async () => {
    const ls = installLocalStorageEnv({
      'test-cache:a': '{"data":1,"timestamp":0}',
      'test-cache:b': '{"data":2,"timestamp":0}',
      'unrelated-key': 'keep-me',
      'other-cache:x': 'also-keep'
    })
    const cache = new ApiCache('test-cache')
    await cache.clear()

    const remaining = [...ls._map.keys()]
    expect(remaining).toContain('unrelated-key')
    expect(remaining).toContain('other-cache:x')
    expect(remaining).not.toContain('test-cache:a')
    expect(remaining).not.toContain('test-cache:b')
  })

  it('swallows a quota-exceeded throw from setItem (no error propagates)', async () => {
    const ls = installLocalStorageEnv()
    ls.setItem.mockImplementation(() => {
      const e = new Error('QuotaExceededError')
      e.name = 'QuotaExceededError'
      throw e
    })
    const cache = new ApiCache('test-cache')
    await expect(cache.set('mykey', { big: 'x' })).resolves.toBeUndefined()
  })

  it('returns null on corrupt JSON stored in localStorage', async () => {
    installLocalStorageEnv({ 'test-cache:bad': 'not-json{' })
    const cache = new ApiCache('test-cache')
    expect(await cache.get('bad')).toBeNull()
  })

  it('remove() deletes the prefixed key', async () => {
    const ls = installLocalStorageEnv({
      'test-cache:gone': '{"data":1,"timestamp":0}'
    })
    const cache = new ApiCache('test-cache')
    await cache.remove('gone')
    expect(ls.removeItem).toHaveBeenCalledWith('test-cache:gone')
  })
})

// ---------------------------------------------------------------------------
// SSR (window undefined) — every public method is a safe no-op / null
// ---------------------------------------------------------------------------
describe('SSR safety (window undefined)', () => {
  beforeEach(() => {
    // Make sure no window leaks in; node has no window by default but be explicit.
    vi.stubGlobal('window', undefined)
  })

  it('constructs without flagging localStorage fallback', () => {
    const cache = new ApiCache('test-cache')
    expect(cache.useLocalStorage).toBe(false)
  })

  it('get() resolves to null', async () => {
    const cache = new ApiCache('test-cache')
    expect(await cache.get('anything')).toBeNull()
  })

  it('set() resolves without throwing', async () => {
    const cache = new ApiCache('test-cache')
    await expect(cache.set('anything', { v: 1 })).resolves.toBeUndefined()
  })

  it('remove() and clear() resolve without throwing', async () => {
    const cache = new ApiCache('test-cache')
    await expect(cache.remove('x')).resolves.toBeUndefined()
    await expect(cache.clear()).resolves.toBeUndefined()
  })

  it('getStats() returns an empty zeroed shape', async () => {
    const cache = new ApiCache('test-cache')
    expect(await cache.getStats()).toEqual({ size: 0, entries: 0 })
  })
})

// ---------------------------------------------------------------------------
// Defaults & constant wiring
// ---------------------------------------------------------------------------
describe('cacheName wiring', () => {
  it('defaults the cacheName to CACHE_NAME from constants/app', () => {
    const cache = new ApiCache()
    expect(cache.cacheName).toBe(CACHE_NAME)
    expect(CACHE_NAME).toBe('wbm-band-api-cache')
  })

  it('accepts a custom cacheName', () => {
    const cache = new ApiCache('custom-name')
    expect(cache.cacheName).toBe('custom-name')
  })
})
