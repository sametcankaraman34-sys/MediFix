import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return ''
  }
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

export function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return ''
  }
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return ''
  }
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return ''
  }
  return `${formatDate(d)} ${formatTime(d)}`
}

export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return ''
  }
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]
  const day = d.getDate()
  const month = monthNames[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

export function parseDate(dateString: string): Date | null {
  if (!dateString || !dateString.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
    return null
  }
  const [day, month, year] = dateString.split('.').map(Number)
  const date = new Date(year, month - 1, day)
  if (isNaN(date.getTime())) {
    return null
  }
  return date
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return ''
  }
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'Az önce'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} dakika önce`
  } else if (diffHours < 24) {
    return `${diffHours} saat önce`
  } else if (diffDays < 7) {
    return `${diffDays} gün önce`
  } else {
    return formatDate(d)
  }
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  const phoneRegex = /^(\+90|0)?\s?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/
  const cleaned = phone.replace(/\s/g, '')
  return phoneRegex.test(cleaned) || /^[0-9+\-\s()]+$/.test(phone)
}

export function isValidTaxId(taxId: string): boolean {
  if (!taxId || typeof taxId !== 'string') {
    return false
  }
  if (!/^\d{11}$/.test(taxId)) {
    return false
  }
  if (taxId[0] === '0') {
    return false
  }
  const digits = taxId.split('').map(Number)
  const sum1 = digits.slice(0, 10).reduce((sum, digit, index) => {
    return sum + (index % 2 === 0 ? digit : 0)
  }, 0)
  const sum2 = digits.slice(0, 10).reduce((sum, digit, index) => {
    return sum + (index % 2 === 1 ? digit : 0)
  }, 0)
  const check1 = (sum1 * 7 - sum2) % 10
  const check2 = (sum1 + sum2 + check1) % 10
  return check1 === digits[9] && check2 === digits[10]
}

export function formatPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return ''
  }
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+90')) {
    const number = cleaned.slice(3)
    if (number.length === 10) {
      return `+90 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 8)} ${number.slice(8)}`
    }
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`
  }
  return phone
}

export function formatNumber(num: number | string, decimals: number = 0): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) {
    return '0'
  }
  return n.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export function formatCurrency(amount: number | string): string {
  const a = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(a)) {
    return '₺0,00'
  }
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(a)
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

export function capitalize(str: string): string {
  if (!str || typeof str !== 'string') {
    return ''
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function slugify(str: string): string {
  if (!str || typeof str !== 'string') {
    return ''
  }
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) {
    return ''
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}
