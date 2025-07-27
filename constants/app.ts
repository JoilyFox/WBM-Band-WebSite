/**
 * Application constants and configuration
 */

// Core app identity
export const APP_NAME = 'WBM Band'
export const APP_SLUG = 'wbm-band'
export const APP_DESCRIPTION = 'A modern Nuxt 3 application for the WBM Band with advanced features including API caching, global loading system, and notification management.'

// Dynamic constants based on core identity
export const WEBSITE_TITLE = `${APP_NAME} Website`
export const CACHE_NAME = `${APP_SLUG}-api-cache`

/**
 * Helper function to create page titles
 * @param pageTitle - The specific page title
 * @param includeAppName - Whether to include the website title (default: true)
 * @returns Formatted page title
 */
export const createPageTitle = (pageTitle: string, includeAppName: boolean = true): string => {
  return includeAppName ? `${pageTitle} | ${WEBSITE_TITLE}` : pageTitle
}

/**
 * Helper function to create error page titles
 * @param statusCode - HTTP status code or error type
 * @returns Formatted error page title
 */
export const createErrorTitle = (statusCode: string | number): string => {
  return `${statusCode} - ${WEBSITE_TITLE}`
}

/**
 * Helper function to create welcome messages
 * @param customMessage - Optional custom message (default: uses APP_NAME)
 * @returns Formatted welcome message
 */
export const createWelcomeMessage = (customMessage?: string): string => {
  return customMessage || `Welcome to ${APP_NAME}!`
}

/**
 * Helper function to create cache names for different purposes
 * @param purpose - The purpose of the cache (e.g., 'api', 'images', 'data')
 * @returns Formatted cache name
 */
export const createCacheName = (purpose: string = 'api'): string => {
  return `${APP_SLUG}-${purpose}-cache`
}
