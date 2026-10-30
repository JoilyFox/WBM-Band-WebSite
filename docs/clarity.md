# Microsoft Clarity — heatmaps and session recordings

Clarity (clarity.microsoft.com, free, no session cap) shows where visitors click,
how far they scroll and replays individual sessions. It complements GA4: GA4
counts, Clarity shows.

## How it is wired

| Piece                                   | Role                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `nuxt.config.ts` → `CLARITY_PROJECT_ID` | The project id (Clarity → Settings → Overview). Empty = off.                  |
| `runtimeConfig.public.clarityProjectId` | Same build gate as `gtag.enabled`: dev and GitHub Pages staging get `''`.     |
| `utils/clarity.ts`                      | Loads the tag, sends Consent API v2, replays custom tags.                     |
| `composables/useCookieConsent.ts`       | Calls `applyClarityConsent()` on accept / decline / hydrate.                  |
| `plugins/analytics.client.ts`           | `setClarityTags({ source_platform, campaign_id })` — same attribution as GA4. |

**Consent.** Unlike GA4 (loads for everyone, cookieless until consent), Clarity
is **not loaded at all until the visitor accepts** the cookie toast: it records
the session itself. Right after the snippet we send
`clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' })`.
Clarity has enforced a consent signal for EEA/UK/CH traffic since 2025-10-31. A
later decline sends `analytics_Storage: 'denied'`; the script unloads on the
next page load.

**Who is recorded.** Production hosts only (`utils/productionHosts.ts`) and no
bots (`isLikelyBot`). Clarity has no internal-traffic filter, so a local
`npx serve` of a production build must never load it.

**Filtering recordings.** The custom tags `source_platform` (instagram, tiktok,
…) and `campaign_id` appear under Filters → Custom tags, so you can watch only
the sessions that came from one bio link.

## Clarity project settings (dashboard)

- Masking: keep **Balanced** (default) — form inputs are masked.
- Setup → Google Analytics integration: link property `G-Z8QRF6TWC2` to jump
  from GA4 segments into recordings.
- Settings → Consent mode: on (default for EEA).

## Legal copy

Privacy and Cookie policies (`pages.privacy.*`, `pages.cookies.*`) and the toast
text name GA4 and Clarity and their cookies (`_ga`, `_ga_*`, `_clck`, `_clsk`).
Update them, and `general.legal.*LastUpdated`, whenever a tracker is added or
removed.
