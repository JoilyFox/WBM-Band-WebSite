// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt'
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

  // TypeScript Configuration
  typescript: {
    strict: true,
    typeCheck: false
  }
})