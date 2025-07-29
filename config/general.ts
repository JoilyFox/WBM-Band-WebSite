/**
 * General configuration settings for WBM Band website
 */

export interface GeneralConfig {
  // Release information
  nextReleaseDate: string | null // ISO date string or null
  nextReleaseTitle: string | null // Title of the upcoming release
  nextReleaseImageUrl: string | null // Image URL for the upcoming release
  
  // Band information
  bandName: string
  tagline: string
  
  // Social media
  socialMedia: {
    spotify?: string
    appleMusic?: string
    youtube?: string
    instagram?: string
    twitter?: string
  }
  
  // Website settings
  enableComingSoonCard: boolean
  maxReleasesBeforeHideComingSoon: number
}

export const generalConfig: GeneralConfig = {
  // Release information
  nextReleaseDate: '2025-09-15', // Set to ISO date string like "2024-04-15" when you have a planned release
  nextReleaseTitle: 'Mania', // Set to release title like "Electric Dreams EP"
  nextReleaseImageUrl: '/images/albums-images/IMG_1822.JPG', // Image for the upcoming release preview
  
  // Band information
  bandName: "WBM Band",
  tagline: "Rock • Metal • Alternative",
  
  // Social media links
  socialMedia: {
    spotify: "https://open.spotify.com/artist/wbmband",
    appleMusic: "https://music.apple.com/artist/wbmband",
    youtube: "https://youtube.com/@wbmband",
    // instagram: "https://instagram.com/wbmband",
    // twitter: "https://twitter.com/wbmband"
  },
  
  // Website settings
  enableComingSoonCard: true,
  maxReleasesBeforeHideComingSoon: 6
}
