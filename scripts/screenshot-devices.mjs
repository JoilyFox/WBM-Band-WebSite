/**
 * Cross-browser / cross-device visual testing.
 *
 * Renders the site with Playwright across real browser ENGINES and device
 * descriptors, writes screenshots, and reports the header glass state per
 * device. WebKit is the closest LOCAL approximation of iOS Safari (it actually
 * renders `backdrop-filter`); Chromium approximates Android Chrome.
 *
 * NOTE: Playwright-WebKit is a desktop WebKit build — great for CSS/layout
 * fidelity (~85%), but it is NOT real iOS Safari: it can't reproduce the
 * in-app-browser chrome, visual-viewport scroll physics, or on-device GPU.
 * For those, use a physical iPhone (Safari remote debugging) or a cloud device.
 *
 * One-time:  node node_modules/playwright-core/cli.js install webkit chromium
 * Usage:     npm run dev   (in another terminal)
 *            npm run screenshots                 # home + a release page
 *            SCREENSHOT_URL=https://joilyfox.github.io npm run screenshots /
 */
import { webkit, chromium, devices } from 'playwright-core'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.SCREENSHOT_URL || 'http://localhost:3000'
const OUT = 'screenshots'

const TARGETS = [
  { name: 'iphone15-webkit', engine: webkit, device: devices['iPhone 15'] },
  { name: 'iphone15-telegram', engine: webkit, device: devices['iPhone 15'], inApp: true },
  { name: 'ipad-webkit', engine: webkit, device: devices['iPad (gen 7)'] },
  { name: 'pixel7-chromium', engine: chromium, device: devices['Pixel 7'] },
  { name: 'desktop-chromium', engine: chromium, device: { viewport: { width: 1440, height: 900 } } }
]

const argPaths = process.argv.slice(2)
const PATHS = argPaths.length ? argPaths : ['/', '/listen/chorni-ptahy']

await mkdir(OUT, { recursive: true })

for (const t of TARGETS) {
  const browser = await t.engine.launch()
  const ctx = await browser.newContext({ ...t.device })
  // Simulate an in-app webview (e.g. Telegram) by injecting its bridge object.
  if (t.inApp) {
    await ctx.addInitScript(() => {
      window.TelegramWebviewProxy = { postEvent() {} }
    })
  }
  const page = await ctx.newPage()
  for (const p of PATHS) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(1300)
    const slug = p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'
    await page.screenshot({ path: `${OUT}/${t.name}--${slug}.png` })
    const info = await page
      .evaluate(() => {
        const h = document.querySelector('header')
        const cs = h && getComputedStyle(h, '::before')
        return {
          body: document.body.className,
          headerBackdrop: cs ? cs.backdropFilter || cs.webkitBackdropFilter || 'none' : 'no-header'
        }
      })
      .catch(() => null)
    console.log(`${t.name.padEnd(20)} ${p.padEnd(26)} ${JSON.stringify(info)}`)
  }
  await browser.close()
}

console.log(`\n✅ Screenshots written to ./${OUT}/`)
