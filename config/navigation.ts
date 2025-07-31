// Navigation configuration for the website
// This contains all navigation items used across the site

export interface NavigationItem {
  label: string
  elementId: string // Element ID to scroll to (without #)
  isExternal?: boolean
  target?: string
}

// Left navigation items for header
export const leftNavigation: NavigationItem[] = [
  {
    label: 'Music',
    elementId: 'music'
  },
  {
    label: 'Tour',
    elementId: 'tour'
  }
]

// Right navigation items for header
export const rightNavigation: NavigationItem[] = [
  {
    label: 'About',
    elementId: 'about'
  },
  {
    label: 'Contact',
    elementId: 'contact'
  }
]

// Combined navigation for footer (all items)
export const footerNavigation: NavigationItem[] = [
  ...leftNavigation,
  ...rightNavigation
]

// Legacy export for backward compatibility
export const navigationConfig = footerNavigation

export default navigationConfig
