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
  /** If true and distributorPreSaveUrl is set, redirect to distributor's pre-save page instead of showing custom page */
  useDistributorPreSave?: boolean
  /** Direct link to distributor's pre-save page (e.g., DistroKid, TuneCore, etc.) */
  distributorPreSaveUrl?: string
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
      spotify: 'https://accounts.spotify.com/authorize?response_type=code&client_id=5a14783d79444ee9babd9176b256979e&scope=user-follow-modify+user-library-modify+playlist-modify-public+playlist-modify-private+user-read-email+user-read-private&redirect_uri=https%3A%2F%2Flnk.to%2F~%2Fprerelease%2Fspotify&state=bFVybD1hcnRpc3RzLmxhbmRyLmNvbSUyRjA1NzgyOTkwODQxMyZzSWQ9ZjBlYjk2NTUtYjFkZS00OWE2LWI4OGQtN2ZlNGFlMTFhYTU1JnRJZD01NmY2YTg3OS0wNWM2LTRhN2EtODEyZi1mMjQ0ODk0NjYxNTImdT1odHRwcyUzQSUyRiUyRmFydGlzdHMubGFuZHIuY29tJTJGMDU3ODI5OTA4NDEzJnZ0PWQ0NzlhMjIwY2ZmZTdmNGEyZTg5ZDg2YzVjZWM0NWFhJnZ1PTY5MDFlMzRiOTk5ZWI2LjIxNjI3MzE0JnJmPWh0dHBzJTNBJTJGJTJGYXBwLmxhbmRyLmNvbSUyRg%3D%3D',
      appleMusic: 'https://music.apple.com/album/example1',
    },
    // Optional: Use distributor's pre-save page instead of custom page
    useDistributorPreSave: true,
    distributorPreSaveUrl: 'https://artists.landr.com/057829908413'
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

/**
 * Get the nearest upcoming release that has pre-save links
 * @returns The nearest upcoming release with pre-save, or undefined if none found
 */
export const getNearestUpcomingPreSaveRelease = (): MusicRelease | undefined => {
  const now = new Date().getTime()
  
  // Filter releases that are upcoming and have pre-save links
  const upcomingWithPreSave = musicLibrary.filter(release => {
    const releaseDate = new Date(release.releaseDate).getTime()
    const hasPreSaveLinks = release.preSaveMusicPlatformLinks && Object.keys(release.preSaveMusicPlatformLinks).length > 0
    return releaseDate > now && hasPreSaveLinks
  })
  
  // Sort by release date (nearest first) and return the first one
  if (upcomingWithPreSave.length === 0) return undefined
  
  return upcomingWithPreSave.sort((a, b) => {
    return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  })[0]
}
