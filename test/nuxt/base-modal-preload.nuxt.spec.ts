// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import BaseModal from '~/components/common/BaseModal.vue'

// Regression guard: on a sub-path deploy (GitHub Pages, baseURL=/WBM-Band-WebSite/)
// BaseModal's pre-decode Image() must request the BASE-PREFIXED url, not the raw
// /images/... (which 404s). Mock useAssetUrl to prefix like GitHub Pages and
// capture every Image src the component sets.
mockNuxtImport('useAssetUrl', () => () => ({
  resolveUrl: (p: string) =>
    typeof p === 'string' && p.startsWith('/') ? `/WBM-Band-WebSite${p}` : p,
  resolveSrcSet: (s: string) => s
}))

const captured: string[] = []

beforeEach(() => {
  captured.length = 0
  class FakeImage {
    #src = ''
    set src(v: string) {
      this.#src = v
      captured.push(v)
    }
    get src() {
      return this.#src
    }
    decode() {
      return Promise.resolve()
    }
  }
  vi.stubGlobal('Image', FakeImage)
})

afterEach(() => vi.unstubAllGlobals())

describe('BaseModal preload base-path resolution', () => {
  it('prefixes the pre-decode Image src with the app base URL', async () => {
    const w = await mountSuspended(BaseModal, {
      props: { isVisible: false, preloadImageUrl: '/seed.jpg' },
      slots: { default: 'body' }
    })
    captured.length = 0
    // Changing preloadImageUrl triggers the eager pre-decode watcher → decodeImage.
    await w.setProps({
      preloadImageUrl: '/images/optimized/albums-images/chorni-ptahy/cover.avif'
    })
    expect(captured).toContain(
      '/WBM-Band-WebSite/images/optimized/albums-images/chorni-ptahy/cover.avif'
    )
    // And never the unprefixed path that 404s on GitHub Pages.
    expect(captured.some((s) => s.startsWith('/images/'))).toBe(false)
  })
})
