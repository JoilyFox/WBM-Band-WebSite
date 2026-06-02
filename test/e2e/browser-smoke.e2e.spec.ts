import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { chromium, type Browser, type BrowserContext } from 'playwright-core'

// Real-browser smoke against the prerendered `.output/public`: serves the static
// build over HTTP (correct MIME types so the app actually hydrates) and drives
// chromium. Focused on the highest-confidence, deterministic flows — real
// hydration and the P0 cookie-consent gate. External navigation is blocked so the
// distributor redirect can never hit the network. Browser specs live behind the
// e2e config (npm run test:e2e), never the default `vitest run`.

const OUT = resolve(process.cwd(), '.output/public')

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
}

async function resolveFile(root: string, urlPath: string): Promise<string | null> {
  const base = join(root, urlPath)
  for (const c of [base, join(base, 'index.html'), `${base}.html`]) {
    try {
      if ((await stat(c)).isFile()) return c
    } catch {
      // keep trying
    }
  }
  return null
}

function startStaticServer(root: string): Promise<{ server: Server; origin: string }> {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url || '/', 'http://x').pathname)
      let file = await resolveFile(root, urlPath)
      let status = 200
      if (!file) {
        status = 404
        file = existsSync(join(root, '404.html')) ? join(root, '404.html') : null
      }
      if (!file) {
        res.writeHead(404)
        res.end('not found')
        return
      }
      const body = await readFile(file)
      res.writeHead(status, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' })
      res.end(body)
    } catch (err) {
      res.writeHead(500)
      res.end(String(err))
    }
  })
  return new Promise((resolvePromise) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      resolvePromise({ server, origin: `http://127.0.0.1:${port}` })
    })
  })
}

let server: Server
let origin: string
let browser: Browser

// Block any navigation/request that leaves localhost (e.g. the distributor hop).
async function freshContext(): Promise<BrowserContext> {
  const ctx = await browser.newContext()
  await ctx.route('**/*', (route) => {
    const url = route.request().url()
    if (/^(http:\/\/127\.0\.0\.1|about:|data:|blob:)/.test(url)) route.continue()
    else route.abort()
  })
  return ctx
}

beforeAll(async () => {
  if (!existsSync(OUT)) {
    throw new Error('.output/public not found — run `npm run generate` first (test:e2e does this).')
  }
  ;({ server, origin } = await startStaticServer(OUT))
  browser = await chromium.launch({ headless: true })
}, 120000)

afterAll(async () => {
  await browser?.close()
  await new Promise<void>((r) => server?.close(() => r()))
})

describe('real-browser hydration', () => {
  it('boots the ua home and hydrates (client-only consent toast appears)', async () => {
    const ctx = await freshContext()
    const page = await ctx.newPage()
    await page.goto(`${origin}/ua`, { waitUntil: 'load' })
    // The consent toast is client-only and revealed after a delay — its presence
    // proves the app hydrated (SSR HTML alone would never show it).
    const toast = page.locator('[role="dialog"].cookie-toast')
    await toast.waitFor({ state: 'visible', timeout: 8000 })
    expect(await toast.isVisible()).toBe(true)
    await ctx.close()
  })
})

describe('cookie-consent gate (P0)', () => {
  it('accept dismisses the toast and persists "accepted"', async () => {
    const ctx = await freshContext()
    const page = await ctx.newPage()
    await page.goto(`${origin}/ua`, { waitUntil: 'load' })
    const toast = page.locator('[role="dialog"].cookie-toast')
    await toast.waitFor({ state: 'visible', timeout: 8000 })
    await page.locator('.cookie-toast__btn--accept').click()
    await toast.waitFor({ state: 'hidden', timeout: 8000 })
    const stored = await page.evaluate(() => window.localStorage.getItem('wbm_cookie_consent'))
    expect(stored).toBe('accepted')
    await ctx.close()
  })

  it('decline dismisses the toast and persists "declined"', async () => {
    const ctx = await freshContext()
    const page = await ctx.newPage()
    await page.goto(`${origin}/ua`, { waitUntil: 'load' })
    const toast = page.locator('[role="dialog"].cookie-toast')
    await toast.waitFor({ state: 'visible', timeout: 8000 })
    await page.locator('.cookie-toast__btn--decline').click()
    await toast.waitFor({ state: 'hidden', timeout: 8000 })
    const stored = await page.evaluate(() => window.localStorage.getItem('wbm_cookie_consent'))
    expect(stored).toBe('declined')
    await ctx.close()
  })
})

describe('deep-link render', () => {
  it('renders a clean listen page in the browser', async () => {
    const ctx = await freshContext()
    const page = await ctx.newPage()
    const resp = await page.goto(`${origin}/listen/mania`, { waitUntil: 'load' })
    expect(resp?.status()).toBe(200)
    // The Nuxt app root has real content (not an empty shell).
    const nuxtHtml = await page.locator('#__nuxt').innerHTML()
    expect(nuxtHtml.length).toBeGreaterThan(500)
    await ctx.close()
  })
})
