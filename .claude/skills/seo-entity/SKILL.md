---
name: seo-entity
description: 'Use when working on AI-search/SEO discoverability: JSON-LD structured data (MusicGroup/MusicRecording/MusicComposition/BreadcrumbList), sameAs, hreflang/canonicals, per-locale ranking, lyrics-page keywords (слова/lyrics), titles/meta, or off-site MusicBrainz/Wikidata entity setup and entityProfiles in config/general.ts.'
---

## When to use

Editing JSON-LD / structured data, the band/release `sameAs`, hreflang / canonicals / per-locale ranking, lyrics-page or release-page titles & meta, the per-song "story" prose, or doing off-site entity work (MusicBrainz / Wikidata / DSP artist claims). For a new release, the on-site repo half pairs with `release-coordinator`; the off-site half is the recurring entity touch-up.

## Steps

1. Read the two docs below first — they are the source of truth; this skill is the map + the 2026 best-practice rules.
2. **On-site JSON-LD** lives only in `composables/useStructuredData.ts`. `useBandStructuredData()` is called once in `pages/index.vue`; `useReleaseStructuredData({ release, localizedTitle, metaImageUrl, variant })` in `pages/listen/[slug].vue` and `pages/lyrics/[slug].vue`. Add nodes here, never inline per-page.
3. **Per-page `<head>`** (title / description / canonical / hreflang / og) for release+lyrics pages lives in `composables/useReleaseHead.ts`; the home page sets its own in `pages/index.vue`. Keep canonical, hreflang and og:url internally consistent (see "Multilingual & canonical" below).
4. New profile URL? Add it to `config/general.ts` (`socialMedia` / `streamingPlatforms` / `entityProfiles`). It auto-flows into `sameAs` via `bandSameAs()` — empty strings are filtered out, so a placeholder never ships a broken target.
5. Per-song first-hand story → i18n key `releases.<slug>.story` (slug hyphens map to underscores). Renders BOTH into the MusicRecording `description` (machine channel) AND **visibly** on the `/listen` page via `<MusicStory>` (links view, full page only — excluded from the home modal). This real bilingual prose is the top on-page content lever — keep the visible text and the JSON-LD description in sync, and never fabricate it.
6. **Off-site (highest leverage):** follow `docs/entity-setup-guide.md` order — MusicBrainz (get MBID) → Wikidata (cite MBID via P434) → claim DSP profiles → reciprocal links. MBID+Q-ID then go into `entityProfiles`. (Both records already exist: MBID `62589d1f…`, Q140043384.)
7. Build + eyeball with `npm run generate`; grep the baked HTML for the changed signals and validate in Google's Rich Results test. Dev SSR does **not** hot-reload locale JSON — verify i18n/meta in the generate output, not `npm run dev`.

## Best-practice rules (2026, evidence-based)

### Multilingual & canonical (highest-leverage, easy to get silently wrong)

- **Each locale must self-canonicalize** so each language ranks in its own language. EN pages → canonical to their `/en/...` URL; UA pages → canonical to the **clean non-localized** URL (the `/lyrics/<slug>` & `/listen/<slug>` aliases are byte-copies of the `ua` route, so that clean URL is the UA hub). **Never point both locales at one canonical** — Google follows the canonical and _ignores hreflang on the deduped URL_, collapsing your two languages into one. This is why `useReleaseHead.ts` branches canonical on `locale`.
- **Reciprocal hreflang on every page in the cluster**, identical set, self-reference included: `uk-UA` → clean UA URL, `en-US` → `/en/...` URL, `x-default` → clean UA URL (UA is `defaultLocale`). If A and B don't both list each other, Google ignores the tags.
- **Route prefix `ua` ≠ hreflang language code.** The hreflang language code for Ukrainian is **`uk`** (`uk-UA`), never `ua`. `ua` alone is a country code and is invalid as a language. Easy silent bug.
- **Pick ONE hreflang method.** This site uses in-`<head>` `<link rel="alternate">` (home, policy, release, lyrics). The sitemap is for _discovery_ only — list each canonical URL (UA hub + the `/en/...` URL) with no `xhtml:link` duplication. Maintaining hreflang in both head and sitemap is extra surface for zero benefit.
- **Trailing-slash consistency:** canonical, internal links, hreflang and sitemap must agree on one form per URL (root `/` is the one exception — empty path ≡ `/`).
- `<html lang>` is per-locale (`uk-UA`/`en-US`, set in `app.vue`) — it's an **accessibility** signal; Google detects page language from content, not `lang`/hreflang. Set it right, don't expect ranking weight.

