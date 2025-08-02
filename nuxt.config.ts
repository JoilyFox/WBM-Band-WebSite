// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  // GitHub Pages Configuration
  app: {
    baseURL: '/WBM-Band-WebSite/', // Replace with your repository name
    buildAssetsDir: 'assets/', // Don't use "_" prefix for GitHub Pages
    head: {
      // Favicon and App Icon Configuration
      link: [
        // Standard favicon
        { rel: 'icon', type: 'image/x-icon', href: '/WBM-Band-WebSite/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/WBM-Band-WebSite/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/WBM-Band-WebSite/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/WBM-Band-WebSite/favicon-48x48.png' },
        
        // Apple Touch Icons
        { rel: 'apple-touch-icon', href: '/WBM-Band-WebSite/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '57x57', href: '/WBM-Band-WebSite/apple-touch-icon-57x57.png' },
        { rel: 'apple-touch-icon', sizes: '60x60', href: '/WBM-Band-WebSite/apple-touch-icon-60x60.png' },
        { rel: 'apple-touch-icon', sizes: '72x72', href: '/WBM-Band-WebSite/apple-touch-icon-72x72.png' },
        { rel: 'apple-touch-icon', sizes: '76x76', href: '/WBM-Band-WebSite/apple-touch-icon-76x76.png' },
        { rel: 'apple-touch-icon', sizes: '114x114', href: '/WBM-Band-WebSite/apple-touch-icon-114x114.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/WBM-Band-WebSite/apple-touch-icon-120x120.png' },
        { rel: 'apple-touch-icon', sizes: '144x144', href: '/WBM-Band-WebSite/apple-touch-icon-144x144.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/WBM-Band-WebSite/apple-touch-icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '167x167', href: '/WBM-Band-WebSite/apple-touch-icon-167x167.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/WBM-Band-WebSite/apple-touch-icon-180x180.png' },
        
        // Android Chrome Icons
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/WBM-Band-WebSite/android-chrome-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/WBM-Band-WebSite/android-chrome-512x512.png' },
        
        // Safari Pinned Tab
        { rel: 'mask-icon', href: '/WBM-Band-WebSite/safari-pinned-tab.svg', color: '#000000' },
        
        // Web App Manifest
        { rel: 'manifest', href: '/WBM-Band-WebSite/site.webmanifest' },
        
        // Preload critical resources
        { rel: 'preload', as: 'image', href: '/WBM-Band-WebSite/favicon-32x32.png' }
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
        { name: 'msapplication-config', content: '/WBM-Band-WebSite/browserconfig.xml' },
        
        // SEO and Social Media
        { name: 'description', content: 'Official website of WBM Band - Discover our music, latest releases, and upcoming shows.' },
        { name: 'keywords', content: 'WBM Band, music, band, rock, alternative, concerts, albums' },
        { name: 'author', content: 'WBM Band' },
        
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'WBM Band' },
        { property: 'og:image', content: '/WBM-Band-WebSite/android-chrome-512x512.png' },
        { property: 'og:image:width', content: '512' },
        { property: 'og:image:height', content: '512' },
        
        // Twitter Card
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:image', content: '/WBM-Band-WebSite/android-chrome-512x512.png' }
      ]
    }
  },
  
  // Static Site Generation
  nitro: {
    prerender: {
      routes: ['/'] // Pre-render all routes
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
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
      'Space Grotesk': [300, 400, 500, 600, 700]
    },
    display: 'swap',
    preload: true
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