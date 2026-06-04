# AI Search & SEO Optimization Strategy

Strategy for improving how the WBM Band site is discovered and cited by Google
Search, Google **AI Overviews / AI Mode**, and AI assistants (ChatGPT, Perplexity,
Claude, Gemini). Written after reviewing Google's official
[AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
plus independent deep research (sources at the bottom).

> **TL;DR** — For this site, "AI optimization" is just **SEO + entity-building**.
> Ignore the GEO/AEO cottage industry (no `llms.txt`, no AI-specific schema, no
> content "chunking"). The foundation here is already strong; the real marginal
> gains are **(1) bilingual signalling, (2) music-entity presence
> (MusicBrainz/Wikidata + claimed DSP artist profiles), (3) one minimal JSON-LD
> layer, and above all (4) the first-hand story behind each song** — the one
> thing only the band can write, and the thing Google says matters most.

---

## 1. What Google's guide actually says

The guide's central claim: AI Overviews and AI Mode are **"rooted in our core
Search ranking and quality systems"** — they use RAG + query fan-out over the
_same_ index as classic Search. So there is **no separate "AI" surface to
optimize for**: be indexed, be snippet-eligible, be genuinely useful.

It is roughly **85% repackaged classic SEO, 15% genuinely new** — and the new
15% is mostly **what to STOP doing**. Google explicitly debunks:

- `llms.txt` / AI text files / Markdown copies of pages — **not needed**.
- Content "chunking" for AI — **no such requirement**.
- Special schema "for AI" — **structured data is not required for AI features**.
- Writing "in a special way for generative AI" — write for humans.
- Chasing inauthentic "mentions."

**The single most important positive line:** create _"unique, compelling, useful,
non-commodity"_ content with first-hand experience and a point of view — Google
calls this more influential than every other suggestion combined.

**Verdict:** read it once as a **myth-buster**, not a checklist. Its blind spot
is that it ignores this site's two defining traits — **bilingual** and
**music-entity** — which is exactly where the real work is.

---

## 2. Where the site stands (audit)

### Already strong (don't touch)

- True **SSG** → real crawlable HTML with meta baked in at setup-level. AI
  search crawlers (GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot) run **zero
  JavaScript**, so prerendered HTML is what matters — and the site passes.
- Clean **canonical discipline** on `/listen/<source>/<slug>` attribution
  variants (`noindex, follow` + canonical to the clean URL).
- Generated `sitemap.xml`, sensible allow-all `robots.txt` (correct
  max-discovery posture), per-release bilingual descriptions, real `<h1>`.

### Gaps (priority order)

| #   | Gap                                                                                                                                                                                                                                                                                                                                                                                                                                       | Severity                 | Why it matters                                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ~~**No off-site entity presence** — no MusicBrainz, no Wikidata; `streamingPlatforms.spotify/appleMusic/youtubeMusic` in `config/general.ts` are empty strings~~ **✅ Done (2026)** — MusicBrainz MBID + Wikidata Q-id created and wired into `config/general.ts` `entityProfiles`; the DSP links are populated. All now flow into the `MusicGroup` JSON-LD `sameAs`. See [entity-setup-guide.md](./entity-setup-guide.md) "What's done." | ~~**Highest**~~ resolved | The Knowledge Graph that feeds _every_ AI assistant + Google panels is built from cross-source consensus, **not your markup**. Free, off-codebase, and you have none of it. |
| 2   | **Bilingual signalling broken** — no `hreflang`, no per-locale `<html lang>`, no i18n `baseUrl`                                                                                                                                                                                                                                                                                                                                           | **High**                 | Ukrainian-_default_ (Cyrillic) pages mis-signal as English/undefined; `ua`/`en` compete as duplicates.                                                                      |
| 3   | **No self-referential canonical** on the clean `/listen/{slug}` despite the same content at `/ua/…`, `/en/…`, and root `/listen/…`                                                                                                                                                                                                                                                                                                        | High                     | Splits ranking signals across 3 identical URLs.                                                                                                                             |
| 4   | **Zero JSON-LD**                                                                                                                                                                                                                                                                                                                                                                                                                          | Medium                   | Cheap entity hygiene + breadcrumb (the one earnable rich result). _Sequencing caveat below._                                                                                |
| 5   | **Thin `/listen` pages** — cover + h1 + one sentence + a dead "Lyrics" button                                                                                                                                                                                                                                                                                                                                                             | Medium-High              | Can't out-answer Spotify/Genius; the #1 Google-endorsed lever, and only the band can write it.                                                                              |
| 6   | **"WBM" acronym collision**                                                                                                                                                                                                                                                                                                                                                                                                               | Medium                   | AI defaults to the most-cited meaning; "Woman Based Mechanics" is the only unique handle.                                                                                   |
| 7   | **Auto-generated keyword-salad** in `useMasterPage.ts`                                                                                                                                                                                                                                                                                                                                                                                    | Low (real risk)          | Google ignores the keywords meta; near-duplicate brand-spelling lists are a low-quality pattern.                                                                            |

---

## 3. The governing insight

**For a 3-single indie band, your own site will rarely be _the_ cited source.**
Citations come from third-party consensus (MusicBrainz, Wikidata, YouTube,
press). So the highest-ROI work is **off** the codebase; on-site work is entity
hygiene that _points at_ it.

> **Sequencing rule:** do the off-site profiles **first**, then add JSON-LD
> `sameAs` pointing at the real URLs. Shipping schema against the empty
> Spotify/Apple fields would emit **broken `sameAs` targets**, which is worse
> than no schema.

---

## 4. Phased plan

### Phase 1 — Quick wins (in-repo, low-risk) ✅ DONE

Implemented (see [§6](#6-phase-1-changelog)):

- Deleted the keyword-meta system everywhere.
- Per-locale `<html lang>` (`uk-UA` / `en-US`) in `app.vue`.
- i18n `baseUrl = SITE_URL` (prerequisite for Phase 2 hreflang).
- Self-referential canonicals on `/listen/{slug}`, home, and policy pages.
- Replaced the generic global meta description + dropped the global keywords meta.
- Branded 1200×630 social-card fallback + `summary_large_image`.
- Removed the dead `useLocaleHead` import in `privacy-policy.vue`.

### Phase 2 — Structural (in-repo) — JSON-LD + hreflang ✅ DONE

**Done** (commit `12a01fa`): `composables/useStructuredData.ts` — `MusicGroup` +
`WebSite` on the home page and `MusicRecording` + `BreadcrumbList` per release,
all with a single stable `@id`, `sameAs` filtered to real URLs only, and **no**
`member`/`Review`; reciprocal `hreflang` (`uk-UA`/`en-US`/`x-default`) on the
home + policy pages (release pages keep their single non-localized canonical, so
no hreflang there — canonical and hreflang stay consistent). Phase 3 prep:
`config.entityProfiles { musicbrainz, wikidata }` (empty, filtered out of
`sameAs` until the off-site records exist).

**Deferred — need real data / first-hand content (NOT to be fabricated):**
replacing the `i.pravatar.cc` placeholder band members (then add `member`
schema), and writing the per-song story prose.

Remaining detail (for reference):

- **Reciprocal `hreflang`** (`uk-UA` / `en-US` / `x-default`). Coupled to the
  canonical-localization decision and the sitemap — do holistically, not
  piecemeal. (`baseUrl` already landed in Phase 1.)
- **Replace the `i.pravatar.cc` placeholder band members** in
  `data/teamMembers.ts` **before** any member schema ships.
- **One centralized `composables/useStructuredData.ts`**:
  - `MusicGroup` (+ `WebSite`) on home/about — single stable `@id`,
    `name: 'Woman Based Mechanics'`, `alternateName: ['WBM Band','WBM']`,
    `disambiguatingDescription`, `genre`, `foundingLocation: Kyiv, UA`,
    `sameAs` = **only real, non-empty, back-linking** profile URLs.
  - `MusicRecording` + `BreadcrumbList` per `/listen/{slug}` (reference the band
    by `@id`; reuse `.jpg`-normalized images; match visible content exactly).
- **Write a 2–3 paragraph real story per song** in both locales, render as
  on-page text, and wire/remove the dead Lyrics button. _(Highest-value content
  work.)_
- **Disambiguation copy:** lead with "Woman Based Mechanics," demote "WBM" to an
  alias; surface member names as crawlable text.

### Phase 3 — Off-site entity graph (mostly off-repo, highest leverage)

> **Full step-by-step walkthrough → [entity-setup-guide.md](./entity-setup-guide.md)**
> — tailored, copy-paste-ready MusicBrainz → Wikidata → DSP-claim guide with
> verified field values and Wikidata property IDs.

- **⏱ Time-sensitive (before the next release):** lock the exact distributor
  artist string `Woman Based Mechanics` + one ISRC per recording. Name/ISRC
  drift makes DSPs split you into two artist profiles — painful to merge after.
- Create **MusicBrainz** entry → then a **Wikidata** item citing the MBID (clears
  Wikidata notability with _no press needed_) with `en`+`uk` labels +
  transliteration aliases — fixes the acronym/Cyrillic fragmentation in one place.
- Claim **Spotify for Artists / Apple Music for Artists / YouTube Official Artist
  Channel** via the distributor → backfill the empty links in
  `config/general.ts` → _then_ add them to `sameAs`.
- Later, only when earned: legacy DBs (Discogs/Last.fm/RYM), then **Wikipedia**
  (don't write it prematurely — it'll be deleted for lacking notability).

---

## 5. Exclude / could-backfire (what NOT to do)

**Deliberately exclude (cargo-cult or wrong for this site):**

- ❌ `llms.txt` — Google explicitly won't use it; a 300k-domain study found
  **zero** citation correlation; logs show bots don't fetch it. The only
  pro-`llms.txt` source is a vendor selling the service.
- ❌ AI-specific schema / chunking / Markdown copies — Google debunks all of these.
- ❌ `WebSite` `SearchAction` (sitelinks searchbox) — deprecated Nov 2024, inert.
- ❌ `FAQPage` / `HowTo` schema — FAQ rich results retired May 2026; HowTo gone since 2023.
- ❌ Writing a Wikipedia article now — fails `WP:NMUSIC`; premature = deleted.
- ❌ Per-bot `Allow` stanzas in `robots.txt` — identical to today's allow-all; documentation theater.
- ❌ Vendor "AI-visibility scores" / the famous GEO percentages — those came from a 2023 _simulated_ GPT-3.5 engine, not live ChatGPT/Perplexity.

**Could actively backfire — guard against:**

- ⚠️ `Review` / `aggregateRating` schema — the #1 trigger for a site-wide
  "Spammy structured markup" manual action (no genuine reviews exist). **Never add.**
- ⚠️ Shipping the `i.pravatar.cc` placeholder members or empty `sameAs` into JSON-LD.
- ⚠️ Markup ≠ visible content (don't assert lyrics/credits the page doesn't render).
- ⚠️ Moving any meta / canonical / JSON-LD into `onMounted` / `import.meta.client` —
  AI crawlers run zero JS; you'd go invisible to everything but Googlebot. **Hard rule:
  all head/meta stays setup-level so SSG bakes it into the static HTML.**
- ⚠️ Wrapping singles in `MusicAlbum` (content/markup mismatch — use `MusicRecording`).

---

## 6. Phase 1 changelog

| File                                                         | Change                                                                                                                                                                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `composables/useMasterPage.ts`                               | Removed `buildKeywords()`, `BASE_KEYWORDS`, the Cyrillic transliteration map, the `keywords` computed + interface field + return value.                                                                  |
| `pages/index.vue`                                            | Removed the local keyword list + `keywords` meta; added self-canonical (`pageUrl`).                                                                                                                      |
| `pages/listen/[slug].vue`                                    | Removed `keywords`; added self-canonical to the **non-localized** `${SITE_URL}/listen/{slug}` (matches sitemap + attribution-variant convention).                                                        |
| `pages/listen/[source]/[slug].vue`                           | Removed `keywords` (canonical was already present).                                                                                                                                                      |
| `pages/{privacy-policy,terms-of-service,cookies-policy}.vue` | Removed `keywords`; added localized self-canonical; removed the dead `useLocaleHead` import (privacy).                                                                                                   |
| `nuxt.config.ts`                                             | Added `baseUrl: SITE_URL` to i18n; replaced the generic global description; dropped the global `keywords`; set `author` to the full name; branded 1200×630 social-card fallback + `summary_large_image`. |
| `app.vue`                                                    | Per-locale `<html lang>` via `useHead` (`ua→uk-UA`, `en→en-US`).                                                                                                                                         |

**Deliberate deviation from the research:** release pages keep
`twitter:card: summary` (their cover art is **square** — `summary_large_image`
would centre-crop it). Only the global _fallback_ card uses the 1200×630
`summary_large_image`.

**Deliberate scope boundary:** reciprocal `hreflang` _alternate links_ were
deferred to Phase 2 because they're coupled to the localized-vs-non-localized
canonical strategy and the sitemap; adding them piecemeal now would create a
canonical/hreflang inconsistency. `baseUrl` (harmless on its own) landed now as
the prerequisite.

---

## 7. Honest expectations

- JSON-LD will **not** "unlock" AI citations — Google says so outright. Add it
  for entity hygiene + the breadcrumb rich result, not as a growth hack.
- `hreflang` mostly helps **classic Google/Bing** (and therefore Gemini/Copilot);
  ChatGPT/Perplexity/Claude largely **ignore** it and collapse to the most
  authoritative (often English) version. Keep it correct, don't over-rely on it.
- A pure 1:1 Ukrainian translation risks **"semantic collapse"** (never
  retrieved). To get the UA version cited it needs genuinely distinct value
  (Ukrainian-market context, UA-language press, UA Wikidata labels).
- **Measure** by directly asking ChatGPT/Perplexity/Gemini/Claude
  "who is Woman Based Mechanics?" + the latest release name, and check host logs
  for AI user-agents. There is no reliable AEO rank-tracker.

---

## Sources

Google primary docs:

- [AI features and your website](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Structured data search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)
- [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Sitelinks search box deprecation](https://developers.google.com/search/blog/2024/10/sitelinks-search-box)

GEO/AEO evidence:

- [Princeton/IIT-Delhi GEO paper (arXiv 2311.09735)](https://arxiv.org/abs/2311.09735)
- [SE Ranking: llms.txt across 300k domains (via SEJ)](https://www.searchenginejournal.com/llms-txt-shows-no-clear-effect-on-ai-citations-based-on-300k-domains/561542/)
- [Google does not endorse llms.txt](https://www.seroundtable.com/google-does-not-endorse-llms-txt-40789.html)
- [Ahrefs: what is llms.txt](https://ahrefs.com/blog/what-is-llms-txt/)
- [AI search + hreflang / multilingual queries](https://www.gsqi.com/marketing-blog/ai-search-hreflang-multilingual-queries/)

AI crawlers:

- [OpenAI bots](https://developers.openai.com/api/docs/bots)
- [Anthropic crawler controls](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [JS rendering & AI crawlers](https://www.getpassionfruit.com/blog/javascript-rendering-and-ai-crawlers-can-llms-read-your-spa)

Music entity / Knowledge Graph:

- [MusicBrainz ↔ Wikidata](https://musicbrainz.org/doc/Wikidata)
- [Wikidata notability](https://www.wikidata.org/wiki/Wikidata:Notability)
- [Knowledge Graph for musicians](https://dittomusic.com/en/blog/how-to-get-a-google-knowledge-graph-for-musicians)
- [Band schema markup](https://bandzoogle.com/blog/how-to-optimize-your-band-schema)
- [Spammy structured markup penalty](https://penaltyhammer.com/unmasking-the-google-spammy-structured-markup-penalty-a-definitive-guide)

---

_Last updated: 2026-06-02. Phases 1–2 implemented (lang/canonicals/keyword-cleanup + JSON-LD/hreflang, live on staging). Deferred for real data: band-member schema + per-song stories. Phase 3 (off-site entity graph) pending._
