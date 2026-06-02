import { describe, it, expect } from 'vitest'
import uk from '~/locales/uk.json'
import en from '~/locales/en.json'
import { musicLibrary } from '~/data/musicLibrary'
import { teamMembers } from '~/data/teamMembers'
import { footerNavigation, leftNavigation, rightNavigation } from '~/config/navigation'

// ---------------------------------------------------------------------------
// Locale parity / i18n drift guard.
//
// These tests are the ONLY net for the silent-fallback failure mode (audit
// defect #4): vue-i18n falls back to the *key string* when a translation is
// missing, so an untranslated key renders as e.g. "releases.alina.title" with
// no error. We catch that at build/test time by asserting both locales expose
// an IDENTICAL flattened key set (minus a tightly-scoped pluralization
// whitelist) and that every *Key referenced from data/config actually resolves
// to a non-empty string leaf in BOTH locales.
// ---------------------------------------------------------------------------

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

// Recursively flatten an object to dot-notation leaf paths. Arrays are treated
// as leaves (the locale files contain none, but this keeps the flattener honest
// rather than silently descending into array indices).
const flattenKeys = (obj: Json, prefix = ''): string[] => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return prefix ? [prefix] : []
  }
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return flattenKeys(value as Json, path)
  })
}

// Collect every leaf path whose string value is empty / whitespace-only.
const emptyStringLeaves = (obj: Json, prefix = ''): string[] => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    if (typeof obj === 'string' && obj.trim() === '') return [prefix]
    return []
  }
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return emptyStringLeaves(value as Json, path)
  })
}

// Resolve a dot-notation key against a locale object; returns the leaf value or
// undefined if any segment is missing or the path bottoms out on a non-leaf.
const resolveKey = (obj: Json, key: string): Json | undefined => {
  return key.split('.').reduce<Json | undefined>((acc, segment) => {
    if (acc === null || typeof acc !== 'object' || Array.isArray(acc)) return undefined
    return (acc as { [k: string]: Json })[segment]
  }, obj)
}

const ukJson = uk as unknown as Json
const enJson = en as unknown as Json

const ukKeys = flattenKeys(ukJson)
const enKeys = flattenKeys(enJson)
const ukKeySet = new Set(ukKeys)
const enKeySet = new Set(enKeys)

// Legitimate, hand-verified pluralization divergences. Ukrainian uses
// one/few/many plural forms for the countdown unit nouns, whereas English uses
// one/other. These are the ONLY keys allowed to differ between the two files.
// Anything outside this whitelist is a genuine translation gap.
const UK_ONLY_PLURAL_WHITELIST = new Set([
  'music.days_remaining.days_2_4',
  'music.days_remaining.days_many',
  'music.days_remaining.hours_2_4',
  'music.days_remaining.hours_many',
  'music.days_remaining.minutes_2_4',
  'music.days_remaining.minutes_many'
])
const EN_ONLY_PLURAL_WHITELIST = new Set([
  'music.days_remaining.days',
  'music.days_remaining.hours',
  'music.days_remaining.minutes'
])

describe('locale flattener (sanity)', () => {
  it('flattens nested objects to dot-notation leaf paths', () => {
    const sample: Json = { a: { b: 'x', c: { d: 'y' } }, e: 'z' }
    expect(flattenKeys(sample).sort()).toEqual(['a.b', 'a.c.d', 'e'])
  })

  it('produces a non-trivial number of keys for each locale', () => {
    expect(ukKeys.length).toBeGreaterThan(100)
    expect(enKeys.length).toBeGreaterThan(100)
  })

  it('emits no duplicate flattened keys within a single locale', () => {
    expect(ukKeySet.size).toBe(ukKeys.length)
    expect(enKeySet.size).toBe(enKeys.length)
  })
})

describe('uk ↔ en key-set parity', () => {
  it('every uk key (outside the plural whitelist) exists in en', () => {
    const missingInEn = ukKeys.filter((k) => !enKeySet.has(k) && !UK_ONLY_PLURAL_WHITELIST.has(k))
    expect(missingInEn).toEqual([])
  })

  it('every en key (outside the plural whitelist) exists in uk', () => {
    const missingInUk = enKeys.filter((k) => !ukKeySet.has(k) && !EN_ONLY_PLURAL_WHITELIST.has(k))
    expect(missingInUk).toEqual([])
  })

  it('the ONLY uk-exclusive keys are the whitelisted Ukrainian plural forms', () => {
    const ukOnly = ukKeys.filter((k) => !enKeySet.has(k))
    expect(new Set(ukOnly)).toEqual(UK_ONLY_PLURAL_WHITELIST)
  })

  it('the ONLY en-exclusive keys are the whitelisted English plural forms', () => {
    const enOnly = enKeys.filter((k) => !ukKeySet.has(k))
    expect(new Set(enOnly)).toEqual(EN_ONLY_PLURAL_WHITELIST)
  })

  it('the shared key set is identical once whitelisted plurals are removed', () => {
    const ukShared = ukKeys.filter((k) => !UK_ONLY_PLURAL_WHITELIST.has(k)).sort()
    const enShared = enKeys.filter((k) => !EN_ONLY_PLURAL_WHITELIST.has(k)).sort()
    expect(ukShared).toEqual(enShared)
  })

  it('every whitelisted plural form actually exists in its own locale', () => {
    // Guards the whitelist against rot: a whitelisted key that no longer exists
    // would silently mask a real divergence elsewhere.
    for (const key of UK_ONLY_PLURAL_WHITELIST) {
      expect(ukKeySet.has(key), `uk missing whitelisted plural ${key}`).toBe(true)
    }
    for (const key of EN_ONLY_PLURAL_WHITELIST) {
      expect(enKeySet.has(key), `en missing whitelisted plural ${key}`).toBe(true)
    }
  })
})

