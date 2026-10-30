---
name: services-check
description: Use when the owner asks to check the site's external services ("перевір сервіси", "check the services", "чи все працює"), at the start of a session when the last check is over ~30 days old, or when an analytics/SEO number looks off. Covers GA4, Search Console, Bing Webmaster Tools + IndexNow, Microsoft Clarity, Ahrefs, the uptime monitor and the TLS certificate. Registry of IDs, accounts and secrets: docs/site-services.md.
---

# services-check

The registry (what each service is, console URL, account, IDs, where wired, where its
secret lives) is `docs/site-services.md`. Read it first; this skill is the procedure.

## 1. Automatic checks (no login)

```bash
GH_TOKEN=$(gh auth token) GITHUB_REPOSITORY=JoilyFox/WBM-Band-WebSite bash scripts/services-check.sh
```

It verifies the GA4 tag, Clarity id, Ahrefs verification meta, IndexNow key file,
sitemap size, robots.txt, TLS days left and that the uptime workflow is active with a
recent scheduled run. Exit 1 = something is broken; each ❌ line says what.

Also look at recent workflow runs:

```bash
gh run list -R JoilyFox/WBM-Band-WebSite --workflow uptime.yml --limit 5
gh run list -R JoilyFox/WBM-Band-WebSite --workflow services-check.yml --limit 3
```

## 2. Data you can read yourself

- **GA4:** the `mcp__ga4__*` tools (property `523582426`). Pull the last 28 days of
  `platform_click` by `source_platform` and `release_slug`, and `sessions` by day.
  Compare with the previous 28 days; on small numbers report counts, not % changes.
- **Live site:** `curl` the home, latest `/listen/<slug>` and `/lyrics/<slug>`.

## 3. Needs the owner's login (browser via claude-in-chrome; owner signs in)

Open each console, read, summarize. Never enter passwords or grant OAuth consent:
ask the owner to click.

1. Search Console (Chrome profile `u/1`): Pages (indexed / not indexed reasons), Sitemaps.
2. Bing Webmaster Tools: Sitemaps (URLs discovered), IndexNow, AI Performance.
3. Clarity project `z5zghuvo3i`: Dashboard (dead/rage clicks, quick backs), 3–5 recordings of the latest `/listen` page.
4. Ahrefs: Site Audit health score and new issues.

## 4. Report

Short Ukrainian summary: what is broken (with the fix), what changed since last time,
what needs the owner. Then update `Last full review` in `docs/site-services.md` and
the project memory note about services.

## Gotchas

- GitHub disables scheduled workflows in a public repo after 60 days without commits.
  If `uptime.yml` is `disabled_inactivity`, re-enable it in the Actions tab.
- The Telegram bot token's live copy is on the VPS (`/etc/wbm-secrets/telegram-token`);
  the publisher project's local `.env` copy went stale once. A send failure shows as a
  `Telegram send failed: <description>` warning in the run log.
- Removing the `ahrefs-site-verification` meta from `nuxt.config.ts` un-verifies Ahrefs.
- Clarity loads only after cookie consent, so its session counts are a subset of GA4's.
