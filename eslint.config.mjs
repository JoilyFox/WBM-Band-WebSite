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
      'no-unused-vars': 'warn',
      'vue/require-default-prop': 'off'
    }
  },
  // Disable rules that conflict with Prettier
  prettierConfig
)
