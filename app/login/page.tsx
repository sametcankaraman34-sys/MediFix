'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import Button from '@/components/Button'
import { logger } from '@/lib/logger'
import Image from 'next/image'
import iconImage from '@/assets/icon.png'

export default function LoginPage() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'E-posta adresi zorunludur'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin'
    }

    if (!formData.password) {
      newErrors.password = 'Şifre zorunludur'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır'
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!data.success) {
        showError(data.error || 'Giriş işlemi başarısız oldu')
        return
      }

      if (data.data.user && !data.data.user.email_confirmed_at) {
        showError('Lütfen önce e-posta adresinizi doğrulayın. E-posta kutunuzu kontrol edin.')
        return
      }

      logger.log('Login successful:', formData.email)
      
      if (typeof window !== 'undefined' && data.data.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.data.session))
        localStorage.setItem('userEmail', formData.email)
        if (data.data.profile) {
          localStorage.setItem('userName', data.data.profile.name || formData.email)
        }
        
        if (data.data.session.access_token) {
          document.cookie = `sb-access-token=${data.data.session.access_token}; path=/; max-age=86400; SameSite=Lax`
          document.cookie = `sb-refresh-token=${data.data.session.refresh_token}; path=/; max-age=604800; SameSite=Lax`
        }
      }

      showSuccess('Başarıyla giriş yapıldı')
      
      router.push('/')
    } catch (error) {
      logger.error('Login error:', error)
      showError('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-100" style={{ maxWidth: '420px' }}>
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
          <h1 className="text-3xl fw-bold text-gray-900 mb-2">Hoş Geldiniz</h1>
          <p className="text-gray-600 mb-0">Hesabınıza giriş yapın</p>
        </div>

        <div className="card p-4 p-md-5" style={{ borderRadius: '20px' }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
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

            <div className="mb-4">
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

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  style={{ borderRadius: '4px' }}
                />
                <label className="form-check-label text-sm text-gray-600" htmlFor="rememberMe">
                  Beni Hatırla
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-decoration-none text-sm text-primary hover:text-primary-dark"
              >
                Şifremi Unuttum
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              icon={LogIn}
              iconPosition="left"
              className="w-100"
              style={{ borderRadius: '12px' }}
            >
              Giriş Yap
            </Button>
          </form>

          <div className="text-center mt-4 pt-4 border-top border-gray-200">
            <p className="text-sm text-gray-600 mb-0">
              Hesabınız yok mu?{' '}
              <Link
                href="/register"
                className="text-decoration-none text-primary fw-semibold hover:text-primary-dark"
              >
                Kayıt Ol
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
