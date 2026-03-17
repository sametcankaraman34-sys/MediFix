import { logger } from './logger'

export function getStorageItem<T>(key: string, defaultValue: T | null = null): T | null {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue
    }
    return JSON.parse(item) as T
  } catch (error) {
    logger.error(`Error reading from localStorage (key: ${key}):`, error)
    return defaultValue
  }
}

export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    logger.error(`Error writing to localStorage (key: ${key}):`, error)
    return false
  }
}

export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    logger.error(`Error removing from localStorage (key: ${key}):`, error)
    return false
  }
}

export function clearStorage(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.clear()
    return true
  } catch (error) {
    logger.error('Error clearing localStorage:', error)
    return false
  }
}
