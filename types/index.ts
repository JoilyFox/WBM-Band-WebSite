/**
 * Global type definitions for the application
 */

// User types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

// API Response types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface ContactForm {
  name: string
  email: string
  message: string
}

// Toast severity types
export type ToastSeverity = 'success' | 'info' | 'warn' | 'error'

// Theme types
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'error' | 'surface'
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text'
export type InputVariant = 'default' | 'filled' | 'outlined'