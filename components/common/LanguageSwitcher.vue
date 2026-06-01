<template>
  <div>
    <label v-if="showLabel" class="sr-only">{{ t('lang.switch_label') }}</label>
    <button
      type="button"
      :class="['lang-switch', { 'lang-switch--big': size === 'big' }]"
      :aria-label="t('lang.switch_label')"
      :aria-pressed="true"
      @click="toggleLocale"
    >
      <span
        class="lang-btn"
        :class="[{ active: locale === 'en' }, size === 'big' ? 'lang-btn--big' : '']"
      >
        EN
      </span>
      <span
        class="lang-btn"
        :class="[{ active: locale === 'ua' }, size === 'big' ? 'lang-btn--big' : '']"
      >
        УКР
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
  // Reusable language switcher using @nuxtjs/i18n composables
  import { useI18n } from 'vue-i18n'

  const props = withDefaults(
    defineProps<{
      showLabel?: boolean
      size?: 'normal' | 'big'
    }>(),
    {
      showLabel: false,
      size: 'normal'
    }
  )

  const { locale, setLocale, t } = useI18n()

  const toggleLocale = async () => {
    const next = locale.value === 'en' ? 'ua' : 'en'
    await setLocale(next)
  }
</script>

<style scoped>
  .lang-switch {
    display: inline-flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 9999px;
    padding: 2px;
    gap: 2px;
    backdrop-filter: blur(6px);
  }
  .lang-switch--big {
    padding: 2px; /* keep container compact */
    gap: 3px;
  }
  .lang-btn {
    font-size: 0.75rem;
    line-height: 1;
    color: rgba(255, 255, 255, 0.8);
    padding: 6px 10px;
    border-radius: 9999px;
    transition: all 0.2s ease;
  }
  .lang-btn--big {
    font-size: 0.8125rem; /* ~13px */
    padding: 8px 12px; /* ~1.33x height, ~1.2x width */
  }
  @media (hover: hover) and (pointer: fine) {
    .lang-btn:hover {
      color: #fff;
    }
  }
  .lang-btn.active {
    color: #000;
    background: #fff;
  }
</style>
