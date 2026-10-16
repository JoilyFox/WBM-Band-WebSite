/**
 * Application constants and configuration
 */

// Core app identity
export const APP_NAME = 'WBM Band'
export const APP_SLUG = 'wbm-band'

/**
 * Canonical production origin (no trailing slash). Single source of truth for
 * absolute URLs in canonical/og:url tags, SEO helpers and the sitemap. NOT
 * DEPLOY_TARGET-aware on purpose — canonical/OG must always point at the real
 * production domain, even on the GitHub Pages staging mirror.
 */
export const SITE_URL = 'https://www.wbmband.com'

// Dynamic constants based on core identity
export const WEBSITE_TITLE = `${APP_NAME} Website`

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
