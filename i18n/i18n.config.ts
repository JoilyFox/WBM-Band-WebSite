// i18n configuration for @nuxtjs/i18n
// Moved out of plugins to avoid Nuxt plugin wrapping warning
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'ua',
  warnHtmlMessage: false,
  missingWarn: false,
  fallbackWarn: false
}))
