<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="platform-button"
    :class="[platformClass, performanceClass]"
    :style="performanceCSSVars"
    @click="handleClick"
  >
    <div class="platform-icon">
      <i :class="platformIcon"></i>
    </div>
    <div class="platform-content">
      <span class="platform-name">{{ platformName }}</span>
      <span class="platform-action">{{ listenNowLabel }}</span>
    </div>
    <div class="platform-arrow">
      <i class="pi pi-external-link"></i>
    </div>
  </a>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { usePerformanceOptimization } from '~/composables/usePerformanceOptimization'
  import { useI18n } from 'vue-i18n'

  import { useAnalytics } from '~/composables/useAnalytics'

  interface Props {
    platform: string
    url: string
    isPreSave?: boolean
    releaseSlug?: string
    pageType?: 'listen' | 'pre-save'
  }

  const props = withDefaults(defineProps<Props>(), {
    isPreSave: false,
    releaseSlug: '',
    pageType: 'listen'
  })
  const { t, locale } = useI18n({ useScope: 'global' })

  // Performance optimization
  const { shouldUseMobileFallback, performanceCSSVars, getPerformanceClass } =
    usePerformanceOptimization()

  const performanceClass = computed(() => getPerformanceClass())

  const platformConfig = {
    spotify: {
      name: 'Spotify',
      icon: 'fab fa-spotify',
      color: '#1DB954',
      gradient: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)'
    },
    appleMusic: {
      name: 'Apple Music',
      icon: 'fab fa-apple',
      color: '#FA243C',
      gradient: 'linear-gradient(135deg, #FA243C 0%, #ff4757 100%)'
    },
    youtubeMusic: {
      name: 'YouTube Music',
      icon: 'fas fa-play-circle',
      color: '#FF0000',
      gradient: 'linear-gradient(135deg, #FF0000 0%, #ff4444 100%)'
    },
    youtube: {
      name: 'YouTube',
      icon: 'fab fa-youtube',
      color: '#FF0000',
      gradient: 'linear-gradient(135deg, #FF0000 0%, #ff4444 100%)'
    },
    deezer: {
      name: 'Deezer',
      icon: 'fas fa-music',
      color: '#FF9500',
      gradient: 'linear-gradient(135deg, #FF9500 0%, #ffb347 100%)'
    },
    soundcloud: {
      name: 'SoundCloud',
      icon: 'fab fa-soundcloud',
      color: '#FF5500',
      gradient: 'linear-gradient(135deg, #FF5500 0%, #ff7733 100%)'
    },
    bandcamp: {
      name: 'Bandcamp',
      icon: 'fab fa-bandcamp',
      color: '#629AA0',
      gradient: 'linear-gradient(135deg, #629AA0 0%, #7bb3bb 100%)'
    },
    tidal: {
      name: 'Tidal',
      icon: 'fas fa-water',
      color: '#000000',
      gradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)'
    },
    amazonMusic: {
      name: 'Amazon Music',
      icon: 'fab fa-amazon',
      color: '#FF9900',
      gradient: 'linear-gradient(135deg, #FF9900 0%, #ffb84d 100%)'
    },
    pandora: {
      name: 'Pandora',
      icon: 'fas fa-radio',
      color: '#005483',
      gradient: 'linear-gradient(135deg, #005483 0%, #0074b7 100%)'
    },
    googlePlay: {
      name: 'Google Play Music',
      icon: 'fab fa-google-play',
      color: '#FF6F00',
      gradient: 'linear-gradient(135deg, #FF6F00 0%, #ff8f00 100%)'
    },
    itunes: {
      name: 'iTunes',
      icon: 'fab fa-itunes',
      color: '#FA243C',
      gradient: 'linear-gradient(135deg, #FA243C 0%, #ff4757 100%)'
    },
    musicVideo: {
      name: 'YouTube',
      icon: 'fab fa-youtube',
      color: '#FF0000',
      gradient: 'linear-gradient(135deg, #FF0000 0%, #ff4444 100%)'
    }
  }

  const defaultConfig = {
    name: props.platform,
    icon: 'fas fa-music',
    color: '#6B7280',
    gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)'
  }

  const config = computed(() => {
    return platformConfig[props.platform as keyof typeof platformConfig] || defaultConfig
  })

  const platformName = computed(() => config.value.name)
  const platformIcon = computed(() => config.value.icon)
  const platformClass = computed(() => `platform-${props.platform}`)

  const listenNowLabel = computed(() => {
    if (props.isPreSave) {
      return t('music.detail.presave_title')
    }
    if (props.platform === 'musicVideo') {
      return t('music.buttons.watch_video')
    }
    return t('music.buttons.listen_now')
  })

  const { trackPlatformClick } = useAnalytics()

  const handleClick = () => {
    if (!props.releaseSlug) return
    trackPlatformClick({
      platformName: props.platform,
      releaseSlug: props.releaseSlug,
      pageType: props.pageType
    })
  }
