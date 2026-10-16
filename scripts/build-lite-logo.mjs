#!/usr/bin/env node
/**
 * Build the LIGHTWEIGHT monogram SVGs from the full-detail logo.
 *
 *   public/images/wbm-logo-white.svg  (110 KB, 484 hand-traced contours)
 *        |  flatten curves -> drop sub-pixel specks -> Douglas-Peucker -> integer coords
 *        v
 *   assets/favicons/logo-lite.svg     white silhouette; source of safari-pinned-tab.svg
 *   public/favicon.svg                tab monogram: white mark + black halo (the one
 *                                     linked as <link rel="icon" type="image/svg+xml">)
 *
 * Why: the previous favicon.svg was 339 KB (every contour traced twice, 4 decimals) and
 * is fetched on every page. At 16-48 px, detail below ~0.3 px is invisible, so the
 * contours are simplified to a tolerance that is far under one pixel at tab sizes.
 *
 * Usage:  node scripts/build-lite-logo.mjs
 * Then:   npm run generate-favicons   (re-rasterizes the PNG/ICO set + pinned tab)
 *
 * No dependencies. See docs/favicon-setup.md.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// --- Tunables (units of the 2158.53 x 2769.16 logo space) -----------------------------
const TOLERANCE = Number(process.env.LITE_TOL ?? 2) //   max deviation of a simplified contour (~0.19% of the width)
const MIN_SPECK = Number(process.env.LITE_SPECK ?? 8) //  drop contours whose bbox is smaller than this in both axes
const HALO = 19 //       halo stroke width in the 159-unit favicon space (as before)
// Placement of the mark inside the 159x159 tab favicon (fitted to the previous artwork).
const FAV = { size: 159, scale: 0.0489, cx: 83.83, cy: 80.21 }

const SOURCE = path.join(ROOT, 'public/images/wbm-logo-white.svg')
const OUT_LITE = path.join(ROOT, 'assets/favicons/logo-lite.svg')
const OUT_TAB = path.join(ROOT, 'public/favicon.svg')

// --- Path parsing -> flattened polygons ------------------------------------------------
const NUM = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi

function flattenPath(d) {
  const rings = []
  let ring = null
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  let lastC = null // last cubic control point 2 (for S)
  const push = (px, py) => ring && ring.push([px, py])
  const cubic = (x0, y0, x1, y1, x2, y2, x3, y3) => {
    const len =
      Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2)
    const n = Math.max(3, Math.min(32, Math.ceil(len / 8)))
    for (let i = 1; i <= n; i++) {
      const t = i / n
      const u = 1 - t
      push(
        u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
        u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
      )
    }
  }
  const re = /([MmLlHhVvCcSsQqZz])([^MmLlHhVvCcSsQqZz]*)/g
  let m
  while ((m = re.exec(d))) {
    const cmd = m[1]
    const a = (m[2].match(NUM) || []).map(Number)
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    let i = 0
    if (C === 'Z') {
      if (ring) rings.push(ring)
      ring = null
      x = sx
      y = sy
      lastC = null
      continue
    }
    do {
      const ox = rel ? x : 0
      const oy = rel ? y : 0
      if (C === 'M') {
        if (ring) rings.push(ring)
        x = a[i++] + ox
        y = a[i++] + oy
        sx = x
        sy = y
        ring = [[x, y]]
        lastC = null
        // further pairs after M are implicit L
        while (i < a.length) {
          x = a[i++] + (rel ? x : 0)
          y = a[i++] + (rel ? y : 0)
          push(x, y)
        }
        break
      } else if (C === 'L') {
        x = a[i++] + ox
        y = a[i++] + oy
        push(x, y)
        lastC = null
      } else if (C === 'H') {
        x = a[i++] + ox
        push(x, y)
        lastC = null
      } else if (C === 'V') {
        y = a[i++] + oy
        push(x, y)
        lastC = null
      } else if (C === 'C') {
        const x1 = a[i++] + ox
        const y1 = a[i++] + oy
        const x2 = a[i++] + ox
        const y2 = a[i++] + oy
        const x3 = a[i++] + ox
        const y3 = a[i++] + oy
        cubic(x, y, x1, y1, x2, y2, x3, y3)
        lastC = [x2, y2]
        x = x3
        y = y3
      } else if (C === 'S') {
        const x1 = lastC ? 2 * x - lastC[0] : x
        const y1 = lastC ? 2 * y - lastC[1] : y
        const x2 = a[i++] + ox
        const y2 = a[i++] + oy
        const x3 = a[i++] + ox
        const y3 = a[i++] + oy
        cubic(x, y, x1, y1, x2, y2, x3, y3)
        lastC = [x2, y2]
        x = x3
        y = y3
      } else if (C === 'Q') {
        const qx = a[i++] + ox
        const qy = a[i++] + oy
        const x3 = a[i++] + ox
        const y3 = a[i++] + oy
        // elevate quadratic to cubic
        cubic(
          x,
          y,
          x + (2 / 3) * (qx - x),
          y + (2 / 3) * (qy - y),
          x3 + (2 / 3) * (qx - x3),
          y3 + (2 / 3) * (qy - y3),
          x3,
          y3
        )
        x = x3
        y = y3
        lastC = null
      }
    } while (i < a.length)
  }
  if (ring) rings.push(ring)
  return rings
}

// --- Simplification --------------------------------------------------------------------
function distToSeg(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

function dp(points, tol) {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [s, e] = stack.pop()
    let maxD = 0
    let idx = -1
    for (let i = s + 1; i < e; i++) {
      const d = distToSeg(points[i], points[s], points[e])
      if (d > maxD) {
        maxD = d
        idx = i
      }
    }
    if (idx !== -1 && maxD > tol) {
      keep[idx] = 1
      stack.push([s, idx], [idx, e])
    }
  }
  return points.filter((_, i) => keep[i])
}

function simplifyRing(ring, tol) {
  // closed ring: split at the point farthest from the first so both halves are open polylines
  let far = 0
  let best = -1
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1])
    if (d > best) {
      best = d
      far = i
    }
  }
  if (far === 0) return ring
  const a = dp(ring.slice(0, far + 1), tol)
  const b = dp([...ring.slice(far), ring[0]], tol)
  return [...a.slice(0, -1), ...b.slice(0, -1)]
}

function bbox(ring) {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [x, y] of ring) {
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }
}

// --- Serialization (integer, relative, minimal separators) ------------------------------
const fmt = (n) => String(n)
function ringToD(ring) {
  const pts = ring.map(([x, y]) => [Math.round(x), Math.round(y)])
  // collapse points that rounded onto each other
  const clean = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1])
  if (clean.length < 3) return ''
  let out = `M${clean[0][0]} ${clean[0][1]}l`
  let prev = clean[0]
  const parts = []
  for (let i = 1; i < clean.length; i++) {
    parts.push(fmt(clean[i][0] - prev[0]), fmt(clean[i][1] - prev[1]))
    prev = clean[i]
  }
  // join with a space only when the next number is not negative
  out += parts.reduce((acc, n, i) => (i === 0 ? n : acc + (n.startsWith('-') ? '' : ' ') + n), '')
  return out + 'z'
}

// --- Main ------------------------------------------------------------------------------
const src = await fs.readFile(SOURCE, 'utf8')
const vb = src
  .match(/viewBox="([^"]+)"/)[1]
  .split(/\s+/)
  .map(Number)
const [, , VBW, VBH] = vb

// Keep each original <path> as its OWN element. Their contours overlap and are unioned by the
// renderer; merging them into one path would combine winding numbers instead and punch holes
// where an outline of one piece overlaps a hole of another.
const groups = []
for (const m of src.matchAll(/<path\b[^>]*?\sd="([^"]*)"/g)) groups.push(flattenPath(m[1]))
const polys = []
for (const m of src.matchAll(/<polygon\b[^>]*?\spoints="([^"]*)"/g)) {
  const n = (m[1].match(NUM) || []).map(Number)
  const ring = []
  for (let i = 0; i < n.length; i += 2) ring.push([n[i], n[i + 1]])
  polys.push(ring)
}
if (polys.length) groups.push(polys) // tiny stand-alone polygons: one shared element

let total = 0
let dropped = 0
const keptGroups = []
for (const g of groups) {
  const kept = []
  for (const r of g) {
    total++
    const b = bbox(r)
    if (b.w < MIN_SPECK && b.h < MIN_SPECK) {
      dropped++
      continue
    }
    kept.push(simplifyRing(r, TOLERANCE))
  }
  const dd = kept.map(ringToD).join('')
  if (dd) keptGroups.push({ d: dd, rings: kept })
}
const pathsXml = (attrs) => keptGroups.map((g) => `<path${attrs} d="${g.d}"/>`).join('')
const all = keptGroups.flatMap((g) => g.rings.flat())
const full = bbox(all)

// 1) white silhouette (source for safari-pinned-tab.svg; same `.cls-1` convention as the logo)
const lite = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VBW} ${VBH}"><style>.cls-1{fill:#fff}</style>${pathsXml(' class="cls-1"')}</svg>
`
await fs.mkdir(path.dirname(OUT_LITE), { recursive: true })
await fs.writeFile(OUT_LITE, lite)

// 2) tab favicon: white mark on a black halo (the halo layer is the stroked geometry).

const { size, scale, cx, cy } = FAV
const lcx = (full.x0 + full.x1) / 2
const lcy = (full.y0 + full.y1) / 2
const tx = (cx - lcx * scale).toFixed(3)
const ty = (cy - lcy * scale).toFixed(3)
const strokeW = Math.round(HALO / scale)
// Two layers of the SAME geometry: halo (stroked, black) underneath, white mark on top.
const tab = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><defs><g id="m">${pathsXml('')}</g></defs><g transform="translate(${tx} ${ty}) scale(${scale})"><use href="#m" fill="#000" stroke="#000" stroke-width="${strokeW}" stroke-linejoin="round"/><use href="#m" fill="#fff"/></g></svg>
`
await fs.writeFile(OUT_TAB, tab)

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1)
console.log(
  `contours: ${total} -> ${total - dropped} (dropped ${dropped} specks); ` +
    `kept nodes: ${all.length}`
)
console.log(`logo-lite.svg ${kb(lite)} KB | favicon.svg ${kb(tab)} KB`)
