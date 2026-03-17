'use client'

import { useState, useEffect } from 'react'
import { 
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Lock
} from 'lucide-react'
import { logger } from '@/lib/logger'
import { profileSettingsSchema, passwordChangeSchema, formatZodError, type ProfileSettingsFormData, type PasswordChangeFormData } from '@/lib/validation'
import Button from '@/components/Button'
import { useToast } from '@/components/ToastContext'
import { fetchWithAuth } from '@/lib/api'

export default function ProfileSettings() {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth('/api/auth/profile')

      const data = await response.json()
      if (data.success && data.data.profile) {
        const profile = data.data.profile
        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || ''
        })
      }
    } catch (error) {
      logger.error('Error loading profile:', error)
      showError('Profil yüklenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSaving) return
    
    try {
      setIsSaving(true)
      
      const validationResult = profileSettingsSchema.safeParse(formData)

      if (!validationResult.success) {
        const errors = formatZodError(validationResult.error)
        logger.warn('Form validation errors:', errors)
        setFormErrors(errors)
        showError('Lütfen formu doğru şekilde doldurun')
        const firstErrorField = Object.keys(errors)[0]
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          ;(errorElement as HTMLElement).focus()
        }
        return
      }

      setFormErrors({})

      const validatedData = validationResult.data

      const response = await fetchWithAuth('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(validatedData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Profil güncellenirken bir hata oluştu'
        logger.error('Profile update API error:', errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.success) {
        const errorMessage = data.error || 'Profil güncellenirken bir hata oluştu'
        logger.error('Profile update error:', data)
        throw new Error(errorMessage)
      }

      logger.log('Profil ayarları kaydedildi:', validatedData)
      showSuccess('Profil ayarları başarıyla kaydedildi')
      setFormErrors({})
    } catch (error) {
      logger.error('Error saving profile settings:', error)
      showError('Profil ayarları kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isChangingPassword) return
    
    try {
      setIsChangingPassword(true)
      setPasswordErrors({})
      
      const validationResult = passwordChangeSchema.safeParse(passwordData)

      if (!validationResult.success) {
        const errors = formatZodError(validationResult.error)
        logger.warn('Password validation errors:', errors)
        setPasswordErrors(errors)
        showError('Lütfen şifre formunu doğru şekilde doldurun')
        const firstErrorField = Object.keys(errors)[0]
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`)
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          ;(errorElement as HTMLElement).focus()
        }
        return
      }

      const validatedData = validationResult.data

      const response = await fetchWithAuth('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: validatedData.currentPassword,
          newPassword: validatedData.newPassword
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Şifre değiştirilirken bir hata oluştu'
        logger.error('Password change API error:', errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.success) {
        const errorMessage = data.error || 'Şifre değiştirilirken bir hata oluştu'
        logger.error('Password change error:', data)
        throw new Error(errorMessage)
      }

      logger.log('Şifre başarıyla değiştirildi')
      showSuccess('Şifre başarıyla değiştirildi')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors({})
    } catch (error) {
      logger.error('Error changing password:', error)
      const errorMessage = error instanceof Error ? error.message : 'Şifre değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.'
      showError(errorMessage)
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container-fluid px-0">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex align-items-center gap-3 mb-4">
        <User className="h-8 w-8 text-gray-700" />
        <div>
          <h1 className="text-3xl fw-bold text-gray-900 mb-0">Profil Ayarları</h1>
          <p className="mt-1 text-sm text-gray-500 mb-0">
            Kişisel bilgilerinizi ve tercihlerinizi yönetin
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card mb-4">
              <div className="p-4 p-md-5">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg fw-semibold text-gray-900 mb-0">Kişisel Bilgiler</h3>
                </div>
                
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-sm fw-medium text-gray-700">
                      Ad
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Adınızı girin"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-sm fw-medium text-gray-700">
                      Soyad
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Soyadınızı girin"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-sm fw-medium text-gray-700">
                      E-posta
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-gray-50 border-end-0">
                        <Mail className="h-4 w-4 text-gray-500" />
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-sm fw-medium text-gray-700">
                      Telefon
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-gray-50 border-end-0">
                        <Phone className="h-4 w-4 text-gray-500" />
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        placeholder="+90 555 123 45 67"
                      />
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-sm fw-medium text-gray-700">
                      Adres
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-gray-50 border-end-0">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </span>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="form-control border-start-0"
                        rows={3}
                        placeholder="Adres bilginizi girin"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="p-4 p-md-5">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg fw-semibold text-gray-900 mb-0">Şifre Değiştir</h3>
                </div>
                
                <form onSubmit={handlePasswordChange}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label text-sm fw-medium text-gray-700">
                        Mevcut Şifre
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                        placeholder="Mevcut şifrenizi girin"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                      {passwordErrors.currentPassword && (
                        <div className="invalid-feedback">{passwordErrors.currentPassword}</div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-sm fw-medium text-gray-700">
                        Yeni Şifre
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                        placeholder="Yeni şifrenizi girin"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                      {passwordErrors.newPassword && (
                        <div className="invalid-feedback">{passwordErrors.newPassword}</div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-sm fw-medium text-gray-700">
                        Yeni Şifre (Tekrar)
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Yeni şifrenizi tekrar girin"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                      {passwordErrors.confirmPassword && (
                        <div className="invalid-feedback">{passwordErrors.confirmPassword}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isChangingPassword}
                      icon={Lock}
                      iconPosition="left"
                    >
                      Şifreyi Değiştir
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card mb-4">
              <div className="p-4 p-md-5">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <Camera className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg fw-semibold text-gray-900 mb-0">Profil Fotoğrafı</h3>
                </div>
                
                <div className="d-flex flex-column align-items-center">
                  <div className="position-relative mb-3">
                    <div 
                      className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
                      style={{ width: '8rem', height: '8rem' }}
                    >
                      <User className="h-12 w-12" />
                    </div>
                    <button
                      type="button"
                      className="position-absolute bottom-0 end-0 btn btn-primary rounded-circle p-2"
                      style={{ width: '2.5rem', height: '2.5rem' }}
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <button type="button" className="btn btn-outline-primary btn-sm">
                    Fotoğraf Değiştir
                  </button>
                  <button type="button" className="btn btn-link btn-sm text-danger mt-2">
                    Fotoğrafı Kaldır
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="d-flex justify-content-end gap-3 mt-4">
          <button type="button" className="btn btn-outline-secondary">
            İptal
          </button>
          <Button
            type="submit"
            variant="primary"
            loading={isSaving}
            icon={Save}
            iconPosition="left"
          >
            Değişiklikleri Kaydet
          </Button>
        </div>
      </form>
    </div>
  )
}
