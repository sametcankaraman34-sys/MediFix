export interface ServiceRequest {
  id: number
  title: string
  equipment: string
  priority: 'Düşük' | 'Orta' | 'Yüksek'
  status: 'Bekleyen' | 'Devam Eden' | 'Tamamlanan' | 'İptal Edilen'
  location: string
  date: string
  assignedTo: string | null
  createdAt: string
  checklist: Record<string, Record<string, boolean>>
}

export interface Appointment {
  id: number
  title: string
  date: string
  time: string
  duration: string
  type: 'Bakım' | 'Onarım' | 'Kontrol' | 'Kalibrasyon' | 'Diğer'
  equipment: string
  notes: string
  assignedTo?: string
  status: 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal Edildi'
  createdAt?: string
  updatedAt?: string
}

export interface Personnel {
  id: number
  name: string
  role: string
  email: string
  phone: string
  department?: string
  createdAt?: string
  updatedAt?: string
}

export interface Report {
  id: number
  reportNo: string
  date: string
  companyName: string
  authorizedPerson: string
  contact: string
  address: string
  brand: string
  model: string
  serialNo: string
  description: string
  deliveredBy: string
  deliveredTo: string
  status: 'Hazırlanıyor' | 'Hazır' | 'Gönderildi'
  checklist: Record<string, Record<string, boolean>>
  createdAt?: string
  updatedAt?: string
}

export interface Notification {
  id: number
  title: string
  message: string
  time: string
  date: string
  read: boolean
  type?: 'info' | 'success' | 'warning' | 'error'
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'technician' | 'manager'
  avatar?: string
  phone?: string
  address?: string
  createdAt?: string
  updatedAt?: string
}

export interface Settings {
  exportFormat: 'xlsx' | 'csv' | 'json' | 'pdf'
  desktopNotifications: boolean
  emailNotifications: boolean
  language: string
  theme: 'light' | 'dark' | 'auto'
  timezone: string
}

export interface Account {
  id: string
  userId: string
  subscriptionType: 'free' | 'basic' | 'premium'
  subscriptionStartDate: string
  subscriptionEndDate?: string
  paymentMethod?: {
    type: 'card' | 'bank'
    last4?: string
    brand?: string
  }
  billingHistory?: Array<{
    id: string
    amount: number
    date: string
    status: 'paid' | 'pending' | 'failed'
  }>
}

export interface PaymentCard {
  id: string | number
  cardNumber: string
  cardHolder: string
  expiryDate: string
  isDefault: boolean
  cardType: string
}

export interface Subscription {
  id: string
  userId: string
  plan: 'Free' | 'Basic' | 'Pro' | 'Enterprise'
  status: 'Aktif' | 'Askıya Alındı' | 'İptal Edildi' | 'Süresi Doldu'
  monthlyPrice: number
  startDate: string
  endDate: string | null
  autoRenewal: boolean
  paymentCardId: string | null
  createdAt: string
  updatedAt: string
}

export type ChecklistItem = Record<string, boolean>
export type Checklist = Record<string, ChecklistItem>

export interface RecentActivity {
  id: string
  title: string
  date: string
  type: 'service_request' | 'appointment' | 'report'
  createdAt?: string
}

export interface BillingHistoryItem {
  id: string
  date: string
  amount: string
  plan: string
  status: string
  invoice?: string
}
