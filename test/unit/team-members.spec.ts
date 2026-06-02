import { describe, it, expect } from 'vitest'
import { teamMembers, type TeamMember } from '~/data/teamMembers'
import uk from '~/locales/uk.json'
import en from '~/locales/en.json'

// Drift-guard / data-integrity tests for the team roster (data/teamMembers.ts).
// These enforce invariants across ALL members so the suite fails loudly if
// someone adds a member with a duplicate id, a blank/mis-shaped key, an
// untranslated nameKey/roleKey, or an empty image path.

const toArray = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

// Resolve a dot-notation i18n key against a (possibly nested) locale object.
const resolveKey = (locale: Record<string, unknown>, key: string): unknown =>
  key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, locale)

describe('teamMembers data integrity', () => {
  it('exports a non-empty array of members', () => {
    expect(Array.isArray(teamMembers)).toBe(true)
    expect(teamMembers.length).toBeGreaterThan(0)
  })

  it('gives every member a unique numeric id', () => {
    const ids = teamMembers.map((m) => m.id)
    for (const id of ids) {
      expect(typeof id).toBe('number')
      expect(Number.isFinite(id)).toBe(true)
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every member a non-empty nameKey and roleKey', () => {
    for (const m of teamMembers) {
      expect(typeof m.nameKey).toBe('string')
      expect(m.nameKey.trim().length).toBeGreaterThan(0)
      expect(typeof m.roleKey).toBe('string')
      expect(m.roleKey.trim().length).toBeGreaterThan(0)
    }
  })

  it('uses the team.members.<slug>.{name|role} key convention', () => {
    for (const m of teamMembers) {
      expect(m.nameKey).toMatch(/^team\.members\.[a-z0-9_]+\.name$/)
      expect(m.roleKey).toMatch(/^team\.members\.[a-z0-9_]+\.role$/)
    }
  })

  it('keeps nameKey/roleKey distinct per member', () => {
    for (const m of teamMembers) {
      expect(m.nameKey).not.toBe(m.roleKey)
    }
  })

  it('has at least one main image and no blank image paths', () => {
    for (const m of teamMembers) {
      const main = toArray(m.mainImages)
      expect(main.length).toBeGreaterThan(0)
      const all = [...main, ...toArray(m.hoverImages)]
      for (const path of all) {
        expect(typeof path).toBe('string')
        expect(path.trim().length).toBeGreaterThan(0)
        // Either an app-absolute asset path or a fully-qualified URL — never relative junk.
        expect(path).toMatch(/^(\/|https?:\/\/)/)
      }
    }
  })

  it('has no duplicate image paths within a single member', () => {
    for (const m of teamMembers) {
      const all = [...toArray(m.mainImages), ...toArray(m.hoverImages)]
      expect(new Set(all).size).toBe(all.length)
    }
  })

  it('has no placeholder/TODO/example tokens in i18n keys', () => {
    const forbidden = /(placeholder|example|todo|fixme|lorem|sample|dummy|changeme)/i
    for (const m of teamMembers) {
      expect(m.nameKey).not.toMatch(forbidden)
      expect(m.roleKey).not.toMatch(forbidden)
    }
  })

  it('resolves every nameKey/roleKey to a non-empty string in BOTH locales', () => {
    for (const m of teamMembers) {
      for (const key of [m.nameKey, m.roleKey]) {
        const ukVal = resolveKey(uk as Record<string, unknown>, key)
        const enVal = resolveKey(en as Record<string, unknown>, key)
        expect(typeof ukVal, `uk.json missing ${key}`).toBe('string')
        expect((ukVal as string).trim().length, `uk.json empty ${key}`).toBeGreaterThan(0)
        expect(typeof enVal, `en.json missing ${key}`).toBe('string')
        expect((enVal as string).trim().length, `en.json empty ${key}`).toBeGreaterThan(0)
      }
    }
  })

  it('matches the declared TeamMember shape at runtime', () => {
    for (const m of teamMembers as TeamMember[]) {
      const allowed = new Set(['id', 'nameKey', 'roleKey', 'mainImages', 'hoverImages'])
      for (const key of Object.keys(m)) {
        expect(allowed.has(key), `unexpected field "${key}"`).toBe(true)
      }
      const mainOk = typeof m.mainImages === 'string' || Array.isArray(m.mainImages)
      expect(mainOk).toBe(true)
      if (m.hoverImages !== undefined) {
        const hoverOk = typeof m.hoverImages === 'string' || Array.isArray(m.hoverImages)
        expect(hoverOk).toBe(true)
      }
    }
  })
})
