'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, User, UserPlus, Phone } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import Button from '@/components/Button'
import { logger } from '@/lib/logger'
import Image from 'next/image'
import iconImage from '@/assets/icon.png'

export default function RegisterPage() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isResendingEmail, setIsResendingEmail] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ad zorunludur'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Ad en az 2 karakter olmalıdır'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad zorunludur'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Soyad en az 2 karakter olmalıdır'
    }

    if (!formData.email) {
      newErrors.email = 'E-posta adresi zorunludur'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }

    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası girin'
    }

    if (!formData.password) {
      newErrors.password = 'Şifre zorunludur'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı zorunludur'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showError('Lütfen formu doğru şekilde doldurun')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!data.success) {
        showError(data.error || 'Kayıt işlemi başarısız oldu')
        setIsLoading(false)
        return
      }

      logger.log('Registration successful:', formData.email)

      if (data.data.needsVerification || (data.data.user && !data.data.user.email_confirmed_at)) {
        setNeedsVerification(true)
        showSuccess('Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.')
        setIsLoading(false)
        return
      }
      
      if (typeof window !== 'undefined' && data.data.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.data.session))
        localStorage.setItem('userEmail', formData.email)
        localStorage.setItem('userName', `${formData.firstName} ${formData.lastName}`)
        
        if (data.data.session.access_token) {
          document.cookie = `sb-access-token=${data.data.session.access_token}; path=/; max-age=86400; SameSite=Lax`
          document.cookie = `sb-refresh-token=${data.data.session.refresh_token}; path=/; max-age=604800; SameSite=Lax`
        }
      }

      showSuccess('Hesabınız başarıyla oluşturuldu')
      
      router.push('/')
    } catch (error) {
      logger.error('Registration error:', error)
      showError('Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResendingEmail(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()
      if (data.success) {
        showSuccess('E-posta doğrulama bağlantısı tekrar gönderildi')
      } else {
        showError(data.error || 'E-posta gönderilemedi')
      }
    } catch (error) {
      logger.error('Resend verification error:', error)
      showError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsResendingEmail(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center mb-4">
            <Image
              src={iconImage}
              alt="MediFix Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl fw-bold text-gray-900 mb-2">Hesap Oluştur</h1>
          <p className="text-gray-600 mb-0">Yeni hesap oluşturun ve başlayın</p>
        </div>

        {needsVerification && (
          <div className="alert alert-warning mb-4" role="alert" style={{ borderRadius: '8px' }}>
            <div className="d-flex align-items-start gap-2">
              <Mail className="h-5 w-5 mt-1 flex-shrink-0" />
              <div className="flex-grow-1">
                <h6 className="fw-semibold mb-2">E-posta Doğrulama Gerekli</h6>
                <p className="mb-2" style={{ fontSize: '0.875rem' }}>
                  <strong>{formData.email}</strong> adresine doğrulama bağlantısı gönderildi. 
                  Lütfen e-posta kutunuzu kontrol edin ve bağlantıya tıklayın.
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                >
                  {isResendingEmail ? 'Gönderiliyor...' : 'E-postayı Tekrar Gönder'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card p-4 p-md-5" style={{ borderRadius: '20px' }}>
          <form onSubmit={handleSubmit}>
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                  Ad
                </label>
                <div className="position-relative">
                  <User className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    className={`form-control ps-5 ${errors.firstName ? 'border-danger' : ''}`}
                    placeholder="Adınız"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value })
                      if (errors.firstName) {
                        setErrors({ ...errors, firstName: '' })
                      }
                    }}
                    style={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-danger text-xs mt-1 mb-0">{errors.firstName}</p>
                )}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                  Soyad
                </label>
                <div className="position-relative">
                  <User className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    className={`form-control ps-5 ${errors.lastName ? 'border-danger' : ''}`}
                    placeholder="Soyadınız"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({ ...formData, lastName: e.target.value })
                      if (errors.lastName) {
                        setErrors({ ...errors, lastName: '' })
                      }
                    }}
                    style={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-danger text-xs mt-1 mb-0">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <div className="position-relative">
                <Mail className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  className={`form-control ps-5 ${errors.email ? 'border-danger' : ''}`}
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) {
                      setErrors({ ...errors, email: '' })
                    }
                  }}
                  style={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                />
              </div>
              {errors.email && (
                <p className="text-danger text-xs mt-1 mb-0">{errors.email}</p>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                Telefon (Opsiyonel)
              </label>
              <div className="position-relative">
                <Phone className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  className={`form-control ps-5 ${errors.phone ? 'border-danger' : ''}`}
                  placeholder="0555 123 4567"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value })
                    if (errors.phone) {
                      setErrors({ ...errors, phone: '' })
                    }
                  }}
                  style={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                />
              </div>
              {errors.phone && (
                <p className="text-danger text-xs mt-1 mb-0">{errors.phone}</p>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                Şifre
              </label>
              <div className="position-relative">
                <Lock className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-control ps-5 pe-5 ${errors.password ? 'border-danger' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) {
                      setErrors({ ...errors, password: '' })
                    }
                  }}
                  style={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="position-absolute top-50 end-0 translate-middle-y me-3 btn btn-link p-0 border-0 text-gray-400 hover:text-gray-600"
                  style={{ minWidth: 'auto', minHeight: 'auto' }}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs mt-1 mb-0">{errors.password}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label text-sm fw-semibold text-gray-700 mb-2">
                Şifre Tekrar
              </label>
              <div className="position-relative">
                <Lock className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className={`form-control ps-5 pe-5 ${errors.confirmPassword ? 'border-danger' : ''}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' })
                    }
                  }}
                  style={{ borderRadius: '12px', padding: '0.75rem 1rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="position-absolute top-50 end-0 translate-middle-y me-3 btn btn-link p-0 border-0 text-gray-400 hover:text-gray-600"
                  style={{ minWidth: 'auto', minHeight: 'auto' }}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-danger text-xs mt-1 mb-0">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="terms"
                  required
                  style={{ borderRadius: '4px' }}
                />
                <label className="form-check-label text-sm text-gray-600" htmlFor="terms">
                  <Link href="/terms" className="text-primary text-decoration-none">
                    Kullanım Şartları
                  </Link>
                  {' '}ve{' '}
                  <Link href="/privacy" className="text-primary text-decoration-none">
                    Gizlilik Politikası
                  </Link>
                  'nı kabul ediyorum
                </label>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              icon={UserPlus}
              iconPosition="left"
              className="w-100"
              style={{ borderRadius: '12px' }}
            >
              Kayıt Ol
            </Button>
          </form>

          <div className="text-center mt-4 pt-4 border-top border-gray-200">
            <p className="text-sm text-gray-600 mb-0">
              Zaten hesabınız var mı?{' '}
              <Link
                href="/login"
                className="text-decoration-none text-primary fw-semibold hover:text-primary-dark"
              >
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 mb-0">
            © 2026 MediFix. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  )
}