### Music & lyrics structured data

- **There is NO Google music/lyrics rich result** — none in the gallery. Music schema buys _entity understanding / Knowledge-Graph signal_, not a SERP card. The one earnable rich result on these pages is `BreadcrumbList`. Set expectations accordingly.
- **Lyrics modeling is already canonical — don't "fix" it.** `schema.org/lyrics` lives on **`MusicComposition`**, ranges to **`CreativeWork`** with `.text` (there is **no `LyricsType`**). Keep `MusicRecording → recordingOf → MusicComposition → lyrics:{CreativeWork, text}`. The band owns the lyrics, so embedding the text is fine.
- **Add `inLanguage`** to the composition + lyrics `CreativeWork` (the lyrics are Ukrainian → `'uk'`) — cheap language signal.
- **One band entity by stable `@id`** referenced everywhere via `byArtist` / `recordingOf` — the highest-value structural move; never declare a second MusicGroup.
- **`alternateName`** must carry every form people search, both scripts: `WBM`, `WBM Band`, **`ВБМ`** (Cyrillic). **`disambiguatingDescription`** on `MusicGroup` to fight the "WBM" acronym collision. **`sameAs`** to MusicBrainz/Wikidata/DSPs is the real lever (already wired).

### Lyrics-page ranking (your own pages vs Genius/Musixmatch)

- You can't out-authority Genius on head terms; the **winnable target is the branded long tail**: `«<song>» слова`, `вбм слова`, `wbm <song> lyrics`. You're the rights holder / canonical source — lean into that.
- **Lyric text must be server-rendered crawlable HTML** (SSG already does this — never move it behind JS-only rendering). One clear `<h1>` = the **localized** song title (not a static `release.title`; see Gotchas), an `<h2>` carrying the keyword (UA "Слова пісні" / EN "Lyrics"), section labels as `<h3>`.
- **Put the query token in title + a visible heading + meta.** UA pages need both "слова" and "текст пісні" present (title carries "слова", meta carries "текст пісні", H2 is "Слова пісні"); EN pages use "Lyrics" + "WBM".
- **Biggest content win = unique value-add prose** Genius can't have: the band's own meaning / recording notes / translation, in both locales, rendered visibly. Serves ranking, Genius-differentiation AND AI-answer citations at once. **Done for `/listen` via `<MusicStory>`** (reads `releases.<slug>.story`); the `/lyrics` page could gain its own distinct prose later.
- **Never keyword-stuff** `alternateName`/markup with unrelated big-artist names (Rap Genius was penalized for exactly this).

### Titles & meta hygiene

- Front-load the most important keyword; keep titles ~**50–60 chars**, descriptions ~**140–160** (description is a CTR lever, not a ranking factor). The home title must carry the brand handles (`WBM`, and `ВБМ` on the UA home) — the full name alone doesn't match acronym queries.
- `og:locale` uses **underscore** (`uk_UA` / `en_US`) — note this differs from hreflang's hyphen — plus `og:locale:alternate`. `og:url` should equal the page's canonical.
- Release/lyrics covers are **square**, so they keep `twitter:card: summary` (a `summary_large_image` would centre-crop). Only the global 1200×630 fallback uses `summary_large_image`. Don't "upgrade" the square ones.

## Myths / never-do (will waste time or backfire)

