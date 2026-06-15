// https://nuxt.com/docs/api/configuration/nuxt-config
import { musicLibrary } from './data/musicLibrary'
import { SOURCE_PREFIXES, assertNoSlugCollisions } from './utils/sourceAttribution'
import { SITE_URL } from './constants/app'
import ukLocale from './locales/uk.json'

const LOCALES = ['ua', 'en'] as const
const RELEASE_SLUGS = musicLibrary.map((r) => r.slug)
// Releases that ship lyrics get a dedicated, indexable /lyrics/<slug> page.
const LYRICS_SLUGS = musicLibrary.filter((r) => r.lyrics && r.lyrics.length > 0).map((r) => r.slug)

// Fail the build loudly if a song slug shadows a reserved source prefix.
assertNoSlugCollisions(RELEASE_SLUGS)

// --- Root (`/`) SEO fallback -------------------------------------------------
// The bare `/` route is a client-only redirect shell (i18n `prefix` strategy),
// so it never runs the homepage's localized useHead — it falls back to the
// app.head below. But `/` is ALSO the canonical Ukrainian home (the home page
// sets `hreflang uk-UA` + canonical → the origin root), so Google indexes the
// ROOT for Ukrainian. If the fallback is a generic English string, Google shows
// English for "WBM" / "Woman Based Mechanics". So the fallback MUST be the
// Ukrainian home meta — and it mirrors the live page by naming the latest
// release, computed here at build time so it tracks musicLibrary automatically.
const latestReleaseTitleUA = (() => {
  const now = Date.now()
  const latest = musicLibrary
    .filter((r) => r.releaseDate && new Date(r.releaseDate).getTime() <= now)
    .sort(
      (a, b) =>
        new Date(b.releaseDate as string).getTime() - new Date(a.releaseDate as string).getTime()
    )[0]
  if (!latest) return ''
  // Resolve the localized (Ukrainian) title via the release's titleKey, falling
  // back to the raw `title` — matches pages/index.vue's `latestReleaseTitle`.
  const localized = latest.titleKey
    ? latest.titleKey
        .split('.')
        .reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], ukLocale)
    : undefined
  return (typeof localized === 'string' ? localized : latest.title) || ''
})()

const ROOT_TITLE_UA = ukLocale.app.home_title
const ROOT_DESCRIPTION_UA = latestReleaseTitleUA
  ? ukLocale.app.meta_description.replace('{release}', latestReleaseTitleUA)
  : `WBM Band — ${ukLocale.app.tagline}.`

const STATIC_ROUTES = [
  '/',
  '/ua',
  '/en',
  '/ua/privacy-policy',
  '/en/privacy-policy',
  '/ua/terms-of-service',
  '/en/terms-of-service',
  '/ua/cookies-policy',
  '/en/cookies-policy'
]

