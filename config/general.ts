/**
 * General configuration settings for WBM Band website
 */

export interface GeneralConfig {
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
    instagram?: string
    tiktok?: string
    youtube?: string
    facebook?: string
    twitter?: string
    spotify?: string
    appleMusic?: string
    youtubeMusic?: string
  }
  
  // Social media handles (for display)
  socialHandles: {
    instagram?: string
    tiktok?: string
    youtube?: string
    facebook?: string
    twitter?: string
  }
  
  // Legal and policy information
  legal: {
    privacyPolicyLastUpdated: string // ISO date string
    termsOfServiceLastUpdated: string // ISO date string
    cookiesPolicyLastUpdated: string // ISO date string
    dataResponseTime: string // e.g., "30 days"
  }
  
  // Website settings
  enableComingSoonCard: boolean
  maxReleasesBeforeHideComingSoon: number
  enableNextReleasePreview: boolean // Show non-clickable preview card for upcoming releases
  enablePreSave: boolean // Enable pre-save functionality for upcoming releases (overrides preview)
  maintenanceMode: boolean // When true, redirect main page to "under construction" error page (other pages remain accessible)
  
  // Web3Forms API key for contact form
  web3formsApiKey: string
  
  // Developer credit
  developer: {
    name: string
    instagramUrl?: string
  }
}

export const generalConfig: GeneralConfig = {
  // Band information
  bandName: "WBM Band",
  fullBandName: "Woman Based Mechanics",
  tagline: "Rock • Metal • Alternative",
  
  // Contact information
  contact: {
    email: "wbmbandofficial@gmail.com",
    privacyEmail: "wbmbandofficial@gmail.com",
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
    instagram: "https://instagram.com/wbmband",
    tiktok: "https://tiktok.com/@wbmband",
    youtube: "https://youtube.com/@wbmbandofficial"
  },
  
  // Social media handles (for display purposes)
  socialHandles: {
    instagram: "@wbmband",
    tiktok: "wbmband",
    youtube: "wbmbandofficial"
  },
  
  // Legal and policy information
  legal: {
    privacyPolicyLastUpdated: "2025-07-31", // ISO date string
    termsOfServiceLastUpdated: "2025-07-31", // ISO date string
    cookiesPolicyLastUpdated: "2025-07-31", // ISO date string
    dataResponseTime: "30 days"
  },
  
  // Website settings
  enableComingSoonCard: true,
  maxReleasesBeforeHideComingSoon: 6,
  enableNextReleasePreview: true, // Show non-clickable preview card for upcoming releases
  enablePreSave: true, // Enable pre-save functionality (when true, replaces preview with clickable pre-save card)
  
  // When true, main page shows "under construction" (other pages like /listen and /pre-save remain accessible)
  maintenanceMode: false,
  
  // Web3Forms API key for contact form (get yours free at https://web3forms.com)
  web3formsApiKey: "3d7d114e-f2cd-46db-8934-ba70907c3a07",
  
  // Developer credit
  developer: {
    name: "@feat.her_",
    instagramUrl: "https://www.instagram.com/feat.her_"
  }
}
