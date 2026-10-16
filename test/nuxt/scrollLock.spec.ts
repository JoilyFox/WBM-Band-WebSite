import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lockPageScroll, unlockPageScroll, __resetPageScrollLock } from '../../utils/scrollLock'

// happy-dom has no layout, so model the two real-browser behaviours by hand:
//   gutter kept  → html's layout width does NOT change when body overflow goes hidden
//   gutter lost  → it widens by the scrollbar width
const SCROLLBAR = 15
const html = document.documentElement
const body = document.body

function mockLayout(opts: { keepsGutter: boolean }) {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440)
  vi.spyOn(html, 'clientWidth', 'get').mockReturnValue(1440 - SCROLLBAR)
  vi.spyOn(html, 'getBoundingClientRect').mockImplementation(() => {
    const locked = body.style.overflow === 'hidden'
    const width = locked && !opts.keepsGutter ? 1440 : 1440 - SCROLLBAR
    return { width } as DOMRect
  })
}

describe('lockPageScroll', () => {
  beforeEach(() => __resetPageScrollLock())
  afterEach(() => {
    unlockPageScroll()
    vi.restoreAllMocks()
  })

  it('keeps the gutter and pads nothing when the browser honours scrollbar-gutter', () => {
    mockLayout({ keepsGutter: true })
    lockPageScroll()
    expect(body.style.overflow).toBe('hidden')
    expect(body.style.paddingRight).toBe('')
    expect(html.style.getPropertyValue('--lock-sb')).toBe(`${SCROLLBAR}px`)
    expect(html.style.getPropertyValue('--lock-comp')).toBe('0px')
    expect(body.classList.contains('modal-open')).toBe(true)
  })

  it('pads <body> by the measured width when the gutter is lost (older Safari)', () => {
    mockLayout({ keepsGutter: false })
    lockPageScroll()
    expect(body.style.paddingRight).toBe(`${SCROLLBAR}px`)
    expect(html.style.getPropertyValue('--lock-comp')).toBe(`${SCROLLBAR}px`)
  })

  it('is a no-op for overlay scrollbars (zero width)', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440)
    vi.spyOn(html, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(html, 'getBoundingClientRect').mockReturnValue({ width: 1440 } as DOMRect)
    lockPageScroll()
    expect(body.style.paddingRight).toBe('')
    expect(html.style.getPropertyValue('--lock-sb')).toBe('0px')
    expect(html.style.getPropertyValue('--lock-comp')).toBe('0px')
  })

  it('restores everything on the last unlock and is reference counted', () => {
    mockLayout({ keepsGutter: false })
    body.style.overflow = 'auto'
    lockPageScroll()
    lockPageScroll()
    unlockPageScroll()
    expect(body.style.overflow).toBe('hidden') // still held by the first lock
    unlockPageScroll()
    expect(body.style.overflow).toBe('auto')
    expect(body.style.paddingRight).toBe('')
    expect(html.style.getPropertyValue('--lock-sb')).toBe('')
    expect(body.classList.contains('modal-open')).toBe(false)
    body.style.overflow = ''
  })

  it('ignores an unbalanced unlock', () => {
    unlockPageScroll()
    expect(body.style.overflow).toBe('')
  })
})
