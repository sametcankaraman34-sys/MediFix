'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import Button from '@/components/Button'
import { logger } from '@/lib/logger'
import Image from 'next/image'
import iconImage from '@/assets/icon.png'
import { supabaseClient } from '@/lib/supabase-client'

function ResetPasswordContent() {
  const { showSuccess, showError } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    const hash = searchParams?.get('hash') ?? null
    const type = searchParams?.get('type') ?? null

    if (!hash || type !== 'recovery') {
      showError('Geçersiz veya eksik şifre sıfırlama bağlantısı')
      setIsValidating(false)
      return
    }

    setIsValidating(false)
  }, [searchParams, showError])

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!password) {
      newErrors.password = 'Şifre zorunludur'
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı zorunludur'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const hash = searchParams?.get('hash') ?? null
      const type = searchParams?.get('type') ?? null

      if (!hash || type !== 'recovery') {
        showError('Geçersiz şifre sıfırlama bağlantısı')
        return
      }

      const { error } = await supabaseClient.auth.updateUser({
        password: password
      })

      if (error) {
        showError(error.message || 'Şifre güncellenirken bir hata oluştu')
        return
      }

      logger.log('Password reset successful')
      showSuccess('Şifreniz başarıyla güncellendi')
      setIsSuccess(true)

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      logger.error('Password reset error:', error)
      showError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f5f7fa', padding: '2rem 1rem' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f5f7fa', padding: '2rem 1rem' }}>
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center justify-content-center">
            <Image
              src={iconImage}
              alt="MediFix Logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: '16px', border: 'none', padding: '2rem' }}>
          <div className="text-center mb-4">
            <h1 className="fw-bold text-gray-900 mb-2" style={{ fontSize: '1.5rem' }}>
              {isSuccess ? 'Şifre Güncellendi' : 'Yeni Şifre Belirle'}
            </h1>
            <p className="text-gray-600 mb-0" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
              {isSuccess 
                ? 'Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...' 
                : 'Yeni şifrenizi girin'}
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>
                  Yeni Şifre
                </label>
                <div className="position-relative">
                  <Lock className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" style={{ zIndex: 10, pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-control ps-5 pe-5 ${errors.password ? 'border-danger' : ''}`}
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) {
                        setErrors({ ...errors, password: undefined })
                      }
                    }}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      borderWidth: '1px',
                      fontSize: '0.875rem',
                      borderColor: errors.password ? '#dc3545' : '#dee2e6'
                    }}
                  />
                  <button
                    type="button"
                    className="position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ zIndex: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-danger mt-1 mb-0" style={{ fontSize: '0.75rem' }}>{errors.password}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold text-gray-700 mb-2" style={{ fontSize: '0.875rem' }}>
                  Şifre Tekrar
                </label>
                <div className="position-relative">
                  <Lock className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" style={{ zIndex: 10, pointerEvents: 'none' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-control ps-5 pe-5 ${errors.confirmPassword ? 'border-danger' : ''}`}
                    placeholder="Şifrenizi tekrar girin"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: undefined })
                      }
                    }}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.75rem 1rem 0.75rem 2.75rem',
                      borderWidth: '1px',
                      fontSize: '0.875rem',
                      borderColor: errors.confirmPassword ? '#dc3545' : '#dee2e6'
                    }}
                  />
                  <button
                    type="button"
                    className="position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ zIndex: 10 }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-danger mt-1 mb-0" style={{ fontSize: '0.75rem' }}>{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-100 mb-3 border-0 text-white fw-semibold d-flex align-items-center justify-content-center gap-2"
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: '10px',
                  padding: '0.875rem 1.5rem',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Güncelleniyor...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5" strokeWidth={2.5} />
                    <span>Şifreyi Güncelle</span>
                  </>
                )}
              </button>

              <div className="text-center pt-3" style={{ borderTop: '1px solid #e9ecef' }}>
                <Link
                  href="/login"
                  className="text-decoration-none text-gray-600 d-inline-flex align-items-center gap-1"
                  style={{ fontSize: '0.875rem' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Giriş sayfasına dön
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center py-2">
              <div className="mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-3 mb-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-lg fw-semibold text-gray-900 mb-2">
                  Şifre Güncellendi
                </h3>
                <p className="text-sm text-gray-600 mb-0">
                  Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
                </p>
              </div>
              <Link
                href="/login"
                className="text-decoration-none text-sm text-primary hover:text-primary-dark"
              >
                Giriş sayfasına git
              </Link>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-500 mb-0" style={{ fontSize: '0.75rem' }}>
            ©2026 MediFix. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f5f7fa', padding: '2rem 1rem' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
