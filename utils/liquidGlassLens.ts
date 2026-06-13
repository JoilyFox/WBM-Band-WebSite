/**
 * Physics-based displacement map for Liquid Glass edge refraction.
 *
 * Models the glass as a thick slab whose edges round off into a convex lens
 * (a squircle "thickness" profile). Within `edge` px of the rounded-rect
 * boundary the surface tilts, so — per Snell's law — it bends the backdrop
 * INWARD, magnifying content near the rim. The interior stays flat (no warp).
 *
 * Output is a PNG data URL where, per the SVG feDisplacementMap convention,
 * the Red channel encodes horizontal displacement and Green encodes vertical
 * (128 = no shift). It is fed to <feImage> → <feDisplacementMap scale=strength>
 * and applied as the glass layer's `filter`, so only Chromium honours it on a
 * backdrop (the same engine constraint as the static lens it replaces).
 *
 * The map is low-frequency, so it is generated at a downsampled resolution and
 * stretched by the filter — keeping generation under a millisecond even for a
 * full-width bar, cheap enough to recompute on resize.
 */
/** Per-corner radii (px): top-left, top-right, bottom-right, bottom-left. */
export interface CornerRadii {
  tl: number
  tr: number
  br: number
  bl: number
}

export interface LiquidLensOptions {
  /** Uniform corner radius, px. Ignored when `radii` is given. */
  radius?: number
  /** Per-corner radii, px — lets the lens follow an element rounded on only some corners. */
  radii?: CornerRadii
  /** Width of the refractive rim band, px. Defaults to a fraction of the short side. */
  edge?: number
  /** Convexity of the rim profile: higher = sharper magnification right at the lip. */
  curve?: number
}

export interface LiquidLensResult {
  /** PNG data URL of the displacement map. */
  url: string
  /** Max displacement in px — use directly as the feDisplacementMap `scale`. */
  scale: number
}

const MAP_MAX = 192 // cap per-axis map resolution (the map is smooth)

/**
 * Signed distance to a rounded-rect boundary with independent corner radii;
 * positive INSIDE the shape. `cx/cy` is the centre, `halfW/halfH` the half-size.
 */
function insideDistance(
  x: number,
  y: number,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  radii: CornerRadii
): number {
  const px = x - cx
  const py = y - cy
  // Select the radius for the quadrant the point falls in (px>0 right, py>0 down).
  const r = px > 0 ? (py > 0 ? radii.br : radii.tr) : py > 0 ? radii.bl : radii.tl
  const qx = Math.abs(px) - halfW + r
  const qy = Math.abs(py) - halfH + r
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
  const inside = Math.min(Math.max(qx, qy), 0)
  return -(outside + inside - r)
}

/**
 * Build the displacement map for a `width`×`height` glass element.
 * Returns null if a canvas context can't be obtained (non-browser / blocked).
 */
export function buildLiquidLensMap(
  width: number,
  height: number,
  strength: number,
  opts: LiquidLensOptions = {}
): LiquidLensResult | null {
  if (typeof document === 'undefined' || width < 2 || height < 2) return null

  const shortSide = Math.min(width, height)
  const cap = shortSide / 2
  const uniform = opts.radius ?? 0
  const src = opts.radii ?? { tl: uniform, tr: uniform, br: uniform, bl: uniform }
  const radii: CornerRadii = {
    tl: Math.min(src.tl, cap),
    tr: Math.min(src.tr, cap),
    br: Math.min(src.br, cap),
    bl: Math.min(src.bl, cap)
  }
  const edge = Math.max(2, Math.min(opts.edge ?? shortSide * 0.32, shortSide / 2))
  const curve = opts.curve ?? 1.7

  const mw = Math.max(8, Math.min(MAP_MAX, Math.round(width / 3)))
  const mh = Math.max(8, Math.min(MAP_MAX, Math.round(height / 3)))

  const canvas = document.createElement('canvas')
  canvas.width = mw
  canvas.height = mh
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const image = ctx.createImageData(mw, mh)
  const data = image.data

  const halfW = width / 2
  const halfH = height / 2

  for (let py = 0; py < mh; py++) {
    for (let px = 0; px < mw; px++) {
      const x = ((px + 0.5) / mw) * width
      const y = ((py + 0.5) / mh) * height
      const d = insideDistance(x, y, halfW, halfH, halfW, halfH, radii)

      let dx = 0
      let dy = 0
      if (d >= 0 && d < edge) {
        // Inward surface normal = gradient of the inside-distance field.
        const gx =
          insideDistance(x + 1, y, halfW, halfH, halfW, halfH, radii) -
          insideDistance(x - 1, y, halfW, halfH, halfW, halfH, radii)
        const gy =
          insideDistance(x, y + 1, halfW, halfH, halfW, halfH, radii) -
          insideDistance(x, y - 1, halfW, halfH, halfW, halfH, radii)
        const len = Math.hypot(gx, gy) || 1
        // Convex profile: 1 at the rim, easing to 0 at the inner edge of the band.
        const t = Math.pow(1 - d / edge, curve)
        dx = (gx / len) * t
        dy = (gy / len) * t
      }

      const i = (py * mw + px) * 4
      data[i] = Math.round(128 + 127 * Math.max(-1, Math.min(1, dx)))
      data[i + 1] = Math.round(128 + 127 * Math.max(-1, Math.min(1, dy)))
      data[i + 2] = 128
      data[i + 3] = 255
    }
  }

  ctx.putImageData(image, 0, 0)
  return { url: canvas.toDataURL(), scale: strength }
}
