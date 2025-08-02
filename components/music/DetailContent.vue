<template>
  <div class="music-detail-content">
    <!-- Hero Section with Album Cover -->
    <div class="music-hero">
      <div class="music-hero-background">
        <!-- Background Image with Blur Effect -->
        <UiProgressiveImage
          :src="release.imageUrl"
          :alt="`${release.title} background`"
          container-class="absolute inset-0"
          image-class="w-full h-full object-cover"
          loading="eager"
          preset="hero"
          :show-placeholder="false"
        />
        <div class="music-hero-overlay"></div>
      </div>
      
      <div class="music-hero-content">
        <div class="music-album-cover">
          <UiProgressiveImage
            :src="release.imageUrl"
            :alt="release.title"
            container-class="w-full h-full"
            image-class="w-full h-full object-cover"
            loading="eager"
            preset="album"
            :show-placeholder="true"
          />
          
          <!-- Release Type Badge -->
          <div class="music-badge">
            <span :class="badgeClass">
              {{ release.type }}
            </span>
          </div>
        </div>
        
        <div class="music-info">
          <h1 class="music-title">{{ release.title }}</h1>
          <p class="music-date">Released {{ formatDate(release.releaseDate) }}</p>
          <p v-if="release.description" class="music-description">
            {{ release.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- Music Platform Links -->
    <div class="music-platforms">
      <div class="platforms-container">
        <h2 class="platforms-title">Listen Now</h2>
        <div class="platforms-grid">
          <MusicPlatformButton
            v-for="(url, platform) in availablePlatforms"
            :key="platform"
            :platform="platform"
            :url="url"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MusicRelease } from '~/data/musicLibrary'

interface Props {
  release: MusicRelease
  isModal?: boolean
}

const props = defineProps<Props>()

const availablePlatforms = computed(() => {
  const platforms: Record<string, string> = {}
  
  Object.entries(props.release.musicPlatformLinks).forEach(([platform, url]) => {
    if (url) {
      platforms[platform] = url
    }
  })
  
  return platforms
})

const badgeClass = computed(() => {
  const typeClasses = {
    'single': 'badge-single',
    'album': 'badge-album', 
    'ep': 'badge-ep',
    'new release': 'badge-new'
  }
  return typeClasses[props.release.type] || 'badge-default'
})

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.music-detail-content {
  position: relative;
  min-height: 100vh;
  color: white;
}

/* Hero Section */
.music-hero {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.music-hero-background {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.music-hero-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(120px);
  -webkit-backdrop-filter: blur(120px);
}

.music-hero-overlay {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 30% 70%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%);
}

.music-hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 3rem;
  max-width: 1000px;
  width: 100%;
}

.music-album-cover {
  position: relative;
  width: 280px;
  height: 280px;
  flex-shrink: 0;
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.music-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
}

.music-badge span {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.badge-single {
  background: rgba(59, 130, 246, 0.8);
  color: white;
}

.badge-album {
  background: rgba(168, 85, 247, 0.8);
  color: white;
}

.badge-ep {
  background: rgba(34, 197, 94, 0.8);
  color: white;
}

.badge-new {
  background: linear-gradient(135deg, rgba(255, 119, 198, 0.8), rgba(120, 119, 198, 0.8));
  color: white;
}

.badge-default {
  background: rgba(0, 0, 0, 0.7);
  color: rgba(255, 255, 255, 0.95);
}

.music-info {
  flex: 1;
  min-width: 0;
}

.music-title {
  font-size: 3.5rem;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  animation: titleGlow 4s ease-in-out infinite alternate;
}

@keyframes titleGlow {
  0% { filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3)); }
  100% { filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.5)); }
}

.music-date {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  margin-bottom: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.music-description {
  font-size: 1.125rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  max-width: 500px;
}

/* Platforms Section */
.music-platforms {
  position: relative;
  padding: 4rem 2rem;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9));
}

.platforms-container {
  max-width: 800px;
  margin: 0 auto;
}

.platforms-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.platforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  justify-items: center;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .music-hero {
    min-height: 50vh;
    padding: 1.5rem;
  }
  
  .music-hero-content {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
  
  .music-album-cover {
    width: 220px;
    height: 220px;
  }
  
  .music-title {
    font-size: 2.5rem;
  }
  
  .music-date,
  .music-description {
    font-size: 1rem;
  }
  
  .platforms-title {
    font-size: 2rem;
  }
  
  .platforms-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .music-platforms {
    padding: 3rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .music-album-cover {
    width: 180px;
    height: 180px;
  }
  
  .music-title {
    font-size: 2rem;
  }
  
  .music-hero {
    padding: 1rem;
  }
  
  .music-platforms {
    padding: 2rem 1rem;
  }
}

/* Modal specific adjustments */
.music-detail-content:has(.music-hero) {
  min-height: auto;
}
</style>