</script>

<style scoped lang="scss">
  /* SCSS Variables for Performance System */
  $perf-blur-strength: 18px;
  $perf-animation-duration: 0.15s;
  $perf-icon-blur: 10px;
  $perf-glow-blur: 8px;
  $button-border-radius: 18px;
  $icon-border-radius: 14px;
  $glow-border-radius: 16px;

  // Performance optimization variables
  $perf-low-duration: 0.2s;
  $perf-medium-blur: 6px;
  $perf-medium-icon-blur: 4px;
  $perf-medium-glow-blur: 4px;

  // Mobile optimization variables
  $mobile-blur: 6px;
  $mobile-icon-blur: 4px;
  $mobile-glow-blur: 4px;
  $mobile-duration: 0.2s;
  $mobile-flagship-blur: 12px;
  $mobile-flagship-icon-blur: 8px;
  $mobile-flagship-glow-blur: 6px;
  $mobile-flagship-duration: 0.3s;

  $mobile-flagship-blur: 12px;
  $mobile-flagship-icon-blur: 8px;
  $mobile-flagship-glow-blur: 6px;
  $mobile-flagship-duration: 0.3s;

  .platform-button {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.1rem 1.6rem;
    position: relative;
    overflow: hidden;
    border-radius: $button-border-radius;

    background: rgba(8, 8, 8, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur($perf-blur-strength) saturate(120%);
    -webkit-backdrop-filter: blur($perf-blur-strength) saturate(120%);
    color: white;
    text-decoration: none;
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba(255, 255, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transition:
      transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1),
      border-color $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  /* Performance-aware gradient aurora edge */
  .platform-button::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: $button-border-radius;
    padding: 1px;
    background: v-bind('config.gradient');
    opacity: 0.25;
    transition: opacity $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  /* Performance-aware soft inner glow + liquid-lite specular rim & top sheen */
  .platform-button::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: inherit;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, transparent 38%),
      radial-gradient(120% 150% at -10% -20%, rgba(255, 255, 255, 0.06), transparent 60%),
      radial-gradient(120% 150% at 110% 120%, rgba(255, 255, 255, 0.04), transparent 60%);
    box-shadow:
      inset 1.5px 1.5px 1px -1px rgba(255, 255, 255, 0.35),
      inset -1px -1px 1px -1px rgba(255, 255, 255, 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    opacity: 0.6;
    pointer-events: none;
    transition: opacity $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Desktop hover effects only - performance aware */
  @media (hover: hover) and (pointer: fine) {
    .platform-button:hover {
      transform: translateY(-3px) scale(1.02);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.15);
    }

    .platform-button:hover::before {
      opacity: 0.6;
    }

    .platform-button:hover::after {
      opacity: 0.9;
    }

    .platform-button:hover .platform-icon {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.4);
      transform: scale(1.1) rotate(5deg);
    }

    .platform-button:hover .platform-icon::before {
      opacity: 0.6;
      filter: blur(12px);
    }

    .platform-button:hover .platform-arrow {
      transform: translateX(4px) scale(1.1);
      opacity: 1;
    }

    .platform-button:hover .platform-name {
      text-shadow:
        0 3px 6px rgba(0, 0, 0, 0.45),
        0 0 20px rgba(255, 255, 255, 0.1);
    }
  }

  .platform-icon {
    position: relative;
    z-index: 2;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: $icon-border-radius;
    display: grid;
    place-items: center;
    font-size: 1.25rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur($perf-icon-blur);
    -webkit-backdrop-filter: blur($perf-icon-blur);
    transition:
      transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1),
      background $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1),
      border-color $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  /* Performance-aware icon glow ring */
  .platform-icon::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: $glow-border-radius;
    background: v-bind('config.gradient');
    opacity: 0.35;
    filter: blur($perf-glow-blur);
    z-index: -1;
    transition:
      opacity $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1),
      filter $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
  }

  .platform-content {
    position: relative;
    z-index: 2;
    flex: 1;
    min-width: 0;
    transition: transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
  }

  .platform-name {
    display: block;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.3;
    margin-bottom: 0.2rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
    transition: text-shadow $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
  }

  .platform-action {
    display: block;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.75);
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    letter-spacing: 0.02em;
    transition: color $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
  }

  .platform-arrow {
    position: relative;
    z-index: 2;
    opacity: 0.8;
    transition:
      transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1),
      opacity $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  /* Mobile and touch device interactions */
  @media (hover: none) and (pointer: coarse) {
    .platform-button:active {
      transform: translateY(-1px) scale(0.98);
      transition: transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
    }

    .platform-button:active .platform-icon {
      transform: scale(0.95);
      transition: transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
    }

    .platform-button:active .platform-arrow {
      transform: translateX(2px);
      transition: transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  /* Fallback for devices that support both hover and touch */
  @media (hover: hover) and (pointer: coarse) {
    .platform-button:hover {
      transform: none; /* Disable hover on touch-capable devices */
    }

    .platform-button:active {
      transform: translateY(-1px) scale(0.98);
      transition: transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  /* Active state for all devices */
  .platform-button:active {
    transform: translateY(-1px) scale(1.005);
    transition: transform $perf-animation-duration cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* High-contrast focus style without browser outlines */
  .platform-button:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(255, 255, 255, 0.2),
      0 10px 40px rgba(0, 0, 0, 0.35);
  }

  /* Performance Optimizations */
  .perf-low .platform-button {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background: transparent !important;
    transition:
      transform $perf-low-duration ease,
      background-color $perf-low-duration ease !important;
  }

  .perf-low .platform-button::before {
    opacity: 0.15 !important;
    transition: opacity $perf-low-duration ease !important;
  }

  .perf-low .platform-button::after {
    display: none !important;
  }

  .perf-low .platform-icon {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    /* Use platform color from JS config for background */
    background: v-bind('config.color + "30"') !important;
    border-radius: $glow-border-radius;
    /* Add clear colored box-shadow for performance-friendly glow */
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.3),
      0 0 8px v-bind('config.color + "40"'),
      0 0 12px v-bind('config.color + "30"'),
      inset 0 1px 0 v-bind('config.color + "20"') !important;
  }

  .perf-low .platform-icon::before {
    /* Remove blur for performance, keep color from config */
    filter: none !important;
    opacity: 0.4 !important;
    background: v-bind('config.gradient') !important;
  }

  .perf-medium .platform-button {
    backdrop-filter: blur($perf-medium-blur) !important;
    -webkit-backdrop-filter: blur($perf-medium-blur) !important;
  }

  .perf-medium .platform-icon {
    backdrop-filter: blur($perf-medium-icon-blur) !important;
    -webkit-backdrop-filter: blur($perf-medium-icon-blur) !important;
  }

  .perf-medium .platform-icon::before {
    filter: blur($perf-medium-glow-blur) !important;
  }

  /* Mobile Performance Modes */
  .mobile-conservative .platform-button {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background: transparent !important;
    transition:
      transform 0.15s ease,
      background-color 0.15s ease !important;
  }

  .mobile-conservative .platform-button::before,
  .mobile-conservative .platform-button::after {
    display: none !important;
  }

  .mobile-conservative .platform-icon {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    transition:
      transform 0.15s ease,
      background-color 0.15s ease !important;
  }

  .mobile-conservative .platform-icon::before {
    display: none !important;
  }

  .mobile-standard .platform-button {
    backdrop-filter: blur(6px) !important;
    -webkit-backdrop-filter: blur(6px) !important;
    transition: transform 0.2s ease !important;
  }

  .mobile-standard .platform-icon {
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
  }

  .mobile-standard .platform-icon::before {
    filter: blur(4px) !important;
    opacity: 0.25 !important;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .platform-button,
    .platform-icon,
    .platform-content,
    .platform-arrow {
      transition: none !important;
      animation: none !important;
    }

    .platform-button:hover {
      transform: none !important;
    }

    .platform-icon::before {
      filter: none !important;
    }
  }

  /* Mobile-first optimizations */
  @media screen and (max-width: 768px) {
    .platform-button {
      backdrop-filter: blur($mobile-blur) !important;
      -webkit-backdrop-filter: blur($mobile-blur) !important;
      transition:
        transform $mobile-duration ease,
        background-color $mobile-duration ease !important;
    }

    .platform-icon {
      backdrop-filter: blur($mobile-icon-blur) !important;
      -webkit-backdrop-filter: blur($mobile-icon-blur) !important;
    }

    .platform-icon::before {
      filter: blur($mobile-glow-blur) !important;
      opacity: 0.25 !important;
    }

    /* Override for flagship devices */
    .mobile-flagship .platform-button {
      backdrop-filter: blur($mobile-flagship-blur) !important;
      -webkit-backdrop-filter: blur($mobile-flagship-blur) !important;
      transition: transform $mobile-flagship-duration ease !important;
    }

    .mobile-flagship .platform-icon {
      backdrop-filter: blur($mobile-flagship-icon-blur) !important;
      -webkit-backdrop-filter: blur($mobile-flagship-icon-blur) !important;
    }

    .mobile-flagship .platform-icon::before {
      filter: blur($mobile-flagship-glow-blur) !important;
      opacity: 0.35 !important;
    }
  }
</style>