const masterPageRoutes = (): string[] => {
  const routes: string[] = []
  const prefixes = Object.keys(SOURCE_PREFIXES)
  for (const locale of LOCALES) {
    for (const slug of RELEASE_SLUGS) {
      for (const pageType of ['listen', 'pre-save']) {
        routes.push(`/${locale}/${pageType}/${slug}`)
        for (const prefix of prefixes) {
          routes.push(`/${locale}/${pageType}/${prefix}/${slug}`)
        }
      }
    }
    // Dedicated lyrics pages — only for releases that actually ship lyrics, and
    // clean URL only (no source-prefix attribution variants for lyrics).
    for (const slug of LYRICS_SLUGS) {
      routes.push(`/${locale}/lyrics/${slug}`)
    }
  }
  return routes
}

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },

  // GitHub Pages Configuration (only when DEPLOY_TARGET=github)
  app: {
    baseURL: process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite/' : '/',
    buildAssetsDir: '/_nuxt/', // Ensure consistent asset path
    head: {
      // Default <title> for the root redirect shell (`/`) — the canonical
      // Ukrainian home. Every content page overrides this via its own useHead.
      title: ROOT_TITLE_UA,

      // Favicon and App Icon Configuration
      link: [
        // Standard favicon
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') + '/favicon.ico'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/favicon-16x16.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/favicon-32x32.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '48x48',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/favicon-48x48.png'
        },

        // Apple Touch Icons
        {
          rel: 'apple-touch-icon',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '57x57',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-57x57.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '60x60',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-60x60.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '72x72',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-72x72.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '76x76',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-76x76.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '114x114',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-114x114.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '120x120',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-120x120.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '144x144',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-144x144.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '152x152',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-152x152.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '167x167',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-167x167.png'
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/apple-touch-icon-180x180.png'
        },

        // Android Chrome Icons
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/android-chrome-192x192.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '512x512',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/android-chrome-512x512.png'
        },

        // Safari Pinned Tab
        {
          rel: 'mask-icon',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/safari-pinned-tab.svg',
          color: '#000000'
        },

        // Web App Manifest
        {
          rel: 'manifest',
          href:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/site.webmanifest'
        },

        // Font Awesome CSS
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
        }
      ],
      meta: [
        // Standard meta tags
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'format-detection', content: 'telephone=no' },

        // App and PWA meta tags
        { name: 'application-name', content: 'WBM Band' },
        { name: 'apple-mobile-web-app-title', content: 'WBM Band' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'mobile-web-app-capable', content: 'yes' },

        // Theme colors
        { name: 'theme-color', content: '#000000' },
        { name: 'msapplication-TileColor', content: '#000000' },
        {
          name: 'msapplication-config',
          content:
            (process.env.DEPLOY_TARGET === 'github' ? '/WBM-Band-WebSite' : '') +
            '/browserconfig.xml'
        },

        // SEO and Social Media. Fallback meta for any route that doesn't set its
        // own via useHead/useSeoMeta — in practice the bare `/` redirect shell,
        // which is the canonical Ukrainian home (see ROOT_DESCRIPTION_UA above).
        // So this is Ukrainian, not English, and names the latest release to
        // mirror pages/index.vue. The legacy `keywords` meta was removed — Google
        // has ignored it for over a decade and an auto list reads as low-quality.
        {
          name: 'description',
          content: ROOT_DESCRIPTION_UA
        },
        { name: 'author', content: 'Woman Based Mechanics' },

        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'WBM Band' },
        // Ukrainian title/description/locale for the root shell so social
        // unfurls of wbmband.com match Google. Content pages override these.
        { property: 'og:title', content: ROOT_TITLE_UA },
        { property: 'og:description', content: ROOT_DESCRIPTION_UA },
        { property: 'og:locale', content: 'uk_UA' },
        // Branded 1200×630 social card (absolute URL so crawlers/unfurlers
        // resolve it off the real domain, not the GitHub Pages mirror). Pages
        // that share square cover art (release pages) override this with their
        // own square image + `summary` card.
        {
          property: 'og:image',
          content: `${SITE_URL}/images/optimized/meta-images/meta-cover.jpg`
        },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: ROOT_TITLE_UA },
        { name: 'twitter:description', content: ROOT_DESCRIPTION_UA },
        {
          name: 'twitter:image',
          content: `${SITE_URL}/images/optimized/meta-images/meta-cover.jpg`
        }
      ],
      script: [
        {
          key: 'fix-svh-early',
          // Use a data URL to run as early as possible without innerHTML
          src:
            'data:text/javascript;charset=utf-8,' +
            encodeURIComponent(
              "(function(){try{var h=Math.floor((window.visualViewport&&window.visualViewport.height)||window.innerHeight);document.documentElement.style.setProperty('--app-svh',h+'px');document.documentElement.setAttribute('data-svh-ready','1');}catch(e){}})();"
            ),
          defer: false
        }
      ]
    }
  },

  // Static Site Generation. Master-page routes are derived from
  // data/musicLibrary.ts × LOCALES × SOURCE_PREFIXES so adding a new
  // release or a new attribution prefix is a one-line change there
  // rather than dozens of entries here.
  nitro: {
    prerender: {
      routes: [...STATIC_ROUTES, ...masterPageRoutes()],
      failOnError: false // Allow build to succeed even when maintenance mode returns 503 errors
    }
  },

  // Experimental features configuration
  experimental: {
    appManifest: false // Disable app manifest to prevent 404 errors for build metadata in static sites
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    [
      '@nuxtjs/i18n',
      {
        vueI18n: './i18n/i18n.config.ts',
        // Absolute origin so the module can emit correct-host hreflang/canonical
        // alternates (prerequisite for the Phase 2 reciprocal hreflang work).
        baseUrl: SITE_URL,
        lazy: true,
        langDir: 'locales',
        defaultLocale: 'ua',
        strategy: 'prefix',
        detectBrowserLanguage: {
          useCookie: true,
          cookieKey: 'i18n_redirected',
          redirectOn: 'root',
          alwaysRedirect: true,
          fallbackLocale: 'ua'
        },
        locales: [
          { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
          { code: 'ua', language: 'uk-UA', name: 'Українська', file: 'uk.json' }
        ]
      }
    ],
    '@vueuse/nuxt',
    '@nuxt/eslint',
    'nuxt-gtag'
  ],

  // Google Analytics Configuration with Consent Mode v2 default-deny.
  // The CookieConsentToast updates consent on user choice; until then GA4
  // collects only modeled (anonymous, aggregated) data. wait_for_update
  // gives the toast a 500ms head-start to call gtag('consent', 'update')
  // before the first event fires, so users who accept immediately don't
  // pollute the modeled-data path.
  gtag: {
    // Only collect on the real production deploy. Dev servers (localhost/0.0.0.0)
    // and the GitHub Pages staging build were sending events to the production
    // property and accounted for ~86% of its 30-day data, drowning real visitors.
    // useGtag()/useAnalytics() become safe no-ops when disabled.
    enabled: process.env.NODE_ENV !== 'development' && process.env.DEPLOY_TARGET !== 'github',
    id: 'G-Z8QRF6TWC2',
    initCommands: [
      [
        'consent',
        'default',
        {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500
        }
      ]
    ]
  },

  // PrimeVue Configuration
  primevue: {
    options: {
      theme: 'none', // Use unstyled mode for Tailwind integration
      ripple: true,
      inputStyle: 'outlined'
    },
    components: {
      include: '*' // Include all PrimeVue components
    },
    directives: {
      include: ['Ripple', 'Tooltip', 'StyleClass']
    }
  },

  // Tailwind CSS Configuration
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    viewer: true
  },

  // PostCSS Configuration (integrated with Nuxt)
  postcss: {
    plugins: {
      'tailwindcss/nesting': {},
      tailwindcss: {},
      autoprefixer: {}
    }
  },

  // Google Fonts Configuration
  googleFonts: {
    families: {
      'Space Grotesk': [300, 400, 500, 600, 700],
      // Primary UI font with Cyrillic support
      Inter: [300, 400, 500, 600, 700],
      // Cyrillic-friendly grotesks close to Space Grotesk
      Manrope: [300, 400, 500, 600, 700],
      'Golos Text': [400, 500, 600, 700],
      // Add a Cyrillic-capable fallback
      'Noto Sans': [400, 500, 600, 700]
    },
    display: 'swap',
    preload: true,
    subsets: ['latin', 'latin-ext', 'cyrillic']
  },

  // TypeScript Configuration
  typescript: {
    strict: true,
    typeCheck: false
  },

  // Vite configuration for additional optimizations
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    }
  },

  // Runtime configuration
  runtimeConfig: {
    public: {
      imageOptimization: {
        enableLazyLoading: true,
        enableProgressiveLoading: true,
        enableBlurPlaceholder: true
      }
    }
  }
})
