// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { applyClarityConsent, setClarityTags, resetClarityForTests } from '~/utils/clarity'

const ID = 'abc123xyz'

// happy-dom's own URL setter; stubbing `location` does not reach window.location.
function setHost(hostname: string) {
  ;(window as unknown as { happyDOM: { setURL(url: string): void } }).happyDOM.setURL(
    `https://${hostname}/`
  )
}

const clarityScripts = () =>
  [...document.head.querySelectorAll('script')].filter((s) => s.src.includes('clarity.ms'))

beforeEach(() => {
  resetClarityForTests()
  document.head.innerHTML = ''
  setHost('www.wbmband.com')
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone) Safari/604.1', webdriver: false })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('applyClarityConsent', () => {
  it('loads nothing before consent is granted', () => {
    applyClarityConsent(ID, false)
    expect(clarityScripts()).toHaveLength(0)
    expect(window.clarity).toBeUndefined()
  })

  it('loads the tag once and sends a v2 consent signal on accept', () => {
    applyClarityConsent(ID, true)
    applyClarityConsent(ID, true)
    expect(clarityScripts()).toHaveLength(1)
    expect(clarityScripts()[0].src).toBe(`https://www.clarity.ms/tag/${ID}`)
    expect(window.clarity?.q?.[0]).toEqual([
      'consentv2',
      { ad_Storage: 'denied', analytics_Storage: 'granted' }
    ])
  })

  it('sends denied after a later decline', () => {
    applyClarityConsent(ID, true)
    applyClarityConsent(ID, false)
    expect(window.clarity?.q?.at(-1)).toEqual([
      'consentv2',
      { ad_Storage: 'denied', analytics_Storage: 'denied' }
    ])
  })

  it('stays off without a project id, on other hosts and for bots', () => {
    applyClarityConsent('', true)
    setHost('localhost')
    applyClarityConsent(ID, true)
    expect(clarityScripts()).toHaveLength(0)

    setHost('www.wbmband.com')
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 HeadlessChrome/120', webdriver: false })
    applyClarityConsent(ID, true)
    expect(clarityScripts()).toHaveLength(0)
  })

  it('replays attribution tags set before Clarity loaded', () => {
    setClarityTags({ source_platform: 'instagram', campaign_id: 'none' })
    applyClarityConsent(ID, true)
    expect(window.clarity?.q).toContainEqual(['set', 'source_platform', 'instagram'])
    expect(window.clarity?.q).toContainEqual(['set', 'campaign_id', 'none'])
  })
})
