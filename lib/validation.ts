import { z } from 'zod'

export const serviceRequestSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık çok uzun'),
  equipment: z.string().min(1, 'Ekipman adı gereklidir').max(200, 'Ekipman adı çok uzun'),
  priority: z.enum(['Düşük', 'Orta', 'Yüksek']),
  status: z.enum(['Bekleyen', 'Devam Eden', 'Tamamlanan', 'İptal Edilen']),
  location: z.string().max(500, 'Konum çok uzun').optional(),
  date: z.string().min(1, 'Tarih gereklidir'),
  checklist: z.record(z.string(), z.record(z.string(), z.boolean())).optional()
})

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>

export const appointmentSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık çok uzun'),
  date: z.string().min(1, 'Tarih gereklidir'),
  time: z.string().min(1, 'Saat gereklidir'),
  duration: z.string().min(1, 'Süre gereklidir'),
  type: z.enum(['Bakım', 'Onarım', 'Kontrol', 'Kalibrasyon', 'Diğer']),
  equipment: z.string().min(1, 'Ekipman gereklidir').max(200, 'Ekipman adı çok uzun'),
  notes: z.string().max(1000, 'Notlar çok uzun').optional()
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

export const personnelSchema = z.object({
  name: z.string().min(1, 'Ad soyad gereklidir').max(100, 'Ad soyad çok uzun'),
  role: z.string().min(1, 'Rol gereklidir').max(100, 'Rol çok uzun'),
  email: z.union([
    z.string().email('Geçerli bir e-posta adresi giriniz').max(200, 'E-posta çok uzun'),
    z.literal('')
  ]).optional(),
  phone: z.string().min(1, 'Telefon numarası gereklidir').max(11, 'Telefon numarası en fazla 11 karakter olabilir')
})

export type PersonnelFormData = z.infer<typeof personnelSchema>

export const profileSettingsSchema = z.object({
  firstName: z.string().min(1, 'Ad gereklidir').max(50, 'Ad çok uzun'),
  lastName: z.string().min(1, 'Soyad gereklidir').max(50, 'Soyad çok uzun'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').max(200, 'E-posta çok uzun'),
  phone: z.string().max(20, 'Telefon numarası çok uzun').optional(),
  address: z.string().max(500, 'Adres çok uzun').optional()
})

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>

export const reportSchema = z.object({
  reportNo: z.string().min(1, 'Rapor numarası gereklidir').max(50, 'Rapor numarası çok uzun'),
  date: z.string().min(1, 'Tarih gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir').max(200, 'Şirket adı çok uzun'),
  authorizedPerson: z.string().max(200, 'Yetkili kişi adı çok uzun').optional(),
  contact: z.string().max(200, 'İletişim bilgisi çok uzun').optional(),
  address: z.string().max(500, 'Adres çok uzun').optional(),
  brand: z.string().max(100, 'Marka çok uzun').optional(),
  model: z.string().max(100, 'Model çok uzun').optional(),
  serialNo: z.string().max(100, 'Seri numarası çok uzun').optional(),
  description: z.string().max(2000, 'Açıklama çok uzun').optional(),
  deliveredBy: z.string().max(200, 'Teslim eden çok uzun').optional(),
  deliveredTo: z.string().max(200, 'Teslim alan çok uzun').optional(),
  status: z.enum(['Hazırlanıyor', 'Hazır', 'Gönderildi']).optional(),
  checklist: z.record(z.string(), z.record(z.string(), z.boolean())).optional()
})

export type ReportFormData = z.infer<typeof reportSchema>

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
  newPassword: z.string().min(8, 'Yeni şifre en az 8 karakter olmalıdır').max(100, 'Şifre çok uzun'),
  confirmPassword: z.string().min(1, 'Şifre tekrarı gereklidir')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword']
})

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(1, 'Şifre gereklidir')
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  firstName: z.string().min(1, 'Ad gereklidir').max(50, 'Ad çok uzun'),
  lastName: z.string().min(1, 'Soyad gereklidir').max(50, 'Soyad çok uzun'),
  phone: z.string().max(20, 'Telefon numarası çok uzun').optional()
})

export type RegisterFormData = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz')
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export const verifyEmailSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz')
})

export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token gereklidir')
})

export type RefreshTokenFormData = z.infer<typeof refreshTokenSchema>

export const paymentCardSchema = z.object({
  cardNumber: z.string().min(13, 'Kart numarası geçersiz').max(19, 'Kart numarası geçersiz'),
  cardHolder: z.string().min(1, 'Kart sahibi adı gereklidir').max(100, 'Kart sahibi adı çok uzun'),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, 'Son kullanma tarihi MM/YY formatında olmalıdır'),
  cardType: z.string().min(1, 'Kart tipi gereklidir'),
  isDefault: z.boolean().optional()
})

export type PaymentCardFormData = z.infer<typeof paymentCardSchema>

export const subscriptionUpdateSchema = z.object({
  plan: z.enum(['Free', 'Basic', 'Pro', 'Enterprise']).optional(),
  autoRenewal: z.boolean().optional(),
  paymentCardId: z.string().uuid().optional().nullable(),
  status: z.enum(['Aktif', 'Askıya Alındı', 'İptal Edildi', 'Süresi Doldu']).optional(),
  billingPeriod: z.enum(['monthly', 'yearly']).optional()
})

export type SubscriptionUpdateFormData = z.infer<typeof subscriptionUpdateSchema>

export function formatZodError(error: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {}
  
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    formattedErrors[path] = err.message
  })
  
  return formattedErrors
}
