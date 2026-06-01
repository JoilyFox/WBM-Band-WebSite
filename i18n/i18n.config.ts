// i18n configuration for @nuxtjs/i18n
// Moved out of plugins to avoid Nuxt plugin wrapping warning
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'ua',
  warnHtmlMessage: false,
  // Surface missing keys and silent locale fallbacks DURING DEVELOPMENT so a key
  // present in one locale but absent in the other doesn't quietly render the
  // fallback language (e.g. Ukrainian text on the English page) with no warning.
  // Kept quiet in production builds to avoid console noise for visitors.
  missingWarn: import.meta.dev,
  fallbackWarn: import.meta.dev
}))
