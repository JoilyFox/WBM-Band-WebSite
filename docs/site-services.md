# Site services — registry and health checks

Every external service wbmband.com depends on or reports to: what it does, where to
log in, which IDs it uses, where those IDs and secrets live, and how to check it still
works. Start here when you have forgotten how something is wired.

**No secret values in this file.** Secrets are named by location only.

Last full review: **2026-10-30**.

## At a glance

| Service                | What for                                                                    | Console                                                 | Account                                                     | Key IDs                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Hosting (OVH VPS)      | Serves the static site via nginx                                            | SSH                                                     | `root@151.80.140.64`, key `~/.ssh/wbm_deploy`               | site root `/var/www/wbmband`                                                                                          |
| DNS / registrar        | `wbmband.com` zone                                                          | adm.tools (Hosting Ukraine)                             | owner's Hosting Ukraine login                               | NS `a.ns.express`, `b.ns.works`, `c.ns.gold`                                                                          |
| Staging                | Preview of `main`                                                           | GitHub Pages                                            | GitHub `JoilyFox`                                           | `/WBM-Band-WebSite/`                                                                                                  |
| Google Analytics 4     | Traffic, conversions (`release_view`, `platform_click`), source attribution | analytics.google.com                                    | wbmbandofficial@gmail.com                                   | property **WBM Website** `523582426`, stream `G-Z8QRF6TWC2` (the "WBM Band" property `G-T4G4XTP2QZ` is stale, ignore) |
| Google Search Console  | Google indexing, queries                                                    | search.google.com/search-console (Chrome profile `u/1`) | wbmbandofficial@gmail.com                                   | URL-prefix property `https://www.wbmband.com/`                                                                        |
| Microsoft Clarity      | Heatmaps, scroll maps, session recordings                                   | clarity.microsoft.com                                   | owner's Microsoft account (also holds project "Symbol Ngo") | project **WBM Band** `z5zghuvo3i`, linked to GA4 "WBM Website"                                                        |
| Bing Webmaster Tools   | Bing/Copilot indexing, AI Performance report                                | bing.com/webmasters                                     | signed in with Google wbmbandofficial@gmail.com             | site imported from GSC, sitemap imported                                                                              |
| IndexNow               | Instant URL submission to Bing & co.                                        | (no console; results in Bing WMT → IndexNow)            | —                                                           | key `71141a0999f8cf6d51894c1f5317f855` = `public/<key>.txt`                                                           |
| Ahrefs Webmaster Tools | Site audit, backlinks, keywords                                             | app.ahrefs.com                                          | owner's Google login (not wbmbandofficial)                  | project **WBM Band**, workspace "Woman Based Mechanics's workspace"                                                   |
| Uptime monitor         | Telegram DM on down/recovered, TLS expiry                                   | GitHub → Actions → Uptime                               | GitHub `JoilyFox`                                           | bot `@wbmband_bot` → chat `372477039`                                                                                 |
| Web3Forms              | Contact form email                                                          | web3forms.com                                           | wbmbandofficial@gmail.com                                   | access key in `config/general.ts` (public by design)                                                                  |
| MusicBrainz / Wikidata | Entity data for search/AI                                                   | musicbrainz.org / wikidata.org                          | `wbmband` / `WBMBand`                                       | artist MBID `62589d1f-dcf9-4e94-b5fc-a5e48c2e2368`, item `Q140043384`                                                 |

## Where each one is wired in the code

