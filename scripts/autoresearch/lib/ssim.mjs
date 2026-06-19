/**
 * Dependency-free Structural Similarity (SSIM) for raw interleaved pixel buffers.
 *
 * Block-SSIM (8x8 non-overlapping windows, Wang et al. constants on the 0-255
 * scale), computed PER CHANNEL and averaged. Averaging across R/G/B (rather than
 * luma-only) is deliberate: luma SSIM is blind to chroma-subsampling loss, and
 * chroma subsampling is one of the byte-saving knobs the autoresearch loop will
 * push on — so a luma-only metric would let it Goodhart color away for free.
 *
 * Inputs are two Buffers of identical (width * height * channels) length, e.g.
 * from `sharp(x).resize(w,h).removeAlpha().raw().toBuffer()`.
 */

const C1 = (0.01 * 255) ** 2 // 6.5025
const C2 = (0.03 * 255) ** 2 // 58.5225
const WIN = 8

/**
 * @param {Buffer|Uint8Array} a
 * @param {Buffer|Uint8Array} b
 * @param {number} width
 * @param {number} height
 * @param {number} channels
 * @returns {{ mean: number, perChannel: number[] }}
 */
export function ssim(a, b, width, height, channels) {
  if (a.length !== b.length) {
    throw new Error(`ssim: buffer length mismatch (${a.length} vs ${b.length})`)
  }
  const rowStride = width * channels
  const perChannel = []

  for (let c = 0; c < channels; c++) {
    let blockSum = 0
    let blockCount = 0

    for (let by = 0; by < height; by += WIN) {
      const bh = Math.min(WIN, height - by)
      for (let bx = 0; bx < width; bx += WIN) {
        const bw = Math.min(WIN, width - bx)
        const n = bw * bh
        if (n < 4) continue // skip slivers at the edges

        let sumA = 0
        let sumB = 0
        let sumAA = 0
        let sumBB = 0
        let sumAB = 0

        for (let y = 0; y < bh; y++) {
          let idx = (by + y) * rowStride + bx * channels + c
          for (let x = 0; x < bw; x++) {
            const va = a[idx]
            const vb = b[idx]
            sumA += va
            sumB += vb
            sumAA += va * va
            sumBB += vb * vb
            sumAB += va * vb
            idx += channels
          }
        }

        const muA = sumA / n
        const muB = sumB / n
        const varA = sumAA / n - muA * muA
        const varB = sumBB / n - muB * muB
        const cov = sumAB / n - muA * muB

        const s =
          ((2 * muA * muB + C1) * (2 * cov + C2)) /
          ((muA * muA + muB * muB + C1) * (varA + varB + C2))

        blockSum += s
        blockCount++
      }
    }

    perChannel.push(blockCount > 0 ? blockSum / blockCount : 1)
  }

  const mean = perChannel.reduce((sum, v) => sum + v, 0) / perChannel.length
  return { mean, perChannel }
}
