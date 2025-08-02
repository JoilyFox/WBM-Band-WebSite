export interface MusicRelease {
  id: string
  slug: string
  title: string
  type: 'single' | 'album' | 'ep' | 'new release'
  releaseDate: string
  imageUrl: string
  description?: string
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
}

export const musicLibrary: MusicRelease[] = [
  {
    id: '1',
    slug: 'midnight-echoes',
    title: 'Midnight Echoes',
    type: 'album',
    releaseDate: '2024-03-15',
    imageUrl: '/images/optimized/albums-images/IMG_1850.avif',
    description: 'Our latest full-length album featuring 12 tracks of atmospheric rock.',
    featured: true,
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/album/example1',
      appleMusic: 'https://music.apple.com/album/example1',
      youtubeMusic: 'https://youtube.com/playlist?list=example1',
      tidal: 'https://tidal.com/browse/album/example1',
      amazonMusic: 'https://music.amazon.com/albums/example1'
    }
  },
  {
    id: '2',
    slug: 'electric-dreams',
    title: 'Electric Dreams',
    type: 'ep',
    releaseDate: '2024-01-20',
    imageUrl: '/images/optimized/albums-images/IMG_1851.avif',
    description: 'A 5-track EP exploring electronic soundscapes.',
    featured: true,
    musicPlatformLinks: {
      spotify: 'https://open.spotify.com/album/example2',
      appleMusic: 'https://music.apple.com/album/example2',
      youtubeMusic: 'https://youtube.com/playlist?list=example2',
      deezer: 'https://deezer.com/album/example2',
      soundcloud: 'https://soundcloud.com/user/sets/example2'
    }
  },
  // {
  //   id: '3',
  //   slug: 'neon-nights',
  //   title: 'Neon Nights',
  //   type: 'single',
  //   releaseDate: '2023-11-10',
  //   imageUrl: '/images/optimized/albums-images/IMG_1852.avif',
  //   description: 'High-energy single with synthwave influences.',
  //   featured: true,
  //   musicPlatformLinks: {
  //     spotify: 'https://open.spotify.com/track/example3',
  //     appleMusic: 'https://music.apple.com/song/example3',
  //     youtubeMusic: 'https://youtube.com/watch?v=example3'
  //   }
  // },
  // {
  //   id: '4',
  //   slug: 'shadows-and-light',
  //   title: 'Shadows & Light',
  //   type: 'album',
  //   releaseDate: '2023-08-05',
  //   imageUrl: '/images/optimized/albums-images/IMG_1825.avif',
  //   description: 'Conceptual album about contrasts in life and music.',
  //   musicPlatformLinks: {
  //     spotify: 'https://open.spotify.com/album/example4',
  //     appleMusic: 'https://music.apple.com/album/example4',
  //     youtubeMusic: 'https://youtube.com/playlist?list=example4'
  //   }
  // },
  // {
  //   id: '5',
  //   slug: 'acoustic-sessions',
  //   title: 'Acoustic Sessions',
  //   type: 'ep',
  //   releaseDate: '2023-06-15',
  //   imageUrl: '/images/optimized/albums-images/IMG_1822.avif',
  //   description: 'Stripped-down acoustic versions of our popular tracks.',
  //   musicPlatformLinks: {
  //     spotify: 'https://open.spotify.com/album/example5',
  //     appleMusic: 'https://music.apple.com/album/example5',
  //     youtubeMusic: 'https://youtube.com/playlist?list=example5'
  //   }
  // },
  // {
  //   id: '6',
  //   slug: 'city-lights',
  //   title: 'City Lights',
  //   type: 'single',
  //   releaseDate: '2023-04-22',
  //   imageUrl: '/images/optimized/albums-images/IMG_1823.avif',
  //   description: 'Urban-inspired track with heavy guitar riffs.',
  //   musicPlatformLinks: {
  //     spotify: 'https://open.spotify.com/track/example6',
  //     appleMusic: 'https://music.apple.com/song/example6',
  //     youtubeMusic: 'https://youtube.com/watch?v=example6'
  //   }
  // },
  // {
  //   id: '7',
  //   slug: 'ethereal-waves',
  //   title: 'Ethereal Waves',
  //   type: 'ep',
  //   releaseDate: '2023-02-14',
  //   imageUrl: '/images/optimized/albums-images/IMG_1838.avif',
  //   description: 'Ambient textures meet driving rhythms.',
  //   musicPlatformLinks: {
  //     spotify: 'https://open.spotify.com/album/example7',
  //     appleMusic: 'https://music.apple.com/album/example7',
  //     youtubeMusic: 'https://youtube.com/playlist?list=example7'
  //   }
  // }
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
