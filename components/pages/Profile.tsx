'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ToastContext'
import { logger } from '@/lib/logger'
import { formatDateLong } from '@/lib/utils'
import { fetchWithAuth } from '@/lib/api'

export default function Profile() {
  const { showError } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<{
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    joinDate: string
    role: string
  } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetchWithAuth('/api/auth/profile')

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Profil yüklenirken bir hata oluştu'
        showError(errorMessage)
        logger.error('Profile API error:', errorData)
        return
      }

      const data = await response.json()
      if (data.success && data.data) {
        const profile = data.data.profile
        const user = data.data.user
        
        if (!profile && !user) {
          showError('Profil bulunamadı. Lütfen profil ayarlarından bilgilerinizi güncelleyin.')
          return
        }
        
        if (!profile) {
          showError('Profil kaydı bulunamadı. Lütfen profil ayarlarından bilgilerinizi güncelleyin.')
          return
        }
        
        const joinDate = profile.created_at 
          ? formatDateLong(new Date(profile.created_at))
          : user?.created_at
          ? formatDateLong(new Date(user.created_at))
          : null
        
        const roleMap: Record<string, string> = {
          'admin': 'Yönetici',
          'technician': 'Teknisyen',
          'manager': 'Müdür'
        }
        
        const fullName = profile.name || ''
        const nameParts = fullName.split(' ')
        const firstName = profile.first_name || nameParts[0] || ''
        const lastName = profile.last_name || nameParts.slice(1).join(' ') || ''
        
        setUserData({
          firstName: firstName,
          lastName: lastName,
          email: profile.email || user?.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          joinDate: joinDate || '',
          role: roleMap[profile.role] || profile.role || ''
        })
      } else {
        const errorMessage = data.error || 'Profil yüklenirken bir hata oluştu'
        showError(errorMessage)
      }
    } catch (error) {
      logger.error('Error loading profile:', error)
      showError('Profil yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.')
    } finally {
      setIsLoading(false)
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

  if (!userData) {
    return (
      <div className="container-fluid px-0">
        <div className="d-flex justify-content-center align-items-center py-5">
          <p className="text-gray-500">Profil bilgileri yüklenemedi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white"
            style={{ width: '4rem', height: '4rem' }}
          >
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl fw-bold text-gray-900 mb-0">
              {userData.firstName && userData.lastName 
                ? `${userData.firstName} ${userData.lastName}`.trim()
                : userData.firstName || userData.lastName || 'Kullanıcı'
              }
            </h1>
            {userData.role && (
              <p className="text-sm text-gray-500 mb-0">{userData.role}</p>
            )}
          </div>
        </div>
        <Link href="/profile" className="btn-primary">
          Profil Ayarları
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card">
            <div className="p-4 p-md-5">
              <h3 className="text-lg fw-semibold text-gray-900 mb-4">Kişisel Bilgiler</h3>
              
              <div className="d-flex flex-column gap-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="bg-primary bg-opacity-10 rounded-lg p-2">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-grow-1">
                    <p className="text-sm text-gray-500 mb-1">Ad Soyad</p>
                    <p className="text-base fw-medium text-gray-900 mb-0">
                      {userData.firstName && userData.lastName 
                        ? `${userData.firstName} ${userData.lastName}`.trim()
                        : userData.firstName || userData.lastName || 'Belirtilmemiş'
                      }
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="bg-primary bg-opacity-10 rounded-lg p-2">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-grow-1">
                    <p className="text-sm text-gray-500 mb-1">E-posta</p>
                    <p className="text-base fw-medium text-gray-900 mb-0">
                      {userData.email || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="bg-primary bg-opacity-10 rounded-lg p-2">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-grow-1">
                    <p className="text-sm text-gray-500 mb-1">Telefon</p>
                    <p className="text-base fw-medium text-gray-900 mb-0">
                      {userData.phone || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="bg-primary bg-opacity-10 rounded-lg p-2">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-grow-1">
                    <p className="text-sm text-gray-500 mb-1">Adres</p>
                    {userData.address ? (
                      <p className="text-base fw-medium text-gray-900 mb-0">
                        {userData.address}
                      </p>
                    ) : (
                      <p className="text-base fw-medium text-gray-500 mb-0">
                        Belirtilmemiş
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card mb-4">
            <div className="p-4 p-md-5">
              <h3 className="text-lg fw-semibold text-gray-900 mb-4">Hesap Bilgileri</h3>
              
              <div className="d-flex flex-column gap-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Üyelik Tarihi</p>
                  <div className="d-flex align-items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-base fw-medium text-gray-900 mb-0">
                      {userData.joinDate || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>

                {userData.role && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Rol</p>
                    <div className="d-flex align-items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <p className="text-base fw-medium text-gray-900 mb-0">
                        {userData.role}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-4 p-md-5">
              <h3 className="text-lg fw-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
              
              <div className="d-flex flex-column gap-2">
                <Link href="/profile" className="btn btn-outline-primary w-100">
                  Profil Ayarlarını Düzenle
                </Link>
                <button className="btn btn-outline-secondary w-100">
                  Şifre Değiştir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
