import {
  formatDate,
  formatTime,
  formatDateTime,
  isValidEmail,
  isValidPhone,
  formatPhone,
  formatNumber,
  formatCurrency,
  truncateText,
  capitalize,
} from '@/lib/utils'

describe('Date Formatting Utilities', () => {
  it('formats date correctly', () => {
    const date = new Date(2026, 0, 10) // 10 Ocak 2026
    expect(formatDate(date)).toBe('10.01.2026')
  })

  it('formats time correctly', () => {
    const date = new Date(2026, 0, 10, 14, 30)
    expect(formatTime(date)).toBe('14:30')
  })

  it('formats date and time correctly', () => {
    const date = new Date(2026, 0, 10, 14, 30)
    expect(formatDateTime(date)).toBe('10.01.2026 14:30')
  })
})

describe('Validation Utilities', () => {
  it('validates email correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('validates phone correctly', () => {
    expect(isValidPhone('0555 123 4567')).toBe(true)
    expect(isValidPhone('05551234567')).toBe(true)
    expect(isValidPhone('invalid')).toBe(false)
  })
})

describe('Format Utilities', () => {
  it('formats phone correctly', () => {
    expect(formatPhone('05551234567')).toContain('0555')
  })

  it('formats number correctly', () => {
    expect(formatNumber(1234.56, 2)).toBe('1.234,56')
  })

  it('formats currency correctly', () => {
    expect(formatCurrency(1234.56)).toContain('₺')
  })

  it('truncates text correctly', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...')
    expect(truncateText('Hi', 5)).toBe('Hi')
  })

  it('capitalizes text correctly', () => {
    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('HELLO')).toBe('Hello')
  })
})
