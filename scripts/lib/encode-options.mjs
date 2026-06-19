/**
 * Single source of truth for "how an imagePresets.json preset maps to sharp
 * encode options." Imported by BOTH the real build pipeline
 * (scripts/compress-images.js) and the autoresearch scorer
 * (scripts/autoresearch/score-images.mjs) so the bytes/quality the loop measures
 * are byte-for-byte what `npm run compress-images` will actually produce. If
 * these two ever diverge, the loop optimizes a fiction.
 *
 * Each preset's `quality` is the shared default. The loop may additionally set
 * per-format overrides — every one falls back to a value that reproduces the
 * CURRENT production output, so an unmodified presets file encodes exactly as it
 * did before these knobs existed:
 *
 *   quality                base quality for every format (existing field)
 *   avifQuality            override AVIF quality            (default: quality)
 *   avifEffort             AVIF cpu effort 0-9              (default: 4 = sharp default)
 *   avifChromaSubsampling  '4:4:4' | '4:2:0'                (default: '4:4:4' = sharp default)
 *   webpQuality            override WebP quality            (default: quality)
 *   webpEffort             WebP effort 0-6                  (default: 4 = sharp default)
 *   webpSmartSubsample     boolean                          (default: false = sharp default)
 *   jpgQuality             override JPEG quality            (default: quality)
 *   jpgChromaSubsampling   '4:4:4' | '4:2:0'                (default: '4:2:0' = sharp default)
 */

export function formatOptions(format, preset) {
  const q = preset.quality ?? 85
  switch (format) {
    case 'avif':
      return {
        quality: preset.avifQuality ?? q,
        effort: preset.avifEffort ?? 4,
        chromaSubsampling: preset.avifChromaSubsampling ?? '4:4:4'
      }
    case 'webp':
      return {
        quality: preset.webpQuality ?? q,
        effort: preset.webpEffort ?? 4,
        smartSubsample: preset.webpSmartSubsample ?? false
      }
    case 'jpg':
      return {
        quality: preset.jpgQuality ?? q,
        progressive: true,
        mozjpeg: true,
        chromaSubsampling: preset.jpgChromaSubsampling ?? '4:2:0'
      }
    case 'png':
      // Matches current production exactly: lossless DEFLATE, sharp defaults.
      // Not a meaningful loop lever, and palette quantization would posterize
      // the photographic meta/OG card — so deliberately left untunable.
      return { quality: q }
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}

export function applyFormat(pipeline, format, opts) {
  switch (format) {
    case 'avif':
      return pipeline.avif(opts)
    case 'webp':
      return pipeline.webp(opts)
    case 'jpg':
      return pipeline.jpeg(opts)
    case 'png':
      return pipeline.png(opts)
    default:
      throw new Error(`Unknown format: ${format}`)
  }
}
