---
name: seo-entity
description: 'Use when working on AI-search/SEO discoverability, JSON-LD structured data (MusicGroup/MusicRecording/BreadcrumbList), sameAs, hreflang/canonicals, or off-site MusicBrainz/Wikidata entity setup and entityProfiles in config/general.ts.'
---

## When to use

Editing JSON-LD / structured data, the band/release `sameAs`, hreflang/canonicals, per-song "story" prose, or doing off-site entity work (MusicBrainz / Wikidata / DSP artist claims). For a new release, the on-site repo half pairs with `release-coordinator`; the off-site half is the recurring entity touch-up.

## Steps

1. Read the two docs below first — they are the source of truth; this skill is just a map.
2. **On-site JSON-LD** lives only in `composables/useStructuredData.ts`. `useBandStructuredData()` is called once in `pages/index.vue`; `useReleaseStructuredData({ release, localizedTitle, metaImageUrl })` in `pages/listen/[slug].vue`. Add nodes here, never inline per-page.
3. New profile URL? Add it to `config/general.ts` (`socialMedia` / `streamingPlatforms` / `entityProfiles`). It auto-flows into `sameAs` via `bandSameAs()` — empty strings are filtered out, so a placeholder never ships a broken target.
4. Per-song first-hand story → i18n key `releases.<slug>.story` (slug hyphens map to underscores). It renders **only** into the MusicRecording `description` (machine-only channel), not visible body text.
5. **Off-site (highest leverage):** follow `docs/entity-setup-guide.md` order — MusicBrainz (get MBID) → Wikidata (cite MBID via P434) → claim DSP profiles → reciprocal links. MBID+Q-ID then go into `entityProfiles`. (Both records already exist: MBID `62589d1f…`, Q140043384.)
6. Build + eyeball with `npm run generate`; validate the baked HTML in Google's Rich Results test.

## Source of truth

- `docs/ai-search-optimization-strategy.md` — strategy, audit, phased plan, the full "do NOT do" list. Read on demand.
- `docs/entity-setup-guide.md` — copy-paste MusicBrainz→Wikidata→DSP walkthrough, verified field values + Wikidata property IDs, recurring per-release checklist. Read on demand.

## Key files

- `composables/useStructuredData.ts` — `useBandStructuredData()` (MusicGroup + WebSite, home) and `useReleaseStructuredData(opts)` (MusicRecording + BreadcrumbList per release); stable `@id`s, `bandSameAs()` filter, `jsonLd()` escaper.
- `config/general.ts` — `generalConfig.{socialMedia,streamingPlatforms,entityProfiles,fullBandName,bandName}`; `entityProfiles.{musicbrainz,wikidata}` feed `sameAs`.

## Gotchas

- HARD GUARDRAIL: never add `llms.txt`, AI-specific schema, or **Review/AggregateRating** — the latter is the top trigger for a "Spammy structured markup" manual action.
- Everything stays setup-level so SSG bakes it into static HTML — AI crawlers run **zero JS**. Never move head/meta/JSON-LD into `onMounted`/`import.meta.client`.
- ONE band entity by stable `@id` (`#band`); releases reference it, never declare a second MusicGroup. Name leads with "Woman Based Mechanics"; "WBM" is alias only.
- No `member` schema while `data/teamMembers.ts` uses `i.pravatar.cc` placeholders. Singles use MusicRecording, never MusicAlbum. Markup must match visible content.
- Off-site first, then `sameAs` — shipping schema against empty profile fields emits broken `sameAs`. Keep name/genre/`Kyiv`/romanization byte-identical everywhere (entity fragmentation).

## Related

- Skills: `add-release` (per-release JSON-LD is part of the release flow), `state-data-api` (`config/general.ts` `entityProfiles`).
- Agents in `.claude/agents/`: `release-coordinator`, `i18n-checker`.
- Commands: `npm run generate` (SSG output to validate), then Google Rich Results test on the baked HTML.
