export interface MusicRelease {
  id: string
  slug: string
  title: string
  /** i18n key for localized title; falls back to slug-based default when omitted */
  titleKey?: string
  type: 'single' | 'album' | 'ep' | 'new release'
  releaseDate: string // ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss' or 'YYYY-MM-DDTHH:mm:ssZ'
  imageUrl: string
  blurredImageUrl?: string
  description?: string
  /** i18n key for localized description; falls back to slug-based default when omitted */
  descriptionKey?: string
  featured?: boolean
  musicPlatformLinks: {
    spotify?: string
    appleMusic?: string
    youtubeMusic?: string
    deezer?: string
    soundcloud?: string
    bandcamp?: string
    tidal?: string
    amazonMusic?: string
  }
  preSaveMusicPlatformLinks?: {
    spotify?: string
    appleMusic?: string
    youtubeMusic?: string
    deezer?: string
    soundcloud?: string
    bandcamp?: string
    tidal?: string
    amazonMusic?: string
  }
}

export const musicLibrary: MusicRelease[] = [
  {
    id: '2',
    slug: 'mania',
    title: 'Mania',
    titleKey: 'releases.mania.title',
    type: 'single',
    releaseDate: '2025-11-14T18:00:00',
    imageUrl: '/images/optimized/albums-images/mania-cover.avif',
    blurredImageUrl: '/images/albums-images/mania-cover-blurred.jpg',
    description: 'A high-voltage single blending modern rock energy with cinematic synth layers.',
    descriptionKey: 'releases.mania.description',
    featured: true,
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/album/example1',
      appleMusic: 'https://music.apple.com/album/example1',
      youtubeMusic: 'https://youtube.com/playlist?list=example1',
      tidal: 'https://tidal.com/browse/album/example1',
      amazonMusic: 'https://music.amazon.com/albums/example1'
    },
    preSaveMusicPlatformLinks: {
      spotify: 'https://open.spotify.com/album/example1',
      appleMusic: 'https://music.apple.com/album/example1',
      youtubeMusic: 'https://youtube.com/playlist?list=example1',
      tidal: 'https://tidal.com/browse/album/example1',
      amazonMusic: 'https://music.amazon.com/albums/example1'
    }
  },
]

// Helper functions
export const getFeaturedReleases = (): MusicRelease[] => {
  return musicLibrary.filter(release => release.featured)
}

export const getLatestReleases = (limit: number = 4): MusicRelease[] => {
  return musicLibrary
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
    .slice(0, limit)
}

export const getReleasesByType = (type: MusicRelease['type']): MusicRelease[] => {
  return musicLibrary.filter(release => release.type === type)
}

export const getAllReleases = (): MusicRelease[] => {
  return musicLibrary.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
}

export const getReleaseBySlug = (slug: string): MusicRelease | undefined => {
  return musicLibrary.find(release => release.slug === slug)
}

export const getReleaseById = (id: string): MusicRelease | undefined => {
  return musicLibrary.find(release => release.id === id)
}
