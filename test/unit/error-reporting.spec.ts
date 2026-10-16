import { describe, it, expect, vi } from 'vitest'
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_EXCEPTIONS_PER_PAGE,
  createErrorReporter,
  describeError,
  scrubMessage
} from '../../utils/errorReporting'

describe('scrubMessage', () => {
  it('replaces URLs and e-mail addresses', () => {
    expect(scrubMessage('failed https://wbmband.com/listen/x?c=abc for bob@example.com')).toBe(
      'failed [url] for [email]'
    )
  })

  it('collapses whitespace', () => {
    expect(scrubMessage('  a \n\t b  ')).toBe('a b')
  })
})

describe('describeError', () => {
  it('prefixes the source and keeps the class name + message', () => {
    expect(describeError(new TypeError('x is undefined'), 'vue')).toBe(
      'vue:TypeError: x is undefined'
    )
  })

  it('never includes the stack', () => {
    const e = new Error('boom')
    e.stack = 'Error: boom\n    at secret (/Users/someone/file.ts:1:1)'
    expect(describeError(e, 'vue')).not.toContain('someone')
  })

  it('handles strings, plain objects and nullish rejections', () => {
    expect(describeError('plain string', 'promise')).toBe('promise:Error: plain string')
    expect(describeError({ name: 'AbortError', message: 'aborted' }, 'promise')).toBe(
      'promise:AbortError: aborted'
    )
    expect(describeError(undefined, 'promise')).toBe('promise:Error')
    expect(describeError(null, 'promise')).toBe('promise:Error')
  })

  it('survives a hostile object with throwing getters', () => {
    const hostile = new Proxy(
      {},
      {
        get() {
          throw new Error('nope')
        }
      }
    )
    expect(() => describeError(hostile, 'vue')).not.toThrow()
  })

  it('caps the length', () => {
    expect(describeError(new Error('x'.repeat(500)), 'vue').length).toBe(MAX_DESCRIPTION_LENGTH)
  })
})

describe('createErrorReporter', () => {
  it('sends a description once, dropping exact repeats', () => {
    const send = vi.fn()
    const report = createErrorReporter(send)
    expect(report(new Error('same'), 'vue')).toBe(true)
    expect(report(new Error('same'), 'vue')).toBe(false)
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith('vue:Error: same')
  })

  it('treats the same message from a different source as distinct', () => {
    const send = vi.fn()
    const report = createErrorReporter(send)
    report(new Error('m'), 'vue')
    report(new Error('m'), 'promise')
    expect(send).toHaveBeenCalledTimes(2)
  })

  it(`caps the page at ${MAX_EXCEPTIONS_PER_PAGE} events`, () => {
    const send = vi.fn()
    const report = createErrorReporter(send)
    for (let i = 0; i < 20; i++) report(new Error(`distinct ${i}`), 'vue')
    expect(send).toHaveBeenCalledTimes(MAX_EXCEPTIONS_PER_PAGE)
  })

  it('never lets a throwing sender escape', () => {
    const report = createErrorReporter(() => {
      throw new Error('gtag exploded')
    })
    expect(() => report(new Error('x'), 'vue')).not.toThrow()
  })
})
