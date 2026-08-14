// @vitest-environment nuxt
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ContactsSection from '~/components/sections/ContactsSection.vue'

// The form posts to Web3Forms via the global fetch() and then reads
// response.json(). We replace globalThis.fetch with a controllable mock so we
// can drive the submit state machine (success / error / rejection) per test.
const okResponse = (success: boolean) => ({
  json: async () => ({ success })
})

// Fill the three required fields and submit the form. Returns the wrapper's
// submit promise so individual tests can interleave assertions while a submit
// is in flight (e.g. to observe the "sending" state before resolution).
const fillForm = async (w: any) => {
  await w.get('#name').setValue('Ada Lovelace')
  await w.get('#email').setValue('ada@example.com')
  await w.get('#message').setValue('Hello WBM')
}

describe('ContactsSection.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('static render', () => {
    it('renders the contact form with required name/email/message fields', async () => {
      const w = await mountSuspended(ContactsSection)
      const name = w.get('#name').element as HTMLInputElement
      const email = w.get('#email').element as HTMLInputElement
      const message = w.get('#message').element as HTMLTextAreaElement
      expect(name.required).toBe(true)
      expect(email.required).toBe(true)
      expect(email.type).toBe('email')
      expect(message.required).toBe(true)
    })

    it('renders the submit button enabled and idle by default', async () => {
      const w = await mountSuspended(ContactsSection)
      const btn = w.get('button[type="submit"]').element as HTMLButtonElement
      expect(btn.disabled).toBe(false)
    })

    it('shows neither success nor error message before any submit', async () => {
      const w = await mountSuspended(ContactsSection)
      expect(w.find('.form-message-success').exists()).toBe(false)
      expect(w.find('.form-message-error').exists()).toBe(false)
    })

    it('renders the mailto link using the configured contact email', async () => {
      const w = await mountSuspended(ContactsSection)
      const mailto = w.get('a.info-card-clickable')
      expect(mailto.attributes('href')).toBe('mailto:wbmbandofficial@gmail.com')
    })
  })

  describe('socialLinks computed', () => {
    it('renders Instagram, TikTok and YouTube links from config', async () => {
      const w = await mountSuspended(ContactsSection)
      const items = w.findAll('.social-link-item')
      expect(items).toHaveLength(3)
      const names = w.findAll('.social-name').map((n) => n.text())
      expect(names).toEqual(['Instagram', 'TikTok', 'YouTube'])
    })

    it('points each social link at its configured url and opens in a new tab', async () => {
      const w = await mountSuspended(ContactsSection)
      const items = w.findAll('.social-link-item')
      expect(items[0].attributes('href')).toBe('https://instagram.com/wbmband')
      expect(items[1].attributes('href')).toBe('https://tiktok.com/@wbmband')
      expect(items[2].attributes('href')).toBe('https://youtube.com/@wbmbandofficial')
      items.forEach((a) => {
        expect(a.attributes('target')).toBe('_blank')
        expect(a.attributes('rel')).toBe('noopener noreferrer')
      })
    })

    it('renders the configured social handles', async () => {
      const w = await mountSuspended(ContactsSection)
      const handles = w.findAll('.social-handle').map((h) => h.text())
      expect(handles).toEqual(['@wbmband', 'wbmband', 'wbmbandofficial'])
    })
  })

  describe('submit state machine', () => {
    it('flips isSubmitting true during submit and disables the button, then resets', async () => {
      let resolveFetch: (v: unknown) => void = () => {}
      ;(globalThis.fetch as any).mockReturnValue(
        new Promise((res) => {
          resolveFetch = res
        })
      )

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)

      const submit = w.get('form').trigger('submit')
      await w.vm.$nextTick()

      // In flight: button disabled and shows the "sending" label.
      // NOTE: these assert the UKRAINIAN copy because 'ua' is the app's real
      // defaultLocale, which is what this runtime now boots at. (It used to read
      // en.json because browser-language detection switched the suite to English
      // — the same mechanism that made Googlebot render the English home at `/`,
      // now switched off. See docs/search-console.md.)
      const btn = w.get('button[type="submit"]').element as HTMLButtonElement
      expect(btn.disabled).toBe(true)
      expect(w.get('button[type="submit"]').text()).toBe('Надсилання...')

      resolveFetch(okResponse(true))
      await submit
      // Let the handler's await chain (fetch → response.json → finally) drain.
      await vi.runAllTimersAsync()
      await w.vm.$nextTick()

      // Settled: button re-enabled and back to the idle label.
      const btnAfter = w.get('button[type="submit"]').element as HTMLButtonElement
      expect(btnAfter.disabled).toBe(false)
      expect(w.get('button[type="submit"]').text()).toBe('Надіслати')
    })

    it('posts the filled fields and access key to the Web3Forms endpoint', async () => {
      ;(globalThis.fetch as any).mockResolvedValue(okResponse(true))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()

      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      const [url, opts] = (globalThis.fetch as any).mock.calls[0]
      expect(url).toBe('https://api.web3forms.com/submit')
      expect(opts.method).toBe('POST')
      const body = JSON.parse(opts.body)
      expect(body.name).toBe('Ada Lovelace')
      expect(body.email).toBe('ada@example.com')
      expect(body.message).toBe('Hello WBM')
      expect(body.access_key).toBe('3d7d114e-f2cd-46db-8934-ba70907c3a07')
      expect(body.subject).toContain('Ada Lovelace')
    })
  })

  describe('double-submit guard', () => {
    it('ignores a second submit while the first is still in flight', async () => {
      ;(globalThis.fetch as any).mockReturnValue(new Promise(() => {}))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)

      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      // Second submit attempt while isSubmitting is still true.
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()

      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('success state', () => {
    it('shows the success message and hides the error message on result.success', async () => {
      ;(globalThis.fetch as any).mockResolvedValue(okResponse(true))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      await w.vm.$nextTick()

      expect(w.find('.form-message-success').exists()).toBe(true)
      expect(w.find('.form-message-error').exists()).toBe(false)
      expect(w.get('.form-message-success').text()).toContain('успішно надіслано')
    })

    it('clears the form fields after a successful submit', async () => {
      ;(globalThis.fetch as any).mockResolvedValue(okResponse(true))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      await w.vm.$nextTick()

      expect((w.get('#name').element as HTMLInputElement).value).toBe('')
      expect((w.get('#email').element as HTMLInputElement).value).toBe('')
      expect((w.get('#message').element as HTMLTextAreaElement).value).toBe('')
    })

    it('auto-hides the success message after the 5s timeout', async () => {
      ;(globalThis.fetch as any).mockResolvedValue(okResponse(true))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.find('.form-message-success').exists()).toBe(true)

      vi.advanceTimersByTime(5000)
      await w.vm.$nextTick()
      expect(w.find('.form-message-success').exists()).toBe(false)
    })
  })

  describe('error state', () => {
    it('shows the error message when result.success is false', async () => {
      ;(globalThis.fetch as any).mockResolvedValue(okResponse(false))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      await w.vm.$nextTick()

      expect(w.find('.form-message-error').exists()).toBe(true)
      expect(w.find('.form-message-success').exists()).toBe(false)
      expect(w.get('.form-message-error').text()).toContain('Щось пішло не так')
    })

    it('does NOT clear the form fields when the submit fails', async () => {
      ;(globalThis.fetch as any).mockResolvedValue(okResponse(false))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      await w.vm.$nextTick()

      expect((w.get('#name').element as HTMLInputElement).value).toBe('Ada Lovelace')
      expect((w.get('#email').element as HTMLInputElement).value).toBe('ada@example.com')
    })

    it('shows the error message when the fetch rejects (network error)', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      ;(globalThis.fetch as any).mockRejectedValue(new Error('network down'))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      await w.vm.$nextTick()

      expect(w.find('.form-message-error').exists()).toBe(true)
      expect(errSpy).toHaveBeenCalled()
    })

    it('re-enables the submit button after an error so the user can retry', async () => {
      ;(globalThis.fetch as any).mockResolvedValue(okResponse(false))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      await w.vm.$nextTick()

      const btn = w.get('button[type="submit"]').element as HTMLButtonElement
      expect(btn.disabled).toBe(false)
    })

    it('auto-hides the error message after the 5s timeout', async () => {
      ;(globalThis.fetch as any).mockResolvedValue(okResponse(false))

      const w = await mountSuspended(ContactsSection)
      await fillForm(w)
      await w.get('form').trigger('submit')
      await w.vm.$nextTick()
      await w.vm.$nextTick()
      expect(w.find('.form-message-error').exists()).toBe(true)

      vi.advanceTimersByTime(5000)
      await w.vm.$nextTick()
      expect(w.find('.form-message-error').exists()).toBe(false)
    })
  })
})
