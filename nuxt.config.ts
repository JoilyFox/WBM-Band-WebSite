// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  // GitHub Pages Configuration
  app: {
    baseURL: process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite/' : '/',
    buildAssetsDir: process.env.NODE_ENV === 'production' ? 'assets/' : '_nuxt/',
    head: {
      // Favicon and App Icon Configuration
      link: [
        // Standard favicon
        { rel: 'icon', type: 'image/x-icon', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/favicon-48x48.png' },
        
        // Apple Touch Icons
        { rel: 'apple-touch-icon', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '57x57', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-57x57.png' },
        { rel: 'apple-touch-icon', sizes: '60x60', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-60x60.png' },
        { rel: 'apple-touch-icon', sizes: '72x72', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-72x72.png' },
        { rel: 'apple-touch-icon', sizes: '76x76', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-76x76.png' },
        { rel: 'apple-touch-icon', sizes: '114x114', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-114x114.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-120x120.png' },
        { rel: 'apple-touch-icon', sizes: '144x144', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-144x144.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '167x167', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-167x167.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/apple-touch-icon-180x180.png' },
        
        // Android Chrome Icons
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/android-chrome-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/android-chrome-512x512.png' },
        
        // Safari Pinned Tab
        { rel: 'mask-icon', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/safari-pinned-tab.svg', color: '#000000' },
        
        // Web App Manifest
        { rel: 'manifest', href: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/site.webmanifest' },
        
        // Font Awesome CSS
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css' }
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
  { name: 'msapplication-config', content: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/browserconfig.xml' },
        
        // SEO and Social Media
        { name: 'description', content: 'Official website of WBM Band - Discover our music, latest releases, and upcoming shows.' },
        { name: 'keywords', content: 'WBM Band, music, band, rock, alternative, concerts, albums' },
        { name: 'author', content: 'WBM Band' },
        
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'WBM Band' },
  { property: 'og:image', content: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/android-chrome-512x512.png' },
        { property: 'og:image:width', content: '512' },
        { property: 'og:image:height', content: '512' },
        
        // Twitter Card
        { name: 'twitter:card', content: 'summary' },
  { name: 'twitter:image', content: (process.env.NODE_ENV === 'production' ? '/WBM-Band-WebSite' : '') + '/android-chrome-512x512.png' }
      ]
      ,
      script: [
        {
          key: 'fix-svh-early',
          // Use a data URL to run as early as possible without innerHTML
          src: 'data:text/javascript;charset=utf-8,' + encodeURIComponent("(function(){try{var h=Math.floor((window.visualViewport&&window.visualViewport.height)||window.innerHeight);document.documentElement.style.setProperty('--app-svh',h+'px');document.documentElement.setAttribute('data-svh-ready','1');}catch(e){}})();"),
          defer: false
        }
      ]
    }
  },
  
  // Static Site Generation
  nitro: {
    prerender: {
      routes: [
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
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    ['@nuxtjs/i18n', {
        vueI18n: './plugins/i18n.config.ts',
        lazy: true,
        langDir: 'locales',
        defaultLocale: 'ua',
        strategy: 'prefix',
        detectBrowserLanguage: {
          useCookie: true,
          cookieKey: 'i18n_redirected',
          redirectOn: 'root',
          alwaysRedirect: false
        },
        locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ua', language: 'uk-UA', name: 'Українська', file: 'uk.json' }
        ]
      }], 
      '@vueuse/nuxt'
  ],

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
  css: [
    '~/assets/css/main.css'
  ],

  postcss: {
    plugins: {
      'tailwindcss/nesting': {},
      tailwindcss: {},
      autoprefixer: {},
    },
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