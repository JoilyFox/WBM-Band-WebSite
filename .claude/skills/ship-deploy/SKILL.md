---
name: ship-deploy
description: 'Use when running tests/lint, building (npm run generate), or deploying the WBM site — to wbmband.com via FTP (deploy:production), GitHub Pages (deploy:github), DEPLOY_TARGET baseURL mechanics, or editing public/.htaccess share-URL rewrites.'
---

## When to use

Building, testing, or shipping the WBM static site: GitHub Pages staging (push to `main`), production FTP deploy to wbmband.com, `DEPLOY_TARGET` baseURL/asset-prefix mechanics, or `.htaccess`/`_redirects` share-URL routing.

## Steps

1. **Verify locally**: `npm run lint` then `npm run test` (unit+nuxt). For ship-blockers run `npm run test:e2e` (builds + prerender asserts + chromium). `npm run coverage` enforces the floor.
2. **Stage on GitHub Pages**: `git push` to `main` → `.github/workflows/deploy.yml` runs `test` (lint + `npm run test`) → `build` (`npm run deploy:github`, sets `DEPLOY_TARGET=github`) → `deploy`. Preview at `https://joilyfox.github.io/WBM-Band-WebSite/`.
3. **Production**: ensure `.env.production` has FTP creds, then `npm run deploy:production` (= `build:production` → `npm run generate` → `node scripts/deploy-production.js`). Build-only: `npm run build:production`; deploy existing build: `node scripts/deploy-production.js`.
4. **Interrupted FTP run**: just re-run `deploy:production` — it skips same-size files and resumes (tune `FTP_TIMEOUT`/`FTP_RETRIES`).
5. **Post-deploy**: hard-refresh, check non-localized `/listen/*` + `/pre-save/*` aliases resolve, test locale switching.

## Source of truth

- `docs/deployment-guide.md` — FTP flow, `.env.production` keys, `DEPLOY_TARGET`, troubleshooting (530/550/ETIMEDOUT), backups. Read on demand.
- `docs/testing-strategy.md` — Vitest projects (unit/nuxt/e2e), coverage ratchet, CI gating, known latent bugs. Read on demand.

## Key files

- `nuxt.config.ts` — `app.baseURL` + ~20 head hrefs keyed off `process.env.DEPLOY_TARGET==='github'` → `/WBM-Band-WebSite/`; `nitro.prerender.routes` (explicit page list), `failOnError:false`, `experimental.appManifest:false`.
- `scripts/deploy-production.js` — `deploy()`; FTP uploader (basic-ftp). Env: `FTP_HOST/USERNAME/PASSWORD/ROOT`, `FTP_PORT`(21), `FTP_SECURE`, `FTP_TIMEOUT`(30000), `FTP_RETRIES`(8), `DELETE_REMOTE`(false). Uploads `.output/public`.
- `scripts/create-nonlocalized-aliases.js` — copies built `ua/{listen,pre-save}/*` to root for non-localized share URLs (run by `npm run generate`).
- `public/.htaccess` — Apache: internal rewrites for `/listen|/pre-save` (+ `/ua`,`/en`, source-prefix `/i/<slug>`) → `…/index.html`; `DirectorySlash Off`; SPA fallback. Production server-side router.
- `public/_redirects` — Netlify/Vercel form (301 to `/ua/…`); both hardcode `/ua/`.
- `vitest.config.ts` — `defineConfig` + `defineVitestProject`; projects `unit`(node)/`nuxt`(happy-dom); coverage floor lines54/stmts53/funcs52/branches50.

## Gotchas

- `deploy:github` = `DEPLOY_TARGET=github npm run generate:base && create-nonlocalized-aliases` — staging now **emits the non-localized `/listen` `/pre-save` aliases** (share-URL parity with production), but still skips `generate-sitemap` + `generate-bio-links` **by design** (both bake the production canonical wbmband.com URL, so they're pointless/misleading on Pages). Full `npm run generate` (the FTP/production path) runs all three.
- Adding a page → add **both** `/en/path` and `/ua/path` to `nitro.prerender.routes` or it's absent from output.
- New head links/meta must follow the `(github ? '/WBM-Band-WebSite' : '') + path` prefix pattern.
- `.env.production` is gitignored — verify `git status` before commit. Doc shows `FTP_ROOT=/home/wbmband/` but the script default is `/home/wbmband/wbmband.com/www/`; set it explicitly.
- `middleware/redirect-share-urls.global.ts` is intentionally inert (server `.htaccess` handles it) — don't re-enable.
- `DELETE_REMOTE=true` cleanup runs only **after** a fully successful upload (no downtime); default `false` leaves stale `_nuxt/*` chunks (harmless).

## Related

- Skill: `add-page-route` — the prerender list + non-localized share aliases the build emits.
- Agents (`.claude/agents/`): `i18n-checker` (locale parity), `release-coordinator` (release-state transitions before deploy).
- Commands: `npm run extract-colors` after cover changes; `npm run generate-favicons` / `compress-images` / `generate-blurred` for new assets.
- CI: `.github/workflows/test.yml` (PR lint+unit/nuxt+e2e), `deploy.yml` (`build` needs `test`); husky pre-push runs fast suites.