- ❌ `llms.txt`, AI-specific schema, content "chunking", Markdown page copies — unsupported by every major engine; Google debunks them.
- ❌ `Review` / `aggregateRating` — no genuine reviews exist; it's the **top trigger for a "Spammy structured markup" manual action**. Never add.
- ❌ `FAQPage` / `HowTo` — FAQ rich results were **retired May 2026**, HowTo gone since 2023. Don't chase a SERP feature with them.
- ❌ `meta keywords` — dead for ranking since ~2009.
- ❌ `WebSite` `SearchAction` (sitelinks searchbox) — deprecated Nov 2024, inert.
- ❌ `member` schema while `data/teamMembers.ts` uses `i.pravatar.cc` placeholders; ❌ singles as `MusicAlbum` (use `MusicRecording`); ❌ markup that doesn't match visible content.
- ⚠️ Never move head / meta / JSON-LD into `onMounted` / `import.meta.client` — AI crawlers run **zero JS**; you'd vanish from everything but Googlebot. Stays setup-level so SSG bakes it in.

## Source of truth

- `docs/ai-search-optimization-strategy.md` — strategy, audit, phased plan, the full "do NOT do" list. Read on demand.
- `docs/entity-setup-guide.md` — copy-paste MusicBrainz→Wikidata→DSP walkthrough, verified field values + Wikidata property IDs, recurring per-release checklist. Read on demand.

## Key files

- `composables/useStructuredData.ts` — `useBandStructuredData()` (MusicGroup + WebSite, home; `alternateName` incl. `ВБМ`, `disambiguatingDescription`) and `useReleaseStructuredData(opts)` (MusicRecording + `recordingOf`/MusicComposition.lyrics + `inLanguage` + BreadcrumbList); stable `@id`s, `bandSameAs()` filter, `jsonLd()` escaper.
- `composables/useReleaseHead.ts` — per-locale canonical (EN self / UA clean-hub), reciprocal `uk-UA`/`en-US`/`x-default` hreflang, og:url=canonical, og:locale, view-aware title/meta for listen⇄lyrics.
- `config/general.ts` — `generalConfig.{socialMedia,streamingPlatforms,entityProfiles,fullBandName,bandName}`; `entityProfiles.{musicbrainz,wikidata}` feed `sameAs`.
- `scripts/generate-sitemap.js` — discovery list (UA-hub + `/en/...` canonical URLs); host always `SITE_URL`.
- `components/music/Lyrics.vue` (H2 keyword) · `components/music/Story.vue` (`<MusicStory>` — visible per-song prose on `/listen`) · `components/music/MusicDetailContent.vue` (`displayTitle` — must resolve the **localized** H1, see Gotchas; `storyText` computed) · `locales/{uk,en}.json` (`music.detail.lyrics_*` / `about_title`, `app.home_title`, `releases.<slug>.story`).

## Gotchas

- ONE band entity by stable `@id` (`#band`); releases reference it, never declare a second MusicGroup. Name leads with "Woman Based Mechanics"; "WBM"/"ВБМ" are aliases only. Keep name/genre/`Kyiv`/romanization byte-identical everywhere (entity fragmentation).
- **Localized H1:** `displayTitle` must come from `t(releaseTitleKey)`, not the static `release.title` — `release.title` is a single string (e.g. `mania` = "Mania"), so a static-fallback H1 is wrong for one locale on every release. SSG bakes the per-locale value; `strategy:'prefix'` + `detectBrowserLanguage.redirectOn:'root'` keeps content-page locale stable between SSR and hydration (the non-localized alias resolves to default `ua`), so `t()` at SSR is hydration-safe — but verify in the browser (no hydration warning, no H1 flash).
- Off-site first, then `sameAs` — shipping schema against empty profile fields emits broken `sameAs`.
- Verify in `npm run generate` output, not `npm run dev` (dev SSR doesn't reload locale JSON; the non-localized `lyrics/`/`listen/` alias is the **ua** copy — check `en/...` for English strings).

## Related

- Skills: `add-release` (per-release JSON-LD is part of the release flow), `add-page-route` (i18n parity + prerender list + hreflang), `state-data-api` (`config/general.ts` `entityProfiles`).
- Agents in `.claude/agents/`: `release-coordinator`, `i18n-checker`.
- Commands: `npm run generate` (SSG output to validate), then Google Rich Results test on the baked HTML.