describe('no empty-string leaf values', () => {
  it('uk has no empty / whitespace-only translations', () => {
    expect(emptyStringLeaves(ukJson)).toEqual([])
  })

  it('en has no empty / whitespace-only translations', () => {
    expect(emptyStringLeaves(enJson)).toEqual([])
  })

  it('every leaf value in both locales is a non-empty string', () => {
    for (const key of ukKeys) {
      const value = resolveKey(ukJson, key)
      expect(typeof value, `uk[${key}] not a string`).toBe('string')
      expect((value as string).trim().length, `uk[${key}] empty`).toBeGreaterThan(0)
    }
    for (const key of enKeys) {
      const value = resolveKey(enJson, key)
      expect(typeof value, `en[${key}] not a string`).toBe('string')
      expect((value as string).trim().length, `en[${key}] empty`).toBeGreaterThan(0)
    }
  })
})

// Assert a data-referenced i18n key resolves to a non-empty string in BOTH
// locales. This is the assertion that actually catches the silent fallback —
// a missing key would resolve to undefined here, not to the key string.
const expectKeyInBothLocales = (key: string) => {
  const ukValue = resolveKey(ukJson, key)
  const enValue = resolveKey(enJson, key)
  expect(typeof ukValue, `uk missing ${key}`).toBe('string')
  expect((ukValue as string).trim().length, `uk empty ${key}`).toBeGreaterThan(0)
  expect(typeof enValue, `en missing ${key}`).toBe('string')
  expect((enValue as string).trim().length, `en empty ${key}`).toBeGreaterThan(0)
}

describe('musicLibrary i18n keys resolve in both locales', () => {
  it('has at least one release to check', () => {
    expect(musicLibrary.length).toBeGreaterThan(0)
  })

  it('every release titleKey resolves in uk and en', () => {
    for (const release of musicLibrary) {
      // titleKey is optional in the type; every current record sets it. If a
      // record ever omits it, we still must not silently skip — assert present.
      expect(release.titleKey, `release ${release.slug} has no titleKey`).toBeTruthy()
      expectKeyInBothLocales(release.titleKey as string)
    }
  })

  it('every release descriptionKey (when present) resolves in uk and en', () => {
    for (const release of musicLibrary) {
      if (release.descriptionKey) {
        expectKeyInBothLocales(release.descriptionKey)
      }
    }
  })

  it('every *Key field on a release points at a real translation', () => {
    // Drift guard: catch any future field whose name ends in "Key" and holds a
    // dotted i18n path, so adding a new *Key to the data shape is covered too.
    for (const release of musicLibrary) {
      for (const [field, value] of Object.entries(release)) {
        if (field.endsWith('Key') && typeof value === 'string' && value.includes('.')) {
          expectKeyInBothLocales(value)
        }
      }
    }
  })
})

describe('teamMembers i18n keys resolve in both locales', () => {
  it('has at least one team member to check', () => {
    expect(teamMembers.length).toBeGreaterThan(0)
  })

  it('every member nameKey resolves in uk and en', () => {
    for (const member of teamMembers) {
      expect(member.nameKey, `member ${member.id} has no nameKey`).toBeTruthy()
      expectKeyInBothLocales(member.nameKey)
    }
  })

  it('every member roleKey resolves in uk and en', () => {
    for (const member of teamMembers) {
      expect(member.roleKey, `member ${member.id} has no roleKey`).toBeTruthy()
      expectKeyInBothLocales(member.roleKey)
    }
  })

  it('every *Key field on a member points at a real translation', () => {
    for (const member of teamMembers) {
      for (const [field, value] of Object.entries(member)) {
        if (field.endsWith('Key') && typeof value === 'string' && value.includes('.')) {
          expectKeyInBothLocales(value)
        }
      }
    }
  })
})

describe('navigation label keys resolve in both locales', () => {
  it('combines left + right into footer navigation', () => {
    expect(footerNavigation.length).toBe(leftNavigation.length + rightNavigation.length)
    expect(footerNavigation.length).toBeGreaterThan(0)
  })

  it('every nav label resolves in uk and en', () => {
    for (const item of footerNavigation) {
      expect(item.label, 'nav item missing label').toBeTruthy()
      expectKeyInBothLocales(item.label)
    }
  })

  it('left and right nav labels each resolve in both locales', () => {
    for (const item of [...leftNavigation, ...rightNavigation]) {
      expectKeyInBothLocales(item.label)
    }
  })
})
