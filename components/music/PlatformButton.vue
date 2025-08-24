<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="platform-button"
    :class="platformClass"
    @click="handleClick"
  >
    <div class="platform-icon">
      <i :class="platformIcon"></i>
    </div>
    <div class="platform-content">
      <span class="platform-name">{{ platformName }}</span>
      <span class="platform-action">Listen Now</span>
    </div>
    <div class="platform-arrow">
      <i class="pi pi-external-link"></i>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  platform: string
  url: string
}

const props = defineProps<Props>()

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
    icon: 'fab fa-youtube',
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

const handleClick = () => {
  // Optional: Add analytics tracking here
  console.log(`Clicked ${platformName.value} link`)
}
</script>

<style scoped>
.platform-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.6rem;
  position: relative;
  overflow: hidden;
  border-radius: 18px;

  background: rgba(8, 8, 8, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(18px) saturate(120%);
  -webkit-backdrop-filter: blur(18px) saturate(120%);
  color: white;
  text-decoration: none;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: transform .3s cubic-bezier(0.4, 0, 0.2, 1), 
              box-shadow .4s cubic-bezier(0.4, 0, 0.2, 1), 
              border-color .4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* Gradient aurora edge */
.platform-button::before {
  content: '';
  position: absolute; inset: -1px;
  border-radius: 18px;
  padding: 1px;
  background: v-bind('config.gradient');
  opacity: .25;
  transition: opacity .4s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  pointer-events: none;
}

/* Soft inner glow */
.platform-button::after {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(120% 150% at -10% -20%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(120% 150% at 110% 120%, rgba(255,255,255,.04), transparent 60%);
  opacity: .6;
  pointer-events: none;
  transition: opacity .4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Desktop hover effects only */
@media (hover: hover) and (pointer: fine) {
  .platform-button:hover {
    transform: translateY(-3px) scale(1.02);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.15);
  }

  .platform-button:hover::before {
    opacity: .6;
  }

  .platform-button:hover::after {
    opacity: .9;
  }

  .platform-button:hover .platform-icon {
    background: rgba(255,255,255,0.18);
    border-color: rgba(255,255,255,0.4);
    transform: scale(1.1) rotate(5deg);
  }

  .platform-button:hover .platform-icon::before {
    opacity: .6;
    filter: blur(12px);
  }

  .platform-button:hover .platform-arrow {
    transform: translateX(4px) scale(1.1);
    opacity: 1;
  }

  .platform-button:hover .platform-name {
    text-shadow: 0 3px 6px rgba(0,0,0,.45), 0 0 20px rgba(255,255,255,.1);
  }
}

.platform-icon {
  position: relative;
  width: 2.6rem; height: 2.6rem;
  border-radius: 14px;
  display: grid; place-items: center;
  font-size: 1.25rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform .4s cubic-bezier(0.4, 0, 0.2, 1), 
              background .4s cubic-bezier(0.4, 0, 0.2, 1), 
              border-color .4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* Icon glow ring */
.platform-icon::before {
  content: '';
  position: absolute; inset: -3px;
  border-radius: 16px;
  background: v-bind('config.gradient');
  opacity: .35;
  filter: blur(8px);
  z-index: -1;
  transition: opacity .4s cubic-bezier(0.4, 0, 0.2, 1), 
              filter .4s cubic-bezier(0.4, 0, 0.2, 1);
}

.platform-content { 
  flex: 1; 
  min-width: 0; 
  transition: transform .3s cubic-bezier(0.4, 0, 0.2, 1);
}

.platform-name { 
  display: block; 
  font-size: 1.1rem; 
  font-weight: 800; 
  line-height: 1.3; 
  margin-bottom: .2rem; 
  text-shadow: 0 2px 4px rgba(0,0,0,.35);
  transition: text-shadow .4s cubic-bezier(0.4, 0, 0.2, 1);
}

.platform-action { 
  display: block; 
  font-size: .85rem; 
  color: rgba(255,255,255,.75); 
  font-weight: 600; 
  text-shadow: 0 1px 2px rgba(0,0,0,.3); 
  letter-spacing: .02em;
  transition: color .3s cubic-bezier(0.4, 0, 0.2, 1);
}

.platform-arrow { 
  opacity: .8; 
  transition: transform .4s cubic-bezier(0.4, 0, 0.2, 1), 
              opacity .3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* Mobile and touch device interactions */
@media (hover: none) and (pointer: coarse) {
  .platform-button:active {
    transform: translateY(-1px) scale(0.98);
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .platform-button:active .platform-icon {
    transform: scale(0.95);
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .platform-button:active .platform-arrow {
    transform: translateX(2px);
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Fallback for devices that support both hover and touch */
@media (hover: hover) and (pointer: coarse) {
  .platform-button:hover {
    transform: none; /* Disable hover on touch-capable devices */
  }
  
  .platform-button:active {
    transform: translateY(-1px) scale(0.98);
    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Active state for all devices */
.platform-button:active { 
  transform: translateY(-1px) scale(1.005); 
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

/* High-contrast focus style without browser outlines */
.platform-button:focus-visible { 
  outline: none; 
  box-shadow: 0 0 0 3px rgba(255,255,255,.2), 
              0 10px 40px rgba(0, 0, 0, 0.35);
}
</style>
