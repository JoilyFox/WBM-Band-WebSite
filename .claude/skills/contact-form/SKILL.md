---
name: contact-form
description: 'Use when editing or debugging the WBM contact form — Web3Forms submission, the `web3formsApiKey` in config/general.ts, ContactsSection.vue, or "form not sending / not receiving email" issues.'
---

## When to use

Working on the contact form: changing fields, the success/error flow, the recipient email, the Web3Forms access key, or debugging "form won't submit / no email arrives". This is the single contact form on the site, rendered in the Contacts section.

## Steps

1. Edit markup, validation (`required` inputs), or submit logic in `components/sections/ContactsSection.vue` (`handleSubmit`).
2. The submit POSTs JSON to `https://api.web3forms.com/submit` with `{ access_key, name, email, message, subject }`. `access_key` comes from `getConfig('general.web3formsApiKey')`.
3. To rotate/replace the key: edit `web3formsApiKey` in `config/general.ts` (~line 141). It is a plain string literal in config, NOT an env var. There is no `.env` entry.
4. To change the recipient: do it in the Web3Forms dashboard (not in code) and re-verify the new email.
5. UI copy is i18n — edit `contacts.*` keys in `locales/uk.json` + `locales/en.json` (`submit_button`, `sending_button`, `success_message`, `error_message`, etc.). Keep both locales in sync.
6. Test locally with `npm run dev`, submit, and confirm the email lands (check spam).

## Source of truth

- `docs/web3forms-setup.md` — getting/installing the key, dashboard config, troubleshooting (read on demand).

## Key files

- `components/sections/ContactsSection.vue` — the only contact form; `handleSubmit` does the fetch; local state `isSubmitting`/`submitSuccess`/`submitError`.
- `config/general.ts` — `web3formsApiKey` string (read via `getConfig('general.web3formsApiKey')`); also `general.contact.email`, `general.socialMedia.*`.
- `locales/uk.json` / `locales/en.json` — `contacts.*` form labels and result messages.

## Gotchas

- The access key is committed in `config/general.ts` — it ships to the static client bundle (Web3Forms keys are public-by-design, but treat rotation as a config edit, not a secret swap). The brief's "env keys" framing is inaccurate: there are none.
- No server/backend — pure client `fetch`; success is gated on `result.success` from the JSON response, not the HTTP status.
- Success/error banners auto-hide after 5s via `setTimeout`; the form resets only on success.
- `useCookieConsent.ts` is unrelated to the form — it only gates GA4 consent. Don't conflate it.
- Static SSG: no per-deploy key swap; `DEPLOY_TARGET` does not affect this form.

## Related

- Skill `config-access` / `getConfig` pattern (`utils/configHelpers.ts`).
- Skill `i18n` for keeping `uk.json`/`en.json` in sync; review agent `i18n-checker` in `.claude/agents/`.
- Commands: `npm run dev` to test, `npm run lint`.
