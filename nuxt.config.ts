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
    provider: 'ipx',
    quality: 80,
    format: ['avif', 'webp', 'jpg', 'svg'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    densities: [1, 2],
    presets: {
      hero: {
        modifiers: {
          format: 'avif,webp,jpg',
          quality: 85,
          fit: 'cover',
          width: 1920,
          height: 1080
        }
      },
      heroMobile: {
        modifiers: {
          format: 'avif,webp,jpg',
          quality: 80,
          fit: 'cover',
          width: 768,
          height: 1024
        }
      },
      album: {
        modifiers: {
          format: 'avif,webp,jpg',
          quality: 85,
          fit: 'cover',
          width: 400,
          height: 400
        }
      },
      albumLarge: {
        modifiers: {
          format: 'avif,webp,jpg',
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
    },
    domains: [],
    alias: {},
    dir: 'public'
  },

  // TypeScript Configuration
  typescript: {
    strict: true,
    typeCheck: false
  },

  // Vite configuration for additional optimizations
  vite: {
    optimizeDeps: {
      include: ['@nuxt/image']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'image-utils': ['@nuxt/image']
          }
        }
      }
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