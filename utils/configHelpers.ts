/**
 * Helper functions for configuration management
 */

import { generalConfig } from '~/config/general'

/**
 * Registry of available configuration files
 */
const configRegistry = {
  general: generalConfig,
  // Add more config files here as needed
  // example: () => import('~/config/example')
}

/**
 * Options for the getConfig helper function
 */
interface GetConfigOptions {
  fallback?: any
  errorLogging?: boolean
}

/**
 * Get a nested configuration value using dot notation path
 * @param path - Dot notation path to the config value (e.g., 'general.contact.email', 'general.legal.privacyPolicyLastUpdated')
 * @param options - Optional configuration with fallback value and error logging
 * @returns The config value or fallback if not found
 */
export const getConfig = (path: string, options: GetConfigOptions = {}): any => {
  const { fallback = null, errorLogging = true } = options
  
  try {
    const pathParts = path.split('.')
    const configName = pathParts[0]
    const propertyPath = pathParts.slice(1)
    
    // Get the config object from registry
    const config = configRegistry[configName as keyof typeof configRegistry]
    if (!config) {
      if (errorLogging) {
        console.warn(`Config file '${configName}' not found in registry. Available configs: ${Object.keys(configRegistry).join(', ')}`)
      }
      return fallback
    }
    
    // Navigate through the property path
    let current: any = config
    for (const key of propertyPath) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        if (errorLogging) {
          console.warn(`Config path '${path}' not found. Key '${key}' does not exist.`)
        }
        return fallback
      }
    }
    
    return current
  } catch (error) {
    if (errorLogging) {
      console.error(`Error accessing config path '${path}':`, error)
    }
    return fallback
  }
}

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
