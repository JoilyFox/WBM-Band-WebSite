export interface MusicRelease {
  id: string
  title: string
  type: 'single' | 'album' | 'ep'
  releaseDate: string
  imageUrl: string
  spotifyUrl?: string
  appleMusicUrl?: string
  youtubeUrl?: string
  description?: string
  featured?: boolean
}

export const musicLibrary: MusicRelease[] = [
  {
    id: '1',
    title: 'Midnight Echoes',
    type: 'album',
    releaseDate: '2024-03-15',
    imageUrl: '/images/optimized/albums-images/IMG_1850.avif',
    spotifyUrl: 'https://open.spotify.com/album/example1',
    appleMusicUrl: 'https://music.apple.com/album/example1',
    youtubeUrl: 'https://youtube.com/playlist?list=example1',
    description: 'Our latest full-length album featuring 12 tracks of atmospheric rock.',
    featured: true
  },
  {
    id: '2',
    title: 'Electric Dreams',
    type: 'ep',
    releaseDate: '2024-01-20',
    imageUrl: '/images/optimized/albums-images/IMG_1851.avif',
    spotifyUrl: 'https://open.spotify.com/album/example2',
    appleMusicUrl: 'https://music.apple.com/album/example2',
    youtubeUrl: 'https://youtube.com/playlist?list=example2',
    description: 'A 5-track EP exploring electronic soundscapes.',
    featured: true
  },
  // {
  //   id: '3',
  //   title: 'Neon Nights',
  //   type: 'single',
  //   releaseDate: '2023-11-10',
  //   imageUrl: '/images/optimized/albums-images/IMG_1852.avif',
  //   spotifyUrl: 'https://open.spotify.com/track/example3',
  //   appleMusicUrl: 'https://music.apple.com/song/example3',
  //   youtubeUrl: 'https://youtube.com/watch?v=example3',
  //   description: 'High-energy single with synthwave influences.',
  //   featured: true
  // },
  // {
  //   id: '4',
  //   title: 'Shadows & Light',
  //   type: 'album',
  //   releaseDate: '2023-08-05',
  //   imageUrl: '/images/optimized/albums-images/IMG_1825.avif',
  //   spotifyUrl: 'https://open.spotify.com/album/example4',
  //   appleMusicUrl: 'https://music.apple.com/album/example4',
  //   youtubeUrl: 'https://youtube.com/playlist?list=example4',
  //   description: 'Conceptual album about contrasts in life and music.'
  // },
  // {
  //   id: '5',
  //   title: 'Acoustic Sessions',
  //   type: 'ep',
  //   releaseDate: '2023-06-15',
  //   imageUrl: '/images/optimized/albums-images/IMG_1822.avif',
  //   spotifyUrl: 'https://open.spotify.com/album/example5',
  //   appleMusicUrl: 'https://music.apple.com/album/example5',
  //   youtubeUrl: 'https://youtube.com/playlist?list=example5',
  //   description: 'Stripped-down acoustic versions of our popular tracks.'
  // },
  // {
  //   id: '6',
  //   title: 'City Lights',
  //   type: 'single',
  //   releaseDate: '2023-04-22',
  //   imageUrl: '/images/optimized/albums-images/IMG_1823.avif',
  //   spotifyUrl: 'https://open.spotify.com/track/example6',
  //   appleMusicUrl: 'https://music.apple.com/song/example6',
  //   youtubeUrl: 'https://youtube.com/watch?v=example6',
  //   description: 'Urban-inspired track with heavy guitar riffs.'
  // },
  // {
  //   id: '7',
  //   title: 'Ethereal Waves',
  //   type: 'ep',
  //   releaseDate: '2023-02-14',
  //   imageUrl: '/images/optimized/albums-images/IMG_1838.avif',
  //   spotifyUrl: 'https://open.spotify.com/album/example7',
  //   appleMusicUrl: 'https://music.apple.com/album/example7',
  //   youtubeUrl: 'https://youtube.com/playlist?list=example7',
  //   description: 'Ambient textures meet driving rhythms.'
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
