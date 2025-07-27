// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@nuxt/image'
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

  // Google Fonts Configuration
  googleFonts: {
    families: {
      'Space Grotesk': [300, 400, 500, 600, 700]
    },
    display: 'swap',
    preload: true
  },

  // Global CSS
  css: [
    '~/assets/css/main.css'
  ],

  // Image optimization configuration
  image: {
    quality: 90,
    format: ['webp', 'jpg'],
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
          format: 'webp',
          quality: 95,
          fit: 'cover'
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
  }
})