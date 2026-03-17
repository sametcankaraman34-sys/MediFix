const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[MediFix]', ...args)
    }
  },

  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error('[MediFix Error]', ...args)
    }
  },

  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[MediFix Warning]', ...args)
    }
  },

  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[MediFix Debug]', ...args)
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[MediFix Info]', ...args)
    }
  }
}
