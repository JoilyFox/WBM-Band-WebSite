export interface MusicRelease {
  id: string
  slug: string
  title: string
  /** i18n key for localized title; falls back to slug-based default when omitted */
  titleKey?: string
  type: 'single' | 'album' | 'ep' | 'new release'
  releaseDate?: string // ISO 8601 format: 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss' or 'YYYY-MM-DDTHH:mm:ssZ'
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
    musicVideo?: string
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
    slug: 'chorni-ptahy',
    title: 'Чорні Птахи',
    titleKey: 'releases.chorni_ptahy.title',
    type: 'single',
    releaseDate: '2026-02-06T00:00:00Z',
    imageUrl: '/images/optimized/albums-images/chorni-ptahy/cover.avif',
    blurredImageUrl: '/images/albums-images/chorni-ptahy/cover-blurred.jpg',
    descriptionKey: 'releases.chorni_ptahy.description',
    featured: true,
    musicPlatformLinks: {},
    useDistributorPreSave: true,
    distributorPreSaveUrl: 'https://artists.landr.com/057914578996',
    preSaveMusicPlatformLinks: {
      spotify:
        'https://accounts.spotify.com/authorize?response_type=code&client_id=5a14783d79444ee9babd9176b256979e&scope=user-follow-modify+user-library-modify+playlist-modify-public+playlist-modify-private+user-read-email+user-read-private&redirect_uri=https%3A%2F%2Flnk.to%2F~%2Fprerelease%2Fspotify&state=bFVybD1hcnRpc3RzLmxhbmRyLmNvbSUyRjA1NzkxNDU3ODk5NiZzSWQ9ZjBlYjk2NTUtYjFkZS00OWE2LWI4OGQtN2ZlNGFlMTFhYTU1JnRJZD01NzdhMGYwMi00OWVlLTRhNzgtYjdlOS1mNTA1Yzk1ZjUxOGQmdT1odHRwcyUzQSUyRiUyRmFydGlzdHMubGFuZHIuY29tJTJGMDU3OTE0NTc4OTk2JnZ0PWM0ZjkxMzQzOTdmM2U0NjAzOTk4MTQ2NDBmYjg0ZTg3JnZ1PTY5MDFlNTkwYjdhNTM3LjM1Mjk0MDk3JnJmPWh0dHBzJTNBJTJGJTJGd3d3LndibWJhbmQuY29tJTJG'
    }
  },
  {
    id: '1',
    slug: 'mania',
    title: 'Mania',
    titleKey: 'releases.mania.title',
    type: 'single',
    releaseDate: '2025-11-14T12:00:00Z',
    imageUrl: '/images/optimized/albums-images/mania/cover.avif',
    blurredImageUrl: '/images/albums-images/mania/cover-blurred.jpg',
    descriptionKey: 'releases.mania.description',
    featured: true,
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/album/0pjAORRhgVsS7eP4R6JbMF?go=1',
      appleMusic:
        'https://music.apple.com/ua/album/1849021879?app=music&at=1l3vpUI&ct=LFV_42c959c7fa393b8da43ecd14d3420636&itscg=30440&itsct=catchall_p1&lId=214367132&cId=none&sr=1&src=Linkfire&ls=1',
      youtubeMusic:
        'https://music.youtube.com/playlist?list=OLAK5uy_kYiOPbe8RWJzftzhv3KjQHg6gsR_aa8HQ&src=Linkfire&lId=d0225857-ffa6-4866-94dd-63ec2394cfd0&cId=d3d58fd7-4c47-11e6-9fd0-066c3e7a8751',
      amazonMusic:
        'https://music.amazon.com/albums/B0FXYHVS59?marketplaceId=ATVPDKIKX0DER&musicTerritory=US&ref=dm_sh_O0FTj6Yaw48FAewockBknpO7w',
      deezer: 'https://link.deezer.com/s/31BimrANA5l0xTuEjk4YW',
      musicVideo: 'https://www.youtube.com/watch?v=z_uH1gA9Gwo'
    },
    useDistributorPreSave: true,
    distributorPreSaveUrl: 'https://artists.landr.com/057829908413'
  }
]

// Helper functions
export const getFeaturedReleases = (): MusicRelease[] => {
  return musicLibrary.filter((release) => release.featured)
}

// Releases without a date should be considered "newest" / far future
const getReleaseTime = (date?: string) => {
  return date ? new Date(date).getTime() : 8640000000000000 // Max safe timestamp
}

export const getLatestReleases = (limit: number = 4): MusicRelease[] => {
  return musicLibrary
    .sort((a, b) => getReleaseTime(b.releaseDate) - getReleaseTime(a.releaseDate))
    .slice(0, limit)
}

export const getReleasesByType = (type: MusicRelease['type']): MusicRelease[] => {
  return musicLibrary.filter((release) => release.type === type)
}

export const getAllReleases = (): MusicRelease[] => {
  return musicLibrary.sort((a, b) => getReleaseTime(b.releaseDate) - getReleaseTime(a.releaseDate))
}

export const getReleaseBySlug = (slug: string): MusicRelease | undefined => {
  return musicLibrary.find((release) => release.slug === slug)
}

export const getReleaseById = (id: string): MusicRelease | undefined => {
  return musicLibrary.find((release) => release.id === id)
}

/**
 * Get the nearest upcoming release that has pre-save links
 * @returns The nearest upcoming release with pre-save, or undefined if none found
 */
export const getNearestUpcomingPreSaveRelease = (): MusicRelease | undefined => {
  const now = new Date().getTime()

  // Filter releases that are upcoming and have pre-save links
  const upcomingWithPreSave = musicLibrary.filter((release) => {
    // If no release date, it's definitely in future, but we check if it has links
    const releaseTime = getReleaseTime(release.releaseDate)
    const hasPreSaveLinks =
      (release.preSaveMusicPlatformLinks &&
        Object.keys(release.preSaveMusicPlatformLinks).length > 0) ||
      !!release.distributorPreSaveUrl
    return releaseTime > now && hasPreSaveLinks
  })

  // Sort by release date (nearest first) and return the first one
  if (upcomingWithPreSave.length === 0) return undefined

  return upcomingWithPreSave.sort((a, b) => {
    return getReleaseTime(a.releaseDate) - getReleaseTime(b.releaseDate)
  })[0]
}
