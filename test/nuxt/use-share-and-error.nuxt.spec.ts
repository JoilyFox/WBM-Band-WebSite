// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useShareFunctionality } from '~/composables/useShareFunctionality'
import { useErrorPage } from '~/composables/useErrorPage'
import { useSnackbarStore } from '~/store/snackbar'

// ── Dependency classification ───────────────────────────────────────────────
// useShareFunctionality
//   EXPLICIT → useSnackbar (~/composables/useSnackbar, real Pinia store) and
//              useI18n (vue-i18n, LOCAL scope → throws outside setup). Both are
//              left REAL: we mount a tiny harness whose setup() calls the
//              composable and exposes its API, so useI18n resolves inside a
//              component instance. The bare nuxt runtime resolves i18n to
//              ENGLISH (locales/en.json) by default — copy_link_success /
//              copy_link_error are the strings the snackbar surfaces.
//   GLOBALS  → navigator.share / navigator.clipboard / document.execCommand
//              are stubbed per test with vi.stubGlobal / spies and restored.
//
// useErrorPage
//   AUTO-IMPORT → useRouter (mockNuxtImport). The composable calls
//                 router.push({ path: '/404', query }); the routerStub captures
//                 every push and MUST expose afterEach/beforeEach because the
//                 @nuxt/test-utils bootstrap calls useRouter().afterEach().
//                 NOTE: the CURRENT source uses useRouter + router.push, NOT
//                 navigateTo/useLocalePath — assertions target that behaviour.

// English snackbar strings (locales/en.json `snackbar.*`).
const COPY_OK = 'Link copied to clipboard!'
const COPY_ERR = 'Failed to copy link'

// useShareFunctionality imports useI18n EXPLICITLY from 'vue-i18n' (local scope).
// A bare local-scope composer throws ("Need to install with app.use") in this
// mount context, so we mock vue-i18n to return a `t` that resolves the two keys
// the composable uses to their verbatim English (default locale) strings. These
// are the exact values from locales/en.json `snackbar.*`.
const I18N_STRINGS: Record<string, string> = {
  'snackbar.copy_link_success': COPY_OK,
  'snackbar.copy_link_error': COPY_ERR
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => I18N_STRINGS[key] ?? key })
}))

// ── useErrorPage router mock ────────────────────────────────────────────────
const { pushMock, routerStub } = vi.hoisted(() => {
  const pushMock = vi.fn(() => Promise.resolve())
  return {
    pushMock,
    routerStub: {
      push: pushMock,
      replace: vi.fn(() => Promise.resolve()),
      afterEach: () => () => {},
      beforeEach: () => () => {}
    }
  }
})

mockNuxtImport('useRouter', () => () => routerStub)

// ── Share harness ───────────────────────────────────────────────────────────
// useI18n()/useSnackbar() need a setup()/component context. The harness calls the
// composable inside setup() and writes the returned API to a module-scoped holder
// the test reads after mount — more reliable than relying on `expose` surfacing on
// w.vm under mountSuspended.
type ShareApi = ReturnType<typeof useShareFunctionality>

let capturedApi: ShareApi | null = null

const ShareHarness = defineComponent({
  setup() {
    capturedApi = useShareFunctionality()
    return () => h('div')
  }
})

async function mountShare() {
  // A fresh active Pinia is installed in beforeEach, so useSnackbarStore() inside
  // the harness setup() and the store we read here are the same instance.
  capturedApi = null
  const w = await mountSuspended(ShareHarness)
  const store = useSnackbarStore()
  return { w, api: capturedApi as ShareApi, store }
}

// ── Global stub bookkeeping ─────────────────────────────────────────────────
let originalShare: unknown
let originalClipboard: unknown

beforeEach(() => {
  // Pristine Pinia per test so the snackbar store starts empty and order-independent.
  setActivePinia(createPinia())
  pushMock.mockClear()
  originalShare = (navigator as any).share
  originalClipboard = (navigator as any).clipboard
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  // Restore navigator surface in case a test deleted it outright.
  try {
    ;(navigator as any).share = originalShare
  } catch {
    /* read-only in some envs */
  }
  try {
    ;(navigator as any).clipboard = originalClipboard
  } catch {
    /* read-only in some envs */
  }
})

