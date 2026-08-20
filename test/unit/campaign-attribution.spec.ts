import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  CAMPAIGN_STORAGE_KEY,
  NO_CAMPAIGN,
  detectCampaignFromSearch,
  getOrPersistCampaign,
  normalizeCampaignId,
  resetCampaign,
  setExplicitCampaign
} from '~/utils/campaignAttribution'

// Map-backed fake matching the Storage surface the code touches. Mirrors the
// helper in source-attribution-persistence.spec.ts on purpose — the two
// attribution layers are deliberately independent modules.
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
    })
  }
}

function stubBrowser(opts: { search?: string; initialStore?: Record<string, string> } = {}) {
  const sessionStorage = makeSessionStorage(opts.initialStore)
  vi.stubGlobal('window', {
    location: { search: opts.search ?? '' },
    sessionStorage
  })
  return sessionStorage
}

describe('normalizeCampaignId', () => {
  it('accepts an already-canonical id unchanged', () => {
    expect(normalizeCampaignId('khvyli-kyiv-music-0821')).toBe('khvyli-kyiv-music-0821')
  })

  it('repairs case, spaces and underscores so a mistyped published link still works', () => {
    expect(normalizeCampaignId('Khvyli_Kyiv Music 0821')).toBe('khvyli-kyiv-music-0821')
  })

  it('collapses separator runs and trims the edges', () => {
    expect(normalizeCampaignId('--khvyli///promo--')).toBe('khvyli-promo')
  })

  it('caps the length without leaving a trailing separator', () => {
    const id = normalizeCampaignId(`${'a'.repeat(39)}-tail`)
    expect(id).toBe('a'.repeat(39))
  })

  it('returns null for empty / unusable input', () => {
    expect(normalizeCampaignId('')).toBeNull()
    expect(normalizeCampaignId(null)).toBeNull()
    expect(normalizeCampaignId('---')).toBeNull()
    // A leading non-alphanumeric is stripped, not rejected outright
    expect(normalizeCampaignId('!!!promo')).toBe('promo')
  })
})

describe('detectCampaignFromSearch', () => {
  it('reads the short ?c= param', () => {
    expect(detectCampaignFromSearch('?c=khvyli-promin-0821')).toBe('khvyli-promin-0821')
  })

  it('works without the leading question mark', () => {
    expect(detectCampaignFromSearch('c=khvyli-promo')).toBe('khvyli-promo')
  })

  it('falls back to utm_campaign so standard UTM links still attribute', () => {
    expect(detectCampaignFromSearch('?utm_source=ig&utm_campaign=Khvyli_Promo')).toBe(
      'khvyli-promo'
    )
  })

  it('prefers ?c= over utm_campaign when both are present', () => {
    expect(detectCampaignFromSearch('?c=short-id&utm_campaign=other-id')).toBe('short-id')
  })

  it('returns null when there is no campaign in the query', () => {
    expect(detectCampaignFromSearch('')).toBeNull()
    expect(detectCampaignFromSearch('?foo=bar')).toBeNull()
    expect(detectCampaignFromSearch('?c=')).toBeNull()
  })
})

describe('getOrPersistCampaign', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('is a no-op returning "none" on the server', () => {
    expect(getOrPersistCampaign()).toBe(NO_CAMPAIGN)
  })

  it('detects from the url and persists it for the rest of the session', () => {
    const ss = stubBrowser({ search: '?c=khvyli-promin-0821' })
    expect(getOrPersistCampaign()).toBe('khvyli-promin-0821')
    expect(ss.setItem).toHaveBeenCalledWith(CAMPAIGN_STORAGE_KEY, 'khvyli-promin-0821')
  })

  it('returns the stored id once the query string is gone (post-redirect)', () => {
    stubBrowser({
      search: '',
      initialStore: { [CAMPAIGN_STORAGE_KEY]: 'khvyli-promin-0821' }
    })
    expect(getOrPersistCampaign()).toBe('khvyli-promin-0821')
  })

  it('lets a second campaign link re-attribute mid-session', () => {
    const ss = stubBrowser({
      search: '?c=second-campaign',
      initialStore: { [CAMPAIGN_STORAGE_KEY]: 'first-campaign' }
    })
    expect(getOrPersistCampaign()).toBe('second-campaign')
    expect(ss.store.get(CAMPAIGN_STORAGE_KEY)).toBe('second-campaign')
  })

  it('reports "none" — never persisted — for untagged traffic', () => {
    const ss = stubBrowser({ search: '' })
    expect(getOrPersistCampaign()).toBe(NO_CAMPAIGN)
    expect(ss.setItem).not.toHaveBeenCalled()
  })

  it('accepts an explicit search string instead of reading window', () => {
    stubBrowser({ search: '?c=from-window' })
    expect(getOrPersistCampaign('?c=from-argument')).toBe('from-argument')
  })

  it('survives sessionStorage throwing (Safari private mode)', () => {
    vi.stubGlobal('window', {
      location: { search: '?c=khvyli-promo' },
      sessionStorage: {
        getItem: () => {
          throw new Error('denied')
        },
        setItem: () => {
          throw new Error('denied')
        },
        removeItem: () => {
          throw new Error('denied')
        }
      }
    })
    expect(() => getOrPersistCampaign()).not.toThrow()
    expect(getOrPersistCampaign()).toBe('khvyli-promo')
  })
})

describe('setExplicitCampaign / resetCampaign', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('stores a normalized id', () => {
    const ss = stubBrowser()
    setExplicitCampaign('Radio Promin 0821')
    expect(ss.store.get(CAMPAIGN_STORAGE_KEY)).toBe('radio-promin-0821')
  })

  it('ignores an unusable id rather than storing junk', () => {
    const ss = stubBrowser()
    setExplicitCampaign('---')
    expect(ss.setItem).not.toHaveBeenCalled()
  })

  it('clears the stored campaign', () => {
    const ss = stubBrowser({ initialStore: { [CAMPAIGN_STORAGE_KEY]: 'khvyli-promo' } })
    resetCampaign()
    expect(ss.store.has(CAMPAIGN_STORAGE_KEY)).toBe(false)
  })
})
