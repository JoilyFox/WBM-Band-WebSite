# Uptime monitoring and IndexNow

## Uptime → Telegram

`.github/workflows/uptime.yml` runs `scripts/uptime-check.sh` every 5 min on GitHub's
runners and DMs chat `372477039` through `@wbmband_bot` (the bot the band's publishing
system already uses).

**Why GitHub Actions, not a cron on the VPS:** the site and the publishing stack share the
OVH VPS (151.80.140.64). A monitor there would die with the server and say nothing.

**Checks** (final status after redirects must be 200, body must contain the text):

| URL                                   | Must contain            |
| ------------------------------------- | ----------------------- |
| `https://www.wbmband.com/`            | `Woman Based Mechanics` |
| `https://www.wbmband.com/en/`         | `Woman Based Mechanics` |
| `https://wbmband.com/` (apex → www)   | `Woman Based Mechanics` |
| `https://www.wbmband.com/sitemap.xml` | `<urlset`               |

The content check catches an empty or broken rsync that still returns 200.

**Messages.** One on going down, one on recovery, nothing in between. A failing check is
retried after 45 s before it counts. The up/down state survives between runs in
`actions/cache` (a new entry only when the state changes). The daily 06:17 UTC run also
warns when the TLS certificate has < 14 days left (Let's Encrypt renewal broken).

**Secrets** (repo → Settings → Secrets → Actions): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
Without them the script only logs. The live bot token is the one on the VPS at
`/etc/wbm-secrets/telegram-token` (the publisher's local `.env` copy was stale on
2026-10-30 and Telegram answered `Unauthorized`). Refresh the secret with:

```bash
t=$(ssh -i ~/.ssh/wbm_deploy root@151.80.140.64 'cat /etc/wbm-secrets/telegram-token' | tr -d '\r\n')
printf %s "$t" | gh secret set TELEGRAM_BOT_TOKEN -R JoilyFox/WBM-Band-WebSite
```

A send error shows as a `Telegram send failed: <description>` warning in the run log.

**Operate:**

- Test by hand: Actions → Uptime → Run workflow. Mode `test` sends a test DM, `daily` adds the cert check.
- Local run (prints instead of sending): `TELEGRAM_BOT_TOKEN= bash scripts/uptime-check.sh`.
- Simulate an outage: `UPTIME_SITE=https://www.wbmband.com/nope …` (the apex check stays green).
- GitHub can start scheduled runs 5–15 min late, and disables schedules in a public repo
  after 60 days without commits. If the repo goes quiet that long, re-enable the
  workflow in the Actions tab.

## IndexNow

`npm run deploy:production` ends with `node scripts/indexnow.mjs`, which tells Bing (and
the other IndexNow engines) which URLs changed. It saves the live sitemap before rsync
and sends only URLs that are new or whose `<lastmod>` moved; unchanged deploys send
nothing. The key file is `public/71141a0999f8cf6d51894c1f5317f855.txt` (public by design;
the key in the script must match the file name). Force a full submit once with
`node scripts/indexnow.mjs --all`. Submissions show in Bing Webmaster Tools → IndexNow.
