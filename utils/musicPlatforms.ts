export interface MusicPlatform {
  name: string
  icon: string
  colors: {
    bg: string
    hover: string
    text: string
    border: string
  }
  displayName: string
}

export const musicPlatforms: Record<string, MusicPlatform> = {
  spotify: {
    name: 'spotify',
    icon: 'pi pi-play-circle',
    colors: {
      bg: 'from-green-600 to-green-500',
      hover: 'from-green-700 to-green-600',
      text: 'text-white',
      border: 'border-green-500/30'
    },
    displayName: 'Spotify'
  },
  appleMusic: {
    name: 'appleMusic',
    icon: 'pi pi-apple',
    colors: {
      bg: 'from-red-600 to-pink-600',
      hover: 'from-red-700 to-pink-700',
      text: 'text-white',
      border: 'border-red-500/30'
    },
    displayName: 'Apple Music'
  },
  youtubeMusic: {
    name: 'youtubeMusic',
    icon: 'pi pi-youtube',
    colors: {
      bg: 'from-red-600 to-red-500',
      hover: 'from-red-700 to-red-600',
      text: 'text-white',
      border: 'border-red-500/30'
    },
    displayName: 'YouTube Music'
  },
  deezer: {
    name: 'deezer',
    icon: 'pi pi-headphones',
    colors: {
      bg: 'from-orange-600 to-orange-500',
      hover: 'from-orange-700 to-orange-600',
      text: 'text-white',
      border: 'border-orange-500/30'
    },
    displayName: 'Deezer'
  },
  soundcloud: {
    name: 'soundcloud',
    icon: 'pi pi-cloud',
    colors: {
      bg: 'from-orange-500 to-orange-400',
      hover: 'from-orange-600 to-orange-500',
      text: 'text-white',
      border: 'border-orange-400/30'
    },
    displayName: 'SoundCloud'
  },
  bandcamp: {
    name: 'bandcamp',
    icon: 'pi pi-bookmark',
    colors: {
      bg: 'from-cyan-600 to-blue-600',
      hover: 'from-cyan-700 to-blue-700',
      text: 'text-white',
      border: 'border-cyan-500/30'
    },
    displayName: 'Bandcamp'
  },
  tidal: {
    name: 'tidal',
    icon: 'pi pi-wave-pulse',
    colors: {
      bg: 'from-black to-gray-900',
      hover: 'from-gray-900 to-gray-800',
      text: 'text-white',
      border: 'border-gray-600/30'
    },
    displayName: 'Tidal'
  },
  amazonMusic: {
    name: 'amazonMusic',
    icon: 'pi pi-amazon',
    colors: {
      bg: 'from-blue-600 to-indigo-600',
      hover: 'from-blue-700 to-indigo-700',
      text: 'text-white',
      border: 'border-blue-500/30'
    },
    displayName: 'Amazon Music'
  }
}

export const getDefaultPlatform = (): MusicPlatform => ({
  name: 'default',
  icon: 'pi pi-external-link',
  colors: {
    bg: 'from-gray-600 to-gray-500',
    hover: 'from-gray-700 to-gray-600',
    text: 'text-white',
    border: 'border-gray-500/30'
  },
  displayName: 'Listen'
})

export const getMusicPlatform = (platformKey: string): MusicPlatform => {
  return musicPlatforms[platformKey] || getDefaultPlatform()
}
