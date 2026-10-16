import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default withNuxt(
  // Prettier integration
  {
    plugins: {
      prettier
    },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      // The base rule double-reports every unused TS binding (and false-positives on
      // type-only names); the @typescript-eslint rule above is the one that counts.
      'no-unused-vars': 'off',
      'vue/require-default-prop': 'off'
    }
  },
  // Specs stub framework internals (routers, i18n, stores) with loose mocks, so
  // `any` there is noise rather than a signal.
  {
    files: ['test/**/*.{ts,vue}'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' }
  },
  // Disable rules that conflict with Prettier
  prettierConfig
)
