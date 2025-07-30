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
  fullBandName: string
  tagline: string
  
  // Contact information
  contact: {
    email: string
    privacyEmail: string
    phone: string
    phoneNumber: string // For tel: links (without formatting)
    location: {
      city: string
      state: string
      country: string
      full: string
      short: string // For footer
    }
  }
  
  // Social media
  socialMedia: {
    spotify?: string
    appleMusic?: string
    youtube?: string
    instagram?: string
    twitter?: string
  }
  
  // Legal and policy information
  legal: {
    privacyPolicyLastUpdated: string // ISO date string
    termsOfServiceLastUpdated: string // ISO date string
    dataResponseTime: string // e.g., "30 days"
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
  fullBandName: "Woman Based Mechanics",
  tagline: "Rock • Metal • Alternative",
  
  // Contact information
  contact: {
    email: "contact@wbmband.com",
    privacyEmail: "privacy@wbmband.com",
    phone: "+1 (234) 567-8900",
    phoneNumber: "+1234567890", // For tel: links
    location: {
      city: "Los Angeles",
      state: "CA",
      country: "United States",
      full: "Los Angeles, CA, United States",
      short: "Los Angeles, CA"
    }
  },
  
  // Social media links
  socialMedia: {
    spotify: "https://open.spotify.com/artist/wbmband",
    appleMusic: "https://music.apple.com/artist/wbmband",
    youtube: "https://youtube.com/@wbmband",
    // instagram: "https://instagram.com/wbmband",
    // twitter: "https://twitter.com/wbmband"
  },
  
  // Legal and policy information
  legal: {
    privacyPolicyLastUpdated: "2025-07-31", // ISO date string
    termsOfServiceLastUpdated: "2025-07-31", // ISO date string
    dataResponseTime: "30 days"
  },
  
  // Website settings
  enableComingSoonCard: true,
  maxReleasesBeforeHideComingSoon: 6
}
