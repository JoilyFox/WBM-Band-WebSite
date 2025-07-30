/**
 * Helper functions for configuration management
 */

import { generalConfig } from '~/config/general'

/**
 * Convenience functions to access config values
 */
export const getBandName = () => generalConfig.bandName
export const getFullBandName = () => generalConfig.fullBandName
export const getBandTagline = () => generalConfig.tagline
export const getContactEmail = () => generalConfig.contact.email
export const getPrivacyEmail = () => generalConfig.contact.privacyEmail
export const getContactPhone = () => generalConfig.contact.phone
export const getContactPhoneNumber = () => generalConfig.contact.phoneNumber
export const getLocation = () => generalConfig.contact.location
export const getSocialMedia = () => generalConfig.socialMedia
export const getLegalInfo = () => generalConfig.legal
export const getPrivacyPolicyLastUpdated = () => generalConfig.legal.privacyPolicyLastUpdated
export const getTermsOfServiceLastUpdated = () => generalConfig.legal.termsOfServiceLastUpdated
export const getDataResponseTime = () => generalConfig.legal.dataResponseTime

/**
 * Helper function to format release date
 */
export const formatReleaseDate = (dateString: string): string => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
}

/**
 * Helper function to check if release date is in the future
 */
export const isUpcomingRelease = (dateString: string): boolean => {
  const releaseDate = new Date(dateString)
  const now = new Date()
  return releaseDate > now
}

/**
 * Helper function to format release date in a shorter format
 */
export const formatReleaseDateShort = (dateString: string): string => {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
  return date.toLocaleDateString('en-US', options)
}

/**
 * Helper function to get relative time until release
 */
export const getTimeUntilRelease = (dateString: string): string => {
  const releaseDate = new Date(dateString)
  const now = new Date()
  const diffInMs = releaseDate.getTime() - now.getTime()
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 0) {
    return 'Released'
  } else if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Tomorrow'
  } else if (diffInDays < 7) {
    return `In ${diffInDays} days`
  } else if (diffInDays < 30) {
    const weeks = Math.ceil(diffInDays / 7)
    return `In ${weeks} week${weeks > 1 ? 's' : ''}`
  } else if (diffInDays < 365) {
    const months = Math.ceil(diffInDays / 30)
    return `In ${months} month${months > 1 ? 's' : ''}`
  } else {
    const years = Math.ceil(diffInDays / 365)
    return `In ${years} year${years > 1 ? 's' : ''}`
  }
}
