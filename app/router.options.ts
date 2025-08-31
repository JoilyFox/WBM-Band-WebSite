import type { RouterConfig } from '@nuxt/schema'

// Keep scroll position when only the i18n locale prefix changes (e.g., /en/* ↔ /uk/*)
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    // Restore saved position on popstate
    if (savedPosition) return savedPosition

    // If only the locale segment changed, don't alter scroll
    const stripLocale = (path: string) => path.replace(/^\/(en|ua)(?=\/|$)/, '') || '/'
    if (stripLocale(to.fullPath) === stripLocale(from.fullPath)) {
      return false
    }

    // Let hash navigation scroll to target
    if (to.hash) {
      return { el: to.hash, top: 0 }
    }

    // Default: scroll to top
    return { top: 0 }
  }
}