describe('useShareFunctionality', () => {
  describe('getCleanUrl', () => {
    it("strips the default 'from' query param while keeping other params", async () => {
      const { api } = await mountShare()
      window.history.replaceState({}, '', '/listen/song?from=instagram&utm=1')

      const clean = api.getCleanUrl()
      const url = new URL(clean)

      expect(url.searchParams.has('from')).toBe(false)
      expect(url.searchParams.get('utm')).toBe('1')
      expect(url.pathname).toBe('/listen/song')
    })

    it('strips a custom list of params when provided', async () => {
      const { api } = await mountShare()
      window.history.replaceState({}, '', '/x?from=a&utm=b&ref=c')

      const clean = api.getCleanUrl(['utm', 'ref'])
      const url = new URL(clean)

      // 'from' is NOT in the custom removal list, so it survives.
      expect(url.searchParams.get('from')).toBe('a')
      expect(url.searchParams.has('utm')).toBe(false)
      expect(url.searchParams.has('ref')).toBe(false)
    })

    it('is a no-op shape when there is nothing to strip', async () => {
      const { api } = await mountShare()
      window.history.replaceState({}, '', '/plain')

      const clean = api.getCleanUrl()
      const url = new URL(clean)
      expect(url.pathname).toBe('/plain')
      expect(url.search).toBe('')
    })

    it('returns empty string under SSR (window undefined)', async () => {
      const { api } = await mountShare()
      const realWindow = globalThis.window
      // Simulate the SSR guard `typeof window === 'undefined'`.
      vi.stubGlobal('window', undefined)
      try {
        expect(api.getCleanUrl()).toBe('')
      } finally {
        vi.stubGlobal('window', realWindow)
      }
    })
  })

  describe('getShareContent', () => {
    it('uses an explicit data.url verbatim across all returned fields', async () => {
      const { api } = await mountShare()
      const content = api.getShareContent({
        title: 'My Song',
        url: 'https://wbmband.com/listen/my-song'
      })

      expect(content.title).toBe('My Song')
      // shareMessage / displayText / url all collapse to the clean URL only.
      expect(content.url).toBe('https://wbmband.com/listen/my-song')
      expect(content.text).toBe('https://wbmband.com/listen/my-song')
      expect(content.displayText).toBe('https://wbmband.com/listen/my-song')
    })

    it('falls back to getCleanUrl (from-stripped) when no url is supplied', async () => {
      const { api } = await mountShare()
      window.history.replaceState({}, '', '/listen/abc?from=tg')

      const content = api.getShareContent({ title: 'Track' })
      const url = new URL(content.url)
      expect(url.searchParams.has('from')).toBe(false)
      expect(url.pathname).toBe('/listen/abc')
      // text mirrors the url (URL only, no extra title text).
      expect(content.text).toBe(content.url)
    })
  })

  describe('shareViaMobile ladder', () => {
    it('prefers navigator.share and resolves true on success', async () => {
      const { api } = await mountShare()
      const shareSpy = vi.fn(() => Promise.resolve())
      vi.stubGlobal('navigator', { ...navigator, share: shareSpy, clipboard: undefined })

      const ok = await api.shareViaMobile({ title: 'Hi', url: 'https://x.test/page' })

      expect(ok).toBe(true)
      expect(shareSpy).toHaveBeenCalledTimes(1)
      // Web Share API payload carries ONLY title + url (no `text`).
      expect(shareSpy).toHaveBeenCalledWith({ title: 'Hi', url: 'https://x.test/page' })
    })

    it('returns false when navigator.share rejects (user cancelled)', async () => {
      const { api, store } = await mountShare()
      const shareSpy = vi.fn(() => Promise.reject(new Error('AbortError')))
      vi.stubGlobal('navigator', { ...navigator, share: shareSpy, clipboard: undefined })

      const ok = await api.shareViaMobile({ title: 'Hi', url: 'https://x.test/page' })

      expect(ok).toBe(false)
      // A cancelled share does NOT fall through to clipboard, so no snackbar.
      expect(store.snackbars).toHaveLength(0)
    })

    it('falls back to clipboard when navigator.share is absent', async () => {
      const { api, store } = await mountShare()
      const writeText = vi.fn(() => Promise.resolve())
      vi.stubGlobal('navigator', {
        ...navigator,
        share: undefined,
        clipboard: { writeText }
      })

      const ok = await api.shareViaMobile({ title: 'Hi', url: 'https://x.test/p' })

      expect(ok).toBe(true)
      expect(writeText).toHaveBeenCalledWith('https://x.test/p')
      // clipboard success surfaces the English success snackbar.
      expect(store.snackbars.at(-1)?.message).toBe(COPY_OK)
      expect(store.snackbars.at(-1)?.type).toBe('success')
    })
  })

  describe('copyToClipboard ladder', () => {
    it('uses navigator.clipboard.writeText and shows the success snackbar', async () => {
      const { api, store } = await mountShare()
      const writeText = vi.fn(() => Promise.resolve())
      vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

      const ok = await api.copyToClipboard('copy-me')

      expect(ok).toBe(true)
      expect(writeText).toHaveBeenCalledWith('copy-me')
      expect(store.snackbars).toHaveLength(1)
      expect(store.snackbars[0].message).toBe(COPY_OK)
      expect(store.snackbars[0].type).toBe('success')
    })

    it('falls back to execCommand when clipboard API is unavailable', async () => {
      const { api, store } = await mountShare()
      vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
      const execSpy = vi.fn(() => true)
      // happy-dom has no execCommand; provide one and assert the fallback path.
      ;(document as any).execCommand = execSpy

      const ok = await api.copyToClipboard('legacy-text')

      expect(ok).toBe(true)
      expect(execSpy).toHaveBeenCalledWith('copy')
      // The temporary textarea is removed after the copy.
      expect(document.querySelector('textarea')).toBeNull()
      expect(store.snackbars[0].message).toBe(COPY_OK)
      expect(store.snackbars[0].type).toBe('success')
    })

    it('shows the error snackbar and returns false when writeText rejects', async () => {
      const { api, store } = await mountShare()
      const writeText = vi.fn(() => Promise.reject(new Error('denied')))
      vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

      const ok = await api.copyToClipboard('boom')

      expect(ok).toBe(false)
      expect(store.snackbars).toHaveLength(1)
      expect(store.snackbars[0].message).toBe(COPY_ERR)
      expect(store.snackbars[0].type).toBe('error')
    })

    it('shows the error snackbar when the execCommand fallback throws', async () => {
      const { api, store } = await mountShare()
      vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
      ;(document as any).execCommand = () => {
        throw new Error('execCommand unsupported')
      }

      const ok = await api.copyToClipboard('legacy-text')

      expect(ok).toBe(false)
      expect(store.snackbars[0].message).toBe(COPY_ERR)
      expect(store.snackbars[0].type).toBe('error')
    })
  })
})

