import { describe, it, expect } from 'vitest'
import navigationDefault, {
  leftNavigation,
  rightNavigation,
  footerNavigation,
  navigationConfig
} from '~/config/navigation'
import uk from '~/locales/uk.json'
import en from '~/locales/en.json'

// Every exported nav array, by name, so the drift-guards below run over all of them.
const namedArrays = {
  leftNavigation,
  rightNavigation,
  footerNavigation,
  navigationConfig
}

const allArrays = [...leftNavigation, ...rightNavigation, ...footerNavigation]

// Resolve a dot-notation key (e.g. 'nav.music') against a locale object.
const lookup = (obj, key) => key.split('.').reduce((acc, part) => acc && acc[part], obj)

describe('navigation exports — shape', () => {
  it('every exported nav value is a non-empty array', () => {
    for (const [name, arr] of Object.entries(namedArrays)) {
      expect(Array.isArray(arr), `${name} should be an array`).toBe(true)
      expect(arr.length, `${name} should be non-empty`).toBeGreaterThan(0)
    }
  })

  it('the default export is footerNavigation (via navigationConfig alias)', () => {
    expect(navigationDefault).toBe(navigationConfig)
    expect(navigationConfig).toBe(footerNavigation)
  })

  it('every nav item has a string label and a string elementId', () => {
    for (const item of allArrays) {
      expect(typeof item.label).toBe('string')
      expect(item.label.length).toBeGreaterThan(0)
      expect(typeof item.elementId).toBe('string')
      expect(item.elementId.length).toBeGreaterThan(0)
    }
  })
})

describe('navigation composition invariant', () => {
  it('footerNavigation deep-equals [...leftNavigation, ...rightNavigation]', () => {
    expect(footerNavigation).toEqual([...leftNavigation, ...rightNavigation])
  })

  it('footerNavigation length equals left + right combined', () => {
    expect(footerNavigation.length).toBe(leftNavigation.length + rightNavigation.length)
  })

  it('footerNavigation contains exactly the left and right items, in order', () => {
    const expected = [...leftNavigation, ...rightNavigation]
    footerNavigation.forEach((item, i) => {
      expect(item.label).toBe(expected[i].label)
      expect(item.elementId).toBe(expected[i].elementId)
    })
  })
})

describe('navigation uniqueness (drift guard)', () => {
  // footerNavigation is the union of left + right, so dedup over the union covers all.
  it('no duplicate elementId across left + right navigation', () => {
    const union = [...leftNavigation, ...rightNavigation]
    const ids = union.map((item) => item.elementId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no duplicate label across left + right navigation', () => {
    const union = [...leftNavigation, ...rightNavigation]
    const labels = union.map((item) => item.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('each individual nav array is internally free of duplicate elementIds', () => {
    for (const [name, arr] of Object.entries(namedArrays)) {
      const ids = arr.map((item) => item.elementId)
      expect(new Set(ids).size, `${name} has duplicate elementId`).toBe(ids.length)
    }
  })
})

describe('navigation label keys (i18n drift guard)', () => {
  it("every label follows the 'nav.<segment>' key format", () => {
    const keyFormat = /^nav\.[a-z0-9_]+$/
    for (const item of allArrays) {
      expect(item.label, `${item.label} should match nav.<key>`).toMatch(keyFormat)
    }
  })

  it('every label key resolves to a non-empty string in uk.json (default locale)', () => {
    for (const item of footerNavigation) {
      const value = lookup(uk, item.label)
      expect(typeof value, `${item.label} missing in uk.json`).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('every label key resolves to a non-empty string in en.json', () => {
    for (const item of footerNavigation) {
      const value = lookup(en, item.label)
      expect(typeof value, `${item.label} missing in en.json`).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
