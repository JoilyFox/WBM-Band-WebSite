// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import ErrorPage from '~/components/common/ErrorPage.vue'

// ErrorPage dependency classification:
//   AUTO-IMPORTS  → useRoute / useRouter (mockNuxtImport). useRoute drives the
//                   query>props>i18n precedence and the route.path === '/404'
//                   branch of errorCode; useRouter.push is the navigation target
//                   the action button hits (the nuxt env reports import.meta.client
//                   === true, so the component's client branch runs and useRouter()
//                   is called). useI18n is left REAL — locale 'ua' (uk.json) drives
//                   the default title/message/buttonText/support_hint strings.
//
// A single mutable `routeState` holds the route the mock returns; tests mutate it
// before mounting. `pushMock` captures router.push calls.

const { routeState, pushMock, routerStub } = vi.hoisted(() => {
  const pushMock = vi.fn(() => Promise.resolve())
  return {
    routeState: { query: {} as Record<string, unknown>, path: '/' },
    pushMock,
    // The router object the component (and the test-utils bootstrap) sees. It
    // MUST expose afterEach() — @nuxt/test-utils calls useRouter().afterEach()
    // during setup; a bare { push } stub breaks that bootstrap.
    routerStub: {
      push: pushMock,
      afterEach: () => () => {},
      beforeEach: () => () => {},
      replace: vi.fn(() => Promise.resolve())
    }
  }
})

mockNuxtImport('useRoute', () => () => routeState)
mockNuxtImport('useRouter', () => () => routerStub)

// Default Ukrainian strings (locale 'ua' → locales/uk.json `errors.*`). These are
// the verbatim values from the locale file; asserted where the i18n-default branch
// is the behaviour under test.
const UK = {
  defaultTitle: 'Ой! Щось пішло не так',
  defaultMessage:
    'Виникла неочікувана помилка. Спробуйте ще раз або поверніться на головну сторінку.',
  goHome: 'На головну',
  supportHint: 'Якщо проблема повторюється, зверніться до служби підтримки'
} as const

// useI18n is an EXPLICIT import in the component (`import { useI18n } from 'vue-i18n'`)
// destructured as `const { t } = useI18n()` (no `useScope: 'global'`). In this mount
// context that bare local-scope composer returns a non-functional `t`. We mock
// vue-i18n's useI18n to return a `t` that resolves the exact keys ErrorPage uses to
// the genuine Ukrainian strings (default locale 'ua'). Importing the JSON directly
// is avoided because the i18n build pre-compiles locale messages into AST objects,
// not plain strings.
const ERROR_STRINGS: Record<string, string> = {
  'errors.default_title': UK.defaultTitle,
  'errors.default_message': UK.defaultMessage,
  'errors.go_home': UK.goHome,
  'errors.support_hint': UK.supportHint
}

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ERROR_STRINGS[key] ?? key
  })
}))

beforeEach(() => {
  vi.clearAllMocks()
  routeState.query = {}
  routeState.path = '/'
})

