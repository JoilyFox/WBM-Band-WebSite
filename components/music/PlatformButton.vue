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
    icon: 'pi pi-play-circle',
    color: '#1DB954',
    gradient: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)'
  },
  appleMusic: {
    name: 'Apple Music',
    icon: 'pi pi-play-circle',
    color: '#FA243C',
    gradient: 'linear-gradient(135deg, #FA243C 0%, #ff4757 100%)'
  },
  youtubeMusic: {
    name: 'YouTube Music',
    icon: 'pi pi-video',
    color: '#FF0000',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #ff4444 100%)'
  },
  deezer: {
    name: 'Deezer',
    icon: 'pi pi-headphones',
    color: '#FF9500',
    gradient: 'linear-gradient(135deg, #FF9500 0%, #ffb347 100%)'
  },
  soundcloud: {
    name: 'SoundCloud',
    icon: 'pi pi-cloud',
    color: '#FF5500',
    gradient: 'linear-gradient(135deg, #FF5500 0%, #ff7733 100%)'
  },
  bandcamp: {
    name: 'Bandcamp',
    icon: 'pi pi-disc',
    color: '#629AA0',
    gradient: 'linear-gradient(135deg, #629AA0 0%, #7bb3bb 100%)'
  },
  tidal: {
    name: 'Tidal',
    icon: 'pi pi-play',
    color: '#000000',
    gradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)'
  },
  amazonMusic: {
    name: 'Amazon Music',
    icon: 'pi pi-shopping-cart',
    color: '#FF9900',
    gradient: 'linear-gradient(135deg, #FF9900 0%, #ffb84d 100%)'
  }
}

const defaultConfig = {
  name: props.platform,
  icon: 'pi pi-music',
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
  padding: 1rem 1.5rem;
  
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  color: white;
  text-decoration: none;
  
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.platform-button::before {
  content: '';
  position: absolute;
  inset: 0;
  background: v-bind('config.gradient');
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: -1;
}

.platform-button:hover::before {
  opacity: 0.8;
}

.platform-button:hover {
  transform: translateY(-2px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.platform-button:active {
  transform: translateY(-1px) scale(1.01);
}

.platform-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  display: flex;
  align-items: center;
  justify-content: center;
  
  font-size: 1.25rem;
  
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.platform-button:hover .platform-icon {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.platform-content {
  flex: 1;
  min-width: 0;
}

.platform-name {
  display: block;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 0.25rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.platform-action {
  display: block;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.platform-arrow {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.platform-button:hover .platform-arrow {
  color: white;
  transform: translateX(2px);
}

/* Specific platform adjustments */
.platform-spotify:hover .platform-icon {
  box-shadow: 0 0 20px rgba(29, 185, 84, 0.4);
}

.platform-appleMusic:hover .platform-icon {
  box-shadow: 0 0 20px rgba(250, 36, 60, 0.4);
}

.platform-youtubeMusic:hover .platform-icon {
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.4);
}

.platform-deezer:hover .platform-icon {
  box-shadow: 0 0 20px rgba(255, 149, 0, 0.4);
}

.platform-soundcloud:hover .platform-icon {
  box-shadow: 0 0 20px rgba(255, 85, 0, 0.4);
}

.platform-bandcamp:hover .platform-icon {
  box-shadow: 0 0 20px rgba(98, 154, 160, 0.4);
}

.platform-tidal:hover .platform-icon {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
}

.platform-amazonMusic:hover .platform-icon {
  box-shadow: 0 0 20px rgba(255, 153, 0, 0.4);
}

/* Mobile optimizations - no hover effects */
@media (max-width: 768px) {
  .platform-button:hover {
    transform: none;
  }
  
  .platform-button:hover::before {
    opacity: 0;
  }
  
  .platform-button:hover .platform-icon {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: none;
    box-shadow: none;
  }
  
  .platform-button:hover .platform-arrow {
    color: rgba(255, 255, 255, 0.6);
    transform: none;
  }
  
  /* Active states for mobile */
  .platform-button:active {
    transform: scale(0.98);
  }
  
  .platform-button:active::before {
    opacity: 0.6;
  }
  
  .platform-button:active .platform-icon {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(0.95);
  }
  
  .platform-button {
    padding: 0.875rem 1.25rem;
  }
  
  .platform-icon {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1.125rem;
  }
  
  .platform-name {
    font-size: 1rem;
  }
  
  .platform-action {
    font-size: 0.8125rem;
  }
}

@media (max-width: 480px) {
  .platform-button {
    padding: 0.75rem 1rem;
    gap: 0.875rem;
  }
  
  .platform-icon {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
  
  .platform-name {
    font-size: 0.9375rem;
  }
}
</style>
