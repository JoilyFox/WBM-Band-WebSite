/**
 * Composable for resolving asset URLs with proper base path handling
 * Useful for GitHub Pages or other subdirectory deployments
 */
export const useAssetUrl = () => {
  const config = useRuntimeConfig()
  const baseURL = config.app.baseURL

  /**
   * Resolves an asset path by prepending the application base URL
   * @param path - The absolute path to the asset (e.g., '/images/logo.png')
   * @returns The resolved URL including base path
   */
  const resolveUrl = (path: string) => {
    if (!path || typeof path !== 'string') return path
    if (!path.startsWith('/')) return path // Relative paths are left as is
    if (path.startsWith('http')) return path // External URLs are left as is

    // If baseURL is '/', return path as is
    if (baseURL === '/') return path

    // Remove trailing slash from base and ensure path starts with slash
    const prefix = baseURL.replace(/\/$/, '')

    // Prevent double prefixing
    if (path.startsWith(prefix + '/')) return path

    return `${prefix}${path}`
  }

  /**
   * Resolves every URL inside a `srcset` string ("url 400w, url 800w, …"),
   * prefixing each URL with the base path while leaving the width/density
   * descriptors intact. Applying resolveUrl() to the whole string would only
   * (wrongly) prefix the first URL.
   */
  const resolveSrcSet = (srcset: string) => {
    if (!srcset || typeof srcset !== 'string') return srcset
    return srcset
      .split(',')
      .map((part) => {
        const trimmed = part.trim()
        if (!trimmed) return trimmed
        const spaceIdx = trimmed.indexOf(' ')
        if (spaceIdx === -1) return resolveUrl(trimmed) // single URL, no descriptor
        return `${resolveUrl(trimmed.slice(0, spaceIdx))} ${trimmed.slice(spaceIdx + 1)}`
      })
      .join(', ')
  }

  return {
    resolveUrl,
    resolveSrcSet
  }
}
