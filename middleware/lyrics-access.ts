import { getReleaseBySlug } from '~/data/musicLibrary'

/**
 * Guards the dedicated /lyrics/<slug> pages. A lyrics URL only makes sense for a
 * release that actually ships a non-empty `lyrics` array — every other slug
 * (including valid releases that simply have no lyrics yet) 404s cleanly. The
 * prerender list (nuxt.config masterPageRoutes) only emits lyrics routes for
 * these same releases, so this only ever fires for hand-typed / stale URLs.
 */
export default defineNuxtRouteMiddleware((to) => {
  const slugParam = to.params?.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  if (!slug) return

  const release = getReleaseBySlug(slug)
  if (!release || !release.lyrics || release.lyrics.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `Lyrics not available for "${slug}"`,
      data: { slug }
    })
  }
})