describe('useErrorPage', () => {
  describe('redirectToError query construction', () => {
    it('pushes to /404 with ONLY the provided query keys', async () => {
      const { redirectToError } = useErrorPage()
      await redirectToError({ title: 'Boom', buttonLink: '/home' })

      expect(pushMock).toHaveBeenCalledTimes(1)
      const arg = pushMock.mock.calls[0][0] as { path: string; query: Record<string, string> }
      expect(arg.path).toBe('/404')
      // Only title + buttonLink were supplied; the rest are omitted entirely.
      expect(arg.query).toEqual({ title: 'Boom', buttonLink: '/home' })
      expect(Object.keys(arg.query).sort()).toEqual(['buttonLink', 'title'])
    })

    it('includes every key when all are provided', async () => {
      const { redirectToError } = useErrorPage()
      await redirectToError({
        title: 't',
        message: 'm',
        buttonText: 'bt',
        buttonLink: 'bl',
        buttonIcon: 'bi'
      })

      const arg = pushMock.mock.calls[0][0] as { query: Record<string, string> }
      expect(arg.query).toEqual({
        title: 't',
        message: 'm',
        buttonText: 'bt',
        buttonLink: 'bl',
        buttonIcon: 'bi'
      })
    })

    it('omits keys whose values are empty strings (falsy guard)', async () => {
      const { redirectToError } = useErrorPage()
      await redirectToError({ title: '', message: 'kept', buttonText: undefined })

      const arg = pushMock.mock.calls[0][0] as { query: Record<string, string> }
      // '' and undefined are both falsy → only the truthy `message` survives.
      expect(arg.query).toEqual({ message: 'kept' })
    })

    it('produces an empty query object when nothing is provided', async () => {
      const { redirectToError } = useErrorPage()
      await redirectToError({})

      const arg = pushMock.mock.calls[0][0] as { path: string; query: Record<string, string> }
      expect(arg.path).toBe('/404')
      expect(arg.query).toEqual({})
    })
  })

  describe('redirectTo404', () => {
    it('pushes the bare /404 string path', async () => {
      const { redirectTo404 } = useErrorPage()
      await redirectTo404()

      expect(pushMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/404')
    })
  })

  describe('preset redirect helpers', () => {
    it('redirectToDataError uses default message + refresh button', async () => {
      const { redirectToDataError } = useErrorPage()
      await redirectToDataError()

      const arg = pushMock.mock.calls[0][0] as { path: string; query: Record<string, string> }
      expect(arg.path).toBe('/404')
      expect(arg.query.title).toBe('Data Load Error')
      expect(arg.query.message).toBe(
        'Failed to load the requested data. Please check your connection and try again.'
      )
      expect(arg.query.buttonText).toBe('Try Again')
      expect(arg.query.buttonLink).toBe('/')
      expect(arg.query.buttonIcon).toBe('pi pi-refresh')
    })

    it('redirectToDataError honours a custom message override', async () => {
      const { redirectToDataError } = useErrorPage()
      await redirectToDataError('Custom failure copy')

      const arg = pushMock.mock.calls[0][0] as { query: Record<string, string> }
      expect(arg.query.message).toBe('Custom failure copy')
      // The other preset fields are untouched by the override.
      expect(arg.query.title).toBe('Data Load Error')
      expect(arg.query.buttonIcon).toBe('pi pi-refresh')
    })

    it('redirectToAccessError uses the Access Denied preset with home button', async () => {
      const { redirectToAccessError } = useErrorPage()
      await redirectToAccessError()

      const arg = pushMock.mock.calls[0][0] as { query: Record<string, string> }
      expect(arg.query.title).toBe('Access Denied')
      expect(arg.query.message).toContain('do not have permission')
      expect(arg.query.buttonText).toBe('Go to Home')
      expect(arg.query.buttonLink).toBe('/')
      expect(arg.query.buttonIcon).toBe('pi pi-home')
    })

    it('redirectToMaintenance uses the Under Maintenance preset', async () => {
      const { redirectToMaintenance } = useErrorPage()
      await redirectToMaintenance()

      const arg = pushMock.mock.calls[0][0] as { query: Record<string, string> }
      expect(arg.query.title).toBe('Under Maintenance')
      expect(arg.query.message).toBe(
        'This feature is currently under maintenance. Please check back later.'
      )
      expect(arg.query.buttonText).toBe('Go to Home')
      expect(arg.query.buttonLink).toBe('/')
      expect(arg.query.buttonIcon).toBe('pi pi-home')
    })

    it('every preset omits no key — all five query fields are present', async () => {
      const helpers = useErrorPage()
      const presets = [
        helpers.redirectToDataError,
        helpers.redirectToAccessError,
        helpers.redirectToMaintenance
      ]
      for (const preset of presets) {
        pushMock.mockClear()
        await preset()
        const arg = pushMock.mock.calls[0][0] as { query: Record<string, string> }
        expect(Object.keys(arg.query).sort()).toEqual([
          'buttonIcon',
          'buttonLink',
          'buttonText',
          'message',
          'title'
        ])
      }
    })
  })
})
