Save a session context entry to `memory/session_log.md` in this project folder.

First, review the entire conversation to identify everything accomplished in this session.

Then append the following block to the END of `memory/session_log.md`. If the file is empty or doesn't exist, create it with a `# Session Memory Log` header first.

Use this exact format:

```
---
## Session: [YYYY-MM-DD HH:MM Europe/Kiev] — [one-line title describing what was done]

### Accomplished
- [bullet: completed task, reference tasks file if applicable, e.g. "✅ Task 1.1 — added source attribution util"]

### Key decisions
- [bullet: any architectural or implementation decisions made, with brief reasoning]

### Technical findings
- [bullet: important API limits, GA4 quirks, in-app browser UA strings, gotchas, or docs discovered]
  - Source: [where found]

### Credentials & IDs obtained
- [bullet: what type of credential/ID was obtained and WHERE it is stored — DO NOT write the actual secret value]
  - e.g. "GA4 Measurement ID — saved to nuxt.config.ts gtag.id"

### Blockers & open questions
- [bullet: anything blocking progress, or questions still needing human answers]

### Next session: start here
- [1–3 bullet points describing exactly what to do next, including which task number from docs/analytics-implementation-tasks.md]

### Important IDs & links discovered this session
- GA4 Property ID: [if obtained]
- GA4 Measurement ID: [if obtained]
- [any other IDs: dashboard URLs, exploration IDs, etc.]
```

Important rules:

- NEVER write actual secret values (passwords, tokens, API keys) into this file
- Keep each bullet concise (one line)
- Always include the "Next session: start here" section — this is what the next agent reads first
- If no new technical findings, write "— none this session"