| Service                         | Code / config                                                                                                                                              | Doc                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| GA4                             | `nuxt.config.ts` → `gtag` (id, Consent Mode default-deny), `plugins/analytics.client.ts`, `composables/useAnalytics.ts`, `composables/useCookieConsent.ts` | `analytics-debugging.md`, `analytics-dashboards.md`, `analytics-campaigns.md` |
| GA4 reporting from the terminal | `scripts/ga-report.mjs`, `scripts/ga-admin.mjs` (service account via `GOOGLE_APPLICATION_CREDENTIALS`, property via `GA4_PROPERTY_ID`)                     | `analytics-debugging.md`                                                      |
| Clarity                         | `nuxt.config.ts` → `CLARITY_PROJECT_ID`, `utils/clarity.ts` (loads only after cookie consent)                                                              | `clarity.md`                                                                  |
| Search Console                  | nothing in code; sitemap from `scripts/generate-sitemap.js`                                                                                                | `search-console.md`                                                           |
| Bing / IndexNow                 | `public/71141a0999f8cf6d51894c1f5317f855.txt`, `scripts/indexnow.mjs` (run by `scripts/deploy-production-vps.sh`)                                          | `uptime-monitoring.md`                                                        |
| Ahrefs                          | `nuxt.config.ts` → `ahrefs-site-verification` meta. **Removing it un-verifies the project.**                                                               | this file                                                                     |
| Uptime                          | `.github/workflows/uptime.yml`, `scripts/uptime-check.sh`                                                                                                  | `uptime-monitoring.md`                                                        |
| Legal copy                      | `locales/*.json` → `pages.privacy.*`, `pages.cookies.*`, `cookies.banner.*`; dates in `config/general.ts` → `legal.*LastUpdated`                           | `clarity.md` (legal section)                                                  |

## Secrets — where they live

| Secret                              | Location                                                                                        | Used by                           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| VPS deploy key                      | `~/.ssh/wbm_deploy` (owner's Mac)                                                               | `npm run deploy:production`       |
| Telegram bot token (`@wbmband_bot`) | live copy on the VPS `/etc/wbm-secrets/telegram-token`; GitHub repo secret `TELEGRAM_BOT_TOKEN` | uptime workflow, VPS health check |
| Telegram chat id                    | GitHub repo secret `TELEGRAM_CHAT_ID` (`372477039`, not secret)                                 | uptime workflow                   |
| GA4 service account key             | JSON file on the owner's Mac, pointed to by `GOOGLE_APPLICATION_CREDENTIALS`                    | `scripts/ga-*.mjs`, GA4 MCP       |

The Social Media Video Publisher's local `.env` copy of the bot token was **stale** on
2026-10-30 (Telegram: `Unauthorized`). Copy from the VPS, see `uptime-monitoring.md`.

## Health checks

### Automatic

- **Every 5 min:** uptime workflow (home ua/en, apex redirect, sitemap, page content).
  Telegram DM on down and on recovery.
- **Daily 06:17 UTC:** TLS certificate has ≥ 14 days left.
- **Monthly (1st, 07:00 UTC):** `.github/workflows/services-check.yml` runs
  `scripts/services-check.sh`: verifies the wiring that silently breaks (GA4 tag,
  Clarity id, Ahrefs meta, IndexNow key file, sitemap size, robots.txt, last uptime runs)
  and sends a Telegram digest with the manual checklist below.

### Manual (monthly, ~10 min; the digest links each one)

1. **Search Console** → Pages: indexed count rising? New "Not indexed" reasons? Sitemaps: last read date.
2. **Bing Webmaster Tools** → Sitemaps (URLs discovered), IndexNow (submissions arrive), AI Performance (citations).
3. **Clarity** → Dashboard: dead clicks, rage clicks, quick backs; watch 3–5 recordings of `/listen/<latest>`.
4. **Ahrefs** → Site Audit: health score and new errors since last crawl.
5. **GA4** → `platform_click` by `source_platform` for the latest release.

### Ask Claude

Say "перевір сервіси" / "check the services". The `services-check` skill
(`.claude/skills/services-check/`) runs the automatic checks locally, reads what it can
through the GA4 MCP and the browser, and lists what needs the owner's login.

## Changing or adding a service

1. Wire it in code, update the table rows above (IDs, code, secrets).
2. If it sets cookies or processes visitor data: update the Privacy and Cookie policies
   and `legal.*LastUpdated` (see `clarity.md`).
3. Add its silent-failure check to `scripts/services-check.sh`.
