<template>
  <div class="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
    <div class="flex gap-2">
      <button
        v-if="spotifyUrl"
        @click.stop="openLink(spotifyUrl)"
        class="streaming-button bg-black hover:bg-black/80 scale-60"
        title="Listen on Spotify"
      >
        <img 
          src="/assets/images/icons/spotify-icon.svg" 
          alt="Spotify" 
          class="w-full h-full"
          loading="lazy"
        />
      </button>
      <button
        v-if="appleMusicUrl"
        @click.stop="openLink(appleMusicUrl)"
        class="streaming-button bg-surface-800 hover:bg-surface-700"
        title="Listen on Apple Music"
      >
        <img 
          src="/assets/images/icons/apple-music-icon.svg" 
          alt="Apple Music" 
          class="w-full h-full"
          loading="lazy"
        />
      </button>
      <button
        v-if="youtubeUrl"
        @click.stop="openLink(youtubeUrl)"
        class="streaming-button bg-red-600 hover:bg-red-500"
        title="Watch on YouTube"
      >
        <img 
          src="/assets/images/icons/youtube-music-icon.svg" 
          alt="YouTube" 
          class="w-full h-full"
          loading="lazy"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  spotifyUrl?: string
  appleMusicUrl?: string
  youtubeUrl?: string
}

const props = defineProps<Props>()

const openLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.streaming-button {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.streaming-button:hover {
  transform: scale(1.1);
}

.streaming-button:active {
  transform: scale(0.95);
}

.streaming-button img {
  display: block;
  object-fit: contain;
}
</style>