describe('ErrorPage.vue', () => {
  describe('default rendering (no query, no props → i18n defaults)', () => {
    it('renders the Ukrainian default title and message', async () => {
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.error-title').text()).toBe(UK.defaultTitle)
      expect(w.get('.error-message').text()).toBe(UK.defaultMessage)
    })

    it('renders the default "go home" button text and the home icon', async () => {
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.button-text').text()).toBe(UK.goHome)
      expect(w.get('.button-icon').classes()).toContain('pi')
      expect(w.get('.button-icon').classes()).toContain('pi-home')
    })

    it('always renders the localized support hint', async () => {
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.info-text').text()).toContain(UK.supportHint)
    })

    it("derives errorCode 'ERR' for a generic (default) title", async () => {
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('ERR')
      // glitch layer mirrors the code via both text and data-text
      const glitch = w.get('.glitch-effect')
      expect(glitch.text()).toBe('ERR')
      expect(glitch.attributes('data-text')).toBe('ERR')
    })
  })

  describe('field precedence: query > props > i18n default', () => {
    it('uses props over the i18n default when no query is present', async () => {
      const w = await mountSuspended(ErrorPage, {
        props: {
          title: 'Prop Title',
          message: 'Prop message',
          buttonText: 'Prop Button',
          buttonIcon: 'pi pi-cog'
        }
      })
      expect(w.get('.error-title').text()).toBe('Prop Title')
      expect(w.get('.error-message').text()).toBe('Prop message')
      expect(w.get('.button-text').text()).toBe('Prop Button')
      expect(w.get('.button-icon').classes()).toContain('pi-cog')
    })

    it('uses query over both props and the i18n default', async () => {
      routeState.query = {
        title: 'Query Title',
        message: 'Query message',
        buttonText: 'Query Button',
        buttonIcon: 'pi pi-star'
      }
      const w = await mountSuspended(ErrorPage, {
        props: { title: 'Prop Title', message: 'Prop message', buttonText: 'Prop Button' }
      })
      expect(w.get('.error-title').text()).toBe('Query Title')
      expect(w.get('.error-message').text()).toBe('Query message')
      expect(w.get('.button-text').text()).toBe('Query Button')
      expect(w.get('.button-icon').classes()).toContain('pi-star')
    })

    it('resolves each field independently (query title + prop message + default button)', async () => {
      routeState.query = { title: 'Only Query Title' }
      const w = await mountSuspended(ErrorPage, { props: { message: 'Only Prop Message' } })
      expect(w.get('.error-title').text()).toBe('Only Query Title')
      expect(w.get('.error-message').text()).toBe('Only Prop Message')
      // buttonText falls through to the i18n default
      expect(w.get('.button-text').text()).toBe(UK.goHome)
    })
  })

  describe('action button rendering & navigation (buttonLink)', () => {
    it('renders the button by default (default buttonLink "/")', async () => {
      const w = await mountSuspended(ErrorPage)
      expect(w.find('.error-button').exists()).toBe(true)
    })

    it('hides the button when buttonLink prop is an empty string (maintenance mode)', async () => {
      const w = await mountSuspended(ErrorPage, { props: { buttonLink: '' } })
      expect(w.find('.error-button').exists()).toBe(false)
    })

    it('navigates via router.push to the default "/" on click', async () => {
      const w = await mountSuspended(ErrorPage)
      await w.get('.error-button').trigger('click')
      expect(pushMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/')
    })

    it('navigates to the prop-provided buttonLink on click', async () => {
      const w = await mountSuspended(ErrorPage, { props: { buttonLink: '/contact' } })
      await w.get('.error-button').trigger('click')
      expect(pushMock).toHaveBeenCalledWith('/contact')
    })

    it('navigates to the query-provided buttonLink (query wins over prop)', async () => {
      routeState.query = { buttonLink: '/from-query' }
      const w = await mountSuspended(ErrorPage, { props: { buttonLink: '/from-prop' } })
      await w.get('.error-button').trigger('click')
      expect(pushMock).toHaveBeenCalledWith('/from-query')
    })

    it('does not render the icon span when buttonIcon resolves empty', async () => {
      const w = await mountSuspended(ErrorPage, { props: { buttonIcon: '' } })
      expect(w.find('.button-icon').exists()).toBe(false)
      // the text span still renders inside the button
      expect(w.find('.button-text').exists()).toBe(true)
    })
  })

  describe('errorCode derivation', () => {
    it("derives '503' from a maintenance title (English keyword)", async () => {
      routeState.query = { title: 'Site Under Maintenance' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('503')
    })

    it("derives '503' from an 'under construction' title", async () => {
      routeState.query = { title: 'Under Construction' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('503')
    })

    it("derives '503' from the nominative Ukrainian maintenance title", async () => {
      // The source matches the stem 'обслуговуванн', so the nominative form works.
      routeState.query = { title: 'Технічне обслуговування триває' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('503')
    })

    it("derives '503' from the actual uk.json maintenance title (locative 'обслуговуванні')", async () => {
      // Fixed: the keyword is now the stem 'обслуговуванн', so locales/uk.json's real
      // maintenance title 'На технічному обслуговуванні' (locative, ...нні) matches.
      // Previously the check used the nominative 'обслуговування' (...ння) and missed.
      routeState.query = { title: 'На технічному обслуговуванні' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('503')
    })

    it("derives '404' from a 'Page Not Found' title", async () => {
      routeState.query = { title: 'Page Not Found' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('404')
    })

    it("derives '404' from the Ukrainian 'знайдено' keyword", async () => {
      routeState.query = { title: 'Сторінку не знайдено' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('404')
    })

    it("derives '404' from route.path === '/404' even with a generic title", async () => {
      routeState.path = '/404'
      const w = await mountSuspended(ErrorPage)
      // title is the generic i18n default (no 'not found' keyword) → path decides
      expect(w.get('.code-number').text()).toBe('404')
    })

    it("derives '500' from a 'Server Error' title", async () => {
      routeState.query = { title: 'Internal Server Error' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('500')
    })

    it("derives '403' from an 'Access Denied' title", async () => {
      routeState.query = { title: 'Access Denied' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('403')
    })

    it("falls back to 'ERR' for an unrecognized title", async () => {
      routeState.query = { title: 'Something Weird Happened' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('ERR')
    })

    it('prioritizes the maintenance branch (503) over not-found when both keywords appear', async () => {
      // 'maintenance' is checked before 'not found' in the source
      routeState.query = { title: 'Maintenance: page not found' }
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('503')
    })

    it("ignores route.path when it is not '/404' (generic title → ERR)", async () => {
      routeState.path = '/some/other/path'
      const w = await mountSuspended(ErrorPage)
      expect(w.get('.code-number').text()).toBe('ERR')
    })
  })

  describe('structural invariants', () => {
    it('always renders the decorative background and grid layers', async () => {
      const w = await mountSuspended(ErrorPage)
      expect(w.find('.bg-elements').exists()).toBe(true)
      expect(w.findAll('.floating-shape')).toHaveLength(4)
      expect(w.find('.grid-overlay').exists()).toBe(true)
      expect(w.find('.error-divider').exists()).toBe(true)
    })
  })
})
