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
    label: 'nav.music',
    elementId: 'music'
  },
  {
    label: 'nav.about',
    elementId: 'about'
  }
]

// Right navigation items for header
export const rightNavigation: NavigationItem[] = [
  {
    label: 'nav.contact',
    elementId: 'contacts'
  },
  {
    label: 'nav.press_media',
    elementId: 'press-media'
  }
]

// Combined navigation for footer (all items)
export const footerNavigation: NavigationItem[] = [...leftNavigation, ...rightNavigation]

// Legacy export for backward compatibility
export const navigationConfig = footerNavigation

export default navigationConfig
