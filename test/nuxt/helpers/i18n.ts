/**
 * Locale control for the `nuxt` test project.
 *
 * i18n runs LIVE in these tests, and `lazy: true` means a locale's messages are
 * only in memory once something has loaded them. The app boots at the real
 * `defaultLocale` ('ua'), so `uk.json` is the only bundle present — writing
 * `$i18n.locale.value = 'en'` on its own just silently keeps rendering
 * Ukrainian.
 *
 * Historically this happened to work: `detectBrowserLanguage` saw happy-dom's
 * en-US navigator and booted the suite in English. That same auto-detection is
 * what made Googlebot render the English home at `/` (docs/search-console.md),
 * so it was switched off — and with it went the implicit English bundle. Tests
 * now state the locale they want, and this helper makes sure its messages are
 * actually loaded first.
 *
 * Call inside a test or hook (it uses `useNuxtApp()`), and always `await` it.
 */
type TestLocale = 'ua' | 'en'

interface TestI18n {
  locale: { value: string }
  loadLocaleMessages: (locale: string) => Promise<unknown>
}

export const setTestLocale = async (locale: TestLocale) => {
  const i18n = (useNuxtApp() as unknown as { $i18n: TestI18n }).$i18n
  await i18n.loadLocaleMessages(locale)
  i18n.locale.value = locale
}
