/**
 * Utility helper functions
 */

// Format date to readable string. Returns '' for an unparseable date rather
// than letting Intl.DateTimeFormat.format() throw a RangeError on the caller.
export const formatDate = (date: Date | string): string => {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(parsed)
}

// Format currency
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Generate random ID
export const generateId = (length = 8): string => {
  return Math.random()
    .toString(36)
    .substring(2, length + 2)
}

// Validate email.
// Rejects consecutive dots and a leading/trailing dot in either the local part
// or the domain (the previous `[^\s@]+\.[^\s@]+` regex accepted `a@b..c`).
export const isValidEmail = (email: string): boolean => {
  // local part: dot-separated atoms of non-space/@/dot chars
  // domain: dot-separated labels, TLD ≥ 2 letters
  const emailRegex = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)*\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
