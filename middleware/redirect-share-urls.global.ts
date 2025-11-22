import { useLocalePath } from '#i18n'

/**
 * Middleware to handle shared URLs without language prefix
 * Redirects /pre-save/:slug and /listen/:slug to localized versions
 * DISABLED - Using .htaccess server-side redirects instead
 */
export default defineNuxtRouteMiddleware((to) => {
  // Disabled - server-side .htaccess handles this now
  return

  // Only handle /pre-save/ and /listen/ paths without language prefix
  const path = to.path

  // Check if path starts with /pre-save/ or /listen/ (without language prefix)
  if (path.startsWith('/pre-save/') || path.startsWith('/listen/')) {
    const localePath = useLocalePath()

    // Redirect to the localized version of the same path
    return navigateTo(localePath(path), {
      replace: true,
      redirectCode: 301 // Permanent redirect for SEO
    })
  }
})
