// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  // GitHub Pages Configuration
  app: {
    baseURL: '/WBM-Band-WebSite/', // Replace with your repository name
    buildAssetsDir: 'assets/', // Don't use "_" prefix for GitHub Pages
  },
  
  // Static Site Generation
  nitro: {
    prerender: {
      routes: ['/'] // Pre-render all routes
    }
  },

  // Build configuration for module compatibility
  build: {
    transpile: ['@nuxt/image']
  },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxt/image',
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

  // Image optimization configuration
  image: {
    provider: 'none', // Use 'none' provider for static generation
    quality: 80,
    formats: ['avif', 'webp', 'jpg', 'svg'],
    presets: {
      hero: {
        modifiers: {
          quality: 85,
          fit: 'cover',
          width: 1920,
          height: 1080
        }
      },
      heroMobile: {
        modifiers: {
          quality: 80,
          fit: 'cover',
          width: 768,
          height: 1024
        }
      },
      album: {
        modifiers: {
          quality: 85,
          fit: 'cover',
          width: 400,
          height: 400
        }
      },
      albumLarge: {
        modifiers: {
          quality: 90,
          fit: 'cover',
          width: 800,
          height: 800
        }
      },
      logo: {
        modifiers: {
          format: 'svg'
        }
      }
    }
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
  },

  // Nuxt hooks to handle module compatibility
  hooks: {
    'vite:extendConfig': (config) => {
      if (config.build?.rollupOptions?.external) {
        const external = config.build.rollupOptions.external
        if (typeof external === 'function') {
          const originalExternal = external
          config.build.rollupOptions.external = (id, parentId, isResolved) => {
            // Don't externalize @nuxt/image components we actually need
            if (id.includes('@nuxt/image') && !id.includes('@nuxt/kit')) {
              return false
            }
            return originalExternal(id, parentId, isResolved)
          }
        }
      }
    }
  }
})