---
name: ship-deploy
description: 'Use when running tests/lint/typecheck, building (npm run generate), or deploying the WBM site — to wbmband.com via rsync to the VPS (deploy:production, nginx), GitHub Pages (deploy:github), DEPLOY_TARGET baseURL mechanics, or editing the production routing rules in deploy/nginx/.'
---

## When to use

Building, testing, or shipping the WBM static site: GitHub Pages staging (push to `main`), production rsync deploy to the VPS behind nginx, `DEPLOY_TARGET` baseURL/asset-prefix mechanics, or routing/redirect rules (nginx is the production router; `.htaccess`/`_redirects` are legacy/fallback only).

## Steps

1. **Verify locally**: `npm run lint`, `npm run typecheck`, then `npm run test` (unit+nuxt). `npm run coverage` is what CI runs and enforces the threshold floor. For ship-blockers run `npm run test:e2e` (builds + prerender asserts + chromium).
2. **Stage on GitHub Pages**: `git push` to `main` → `.github/workflows/deploy.yml` runs `test` → `build` (`npm run deploy:github`, sets `DEPLOY_TARGET=github`) → `deploy`. Preview at `https://joilyfox.github.io/WBM-Band-WebSite/`.
3. **Production**: `npm run deploy:production` = `build:production` (→ `npm run generate`) → `bash scripts/deploy-production-vps.sh`. Preview first with `DRY_RUN=1 bash scripts/deploy-production-vps.sh` (rsync `-n -i`, uploads nothing; `*deleting` lines are what `--delete` would remove). Deploy the existing build without rebuilding: `bash scripts/deploy-production-vps.sh`. After rsync it pings IndexNow with the changed sitemap URLs (`scripts/indexnow.mjs`). Uptime is watched by `.github/workflows/uptime.yml` (Telegram DM): `docs/uptime-monitoring.md`.
4. **Config**: env or gitignored `.env.production`: `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY` (default `~/.ssh/wbm_deploy`), `DEPLOY_PATH` (default `/var/www/wbmband`, must be under `/var/www/`).
5. **Server config changes** (redirects, headers, 404s): edit `deploy/nginx/*.conf`, apply and smoke-test per `deploy/nginx/README.md`.
6. **Post-deploy**: hard-refresh, check `/listen/<slug>` + `/en/listen/<slug>` resolve, `/ua/...` 301s, an unknown URL returns 404, test locale switching.

## Source of truth

- `docs/deployment-guide.md` — targets, rsync flow, env vars, dry run, troubleshooting. Read on demand.
- `docs/build-pipeline.md` — what `npm run generate` does (prerender hook, sitemap, bio-links) and the routing contract.
- `deploy/nginx/README.md` — production nginx config, apply steps, smoke tests.
- `docs/testing-strategy.md` — Vitest projects (unit/nuxt/e2e), coverage ratchet, CI gating. Read on demand.

## Key files

- `nuxt.config.ts` — `app.baseURL` + head hrefs keyed off `process.env.DEPLOY_TARGET==='github'` → `/WBM-Band-WebSite/`; `nitro.prerender.routes` (explicit page list), `failOnError:false`, `experimental.appManifest:false`, the `prerender:generate` hook.
- `scripts/deploy-production-vps.sh` — rsync `--delete` to `DEPLOY_PATH`; refuses paths outside `/var/www/`; hides unreferenced image originals (`H` filters) so only `images/optimized/`, `*-blurred.*`, meta-images, icons and logos ship; protects the server-only `.well-known/`.
- `deploy/nginx/` — versioned production nginx config (source of truth for redirects/404s/headers).
- `public/.htaccess`, `public/_redirects` — legacy shared-host / GitHub Pages / Netlify fallbacks only; nginx does not read them. `test/unit/routing-contract.spec.ts` keeps them consistent.
- `vitest.config.ts` — `defineConfig` + `defineVitestProject`; projects `unit`(node)/`nuxt`(happy-dom); coverage thresholds (see the comment there for the measured baseline).

## Gotchas

- `deploy:production` builds from the **working tree**, not git — uncommitted changes ship. Reconcile first.
- `deploy:github` = `DEPLOY_TARGET=github npm run generate:base` only; it skips `generate-sitemap` + `generate-bio-links` **by design** (both bake the production canonical URL).
- Adding a page → add **both** `/path` and `/en/path` to `nitro.prerender.routes` or it is absent from output (and nginx 404s it — there is no SPA fallback).
- New head links/meta must follow the `(github ? '/WBM-Band-WebSite' : '') + path` prefix pattern.
- `.env.production` is gitignored — verify `git status` before commit.
- `--delete` removes anything on the server that is not in the build (that is how deleted pages disappear). Dry-run before deploys that remove or rename pages.
- `npm run generate` clobbers `.nuxt` and breaks a running `npm run dev`; restart dev afterwards.

## Related

- Skill: `add-page-route` — the prerender list and locale parity.
- Agents (`.claude/agents/`): `i18n-checker` (locale parity), `release-coordinator` (release-state transitions before deploy).
- Commands: `npm run extract-colors` after cover changes; `npm run generate-favicons` / `compress-images` / `generate-blurred` for new assets.
- CI: `.github/workflows/test.yml` (lint, typecheck, coverage, e2e), `deploy.yml` (`build` needs `test`); husky pre-push runs fast suites.
