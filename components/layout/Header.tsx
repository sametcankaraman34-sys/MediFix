'use client'

import { Search, Bell, User, Settings, UserCog, LogOut, Menu, Check, Trash2 } from 'lucide-react'
import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSidebar } from './SidebarContext'
import iconImage from '@/assets/icon.png'
import { logger } from '@/lib/logger'
import { deleteCookie } from 'cookies-next'
import { fetchWithAuth } from '@/lib/api'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  date: string
  read: boolean
  type?: string
  relatedId?: string
}

const Header = memo(function Header() {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userProfile, setUserProfile] = useState<{
    name: string
    email: string
    role: string
    avatar?: string
  } | null>(null)
  const { toggleSidebar } = useSidebar()
  
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const notificationCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('notifications')
    }
    
    loadNotifications()
    loadUserProfile()

    const interval = setInterval(loadNotifications, 30000)

    const handleNotificationAdded = (event: CustomEvent) => {
      loadNotifications()
    }

    window.addEventListener('notificationAdded', handleNotificationAdded as EventListener)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notificationAdded', handleNotificationAdded as EventListener)
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/profile')
      const data = await response.json()
      if (data.success && data.data.profile) {
        const profile = data.data.profile
        const roleMap: Record<string, string> = {
          'admin': 'Yönetici',
          'technician': 'Teknisyen',
          'manager': 'Müdür'
        }
        
        setUserProfile({
          name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          email: profile.email || data.data.user?.email || '',
          role: roleMap[profile.role] || profile.role || 'Kullanıcı',
          avatar: profile.avatar || undefined
        })
      }
    } catch (error) {
      logger.error('Error loading user profile:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications')
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data || [])
      } else {
        setNotifications([])
      }
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('notifications')
      }
    } catch (error) {
      logger.error('Error loading notifications:', error)
      setNotifications([])
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      })
      const data = await response.json()
      if (data.success) {
        await loadNotifications()
      }
    } catch (error) {
      logger.error('Error marking all as read:', error)
    }
  }

  const deleteAllNotifications = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications', {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        await loadNotifications()
      }
    } catch (error) {
      logger.error('Error deleting all notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetchWithAuth('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ id, read: true })
      })
      const data = await response.json()
      if (data.success) {
        await loadNotifications()
      }
    } catch (error) {
      logger.error('Error marking as read:', error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="sticky top-0 z-40 d-flex align-items-center h-16 border-bottom border-gray-200 bg-white px-3 px-md-4 px-lg-5 shadow-sm">
      <button
        onClick={toggleSidebar}
        className="btn btn-link p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 d-lg-none me-2"
        type="button"
        aria-label="Menüyü aç"
        aria-expanded={false}
        aria-controls="sidebar"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="d-none d-lg-flex align-items-center gap-3 me-4">
        <div className="d-flex align-items-center justify-content-center" style={{ width: '2rem', height: '2rem' }}>
          <Image 
            src={iconImage}
            alt="MediFix Logo" 
            width={32} 
            height={32}
            className="object-contain"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div>
          <h1 className="text-sm fw-bold text-gray-900 mb-0" style={{ lineHeight: '1.2' }}>
            MediFix <span className="text-gray-400">|</span> Medical Service
          </h1>
        </div>
      </div>

      <div className="flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="position-relative w-100" style={{ maxWidth: '42rem' }}>
          <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Ara... (servis talepleri, randevular, raporlar, ekipmanlar)"
            className="form-control ps-5 pe-4 py-2 border border-gray-300 rounded-lg"
            style={{ fontSize: '0.875rem' }}
            aria-label="Arama"
            role="searchbox"
          />
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-md-3">
        <div className="position-relative" ref={notificationRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfile(false)
            }}
            className="btn btn-link p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 position-relative"
            aria-label={`Bildirimler${notificationCount > 0 ? ` (${notificationCount} okunmamış)` : ''}`}
            aria-expanded={showNotifications}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {notificationCount > 0 && (
              <span className="position-absolute top-0 end-0 h-2 w-2 bg-danger rounded-circle border border-2 border-white" aria-label={`${notificationCount} okunmamış bildirim`}></span>
            )}
          </button>

          {showNotifications && (
            <div 
              className="position-absolute end-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50"
              style={{ 
                width: '20rem',
                maxHeight: '28rem',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              role="menu"
              aria-label="Bildirimler"
            >
              <div className="px-3 py-2.5 border-bottom border-gray-100 d-flex align-items-center justify-content-between" style={{ backgroundColor: '#f9fafb' }}>
                <h3 className="text-sm fw-bold text-gray-900 mb-0 d-flex align-items-center gap-2">
                  Bildirimler
                  {notificationCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-pill text-xs fw-semibold" style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.65rem' }}>
                      {notificationCount}
                    </span>
                  )}
                </h3>
                <div className="d-flex align-items-center gap-1">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllAsRead}
                        className="btn btn-link p-1 text-gray-500 text-decoration-none border-0"
                        style={{ fontSize: '0.7rem', padding: '0.25rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                        title="Tümünü okundu işaretle"
                      >
                        <Check style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={deleteAllNotifications}
                        className="btn btn-link p-1 text-gray-500 text-decoration-none border-0"
                        style={{ fontSize: '0.7rem', padding: '0.25rem' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                        title="Tümünü sil"
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '24rem' }}>
                {notifications.length === 0 ? (
                  <div className="p-5 d-flex flex-column align-items-center justify-content-center text-center">
                    <div className="rounded-circle p-2.5 mb-2" style={{ backgroundColor: '#f3f4f6', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell style={{ width: '24px', height: '24px', color: '#9ca3af' }} />
                    </div>
                    <p className="text-xs fw-medium mb-0" style={{ color: '#6b7280', fontSize: '0.7rem' }}>
                      Henüz bildiriminiz yok
                    </p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-3 py-2 border-bottom"
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: !notification.read ? '#eff6ff' : '#ffffff',
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (notification.read) {
                            e.currentTarget.style.backgroundColor = '#f9fafb'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (notification.read) {
                            e.currentTarget.style.backgroundColor = '#ffffff'
                          }
                        }}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="d-flex align-items-start gap-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ 
                              width: '28px', 
                              height: '28px',
                              backgroundColor: notification.type === 'service_request' ? '#dbeafe' :
                                              notification.type === 'appointment' ? '#d1fae5' :
                                              notification.type === 'report' ? '#e9d5ff' :
                                              '#f3f4f6'
                            }}
                          >
                            <Check 
                              style={{ 
                                width: '14px', 
                                height: '14px',
                                color: notification.type === 'service_request' ? '#2563eb' :
                                        notification.type === 'appointment' ? '#059669' :
                                        notification.type === 'report' ? '#7c3aed' :
                                        '#6b7280'
                              }} 
                            />
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                              <h4 className="text-xs fw-semibold mb-0" style={{ lineHeight: '1.3', color: '#111827' }}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <span className="rounded-circle flex-shrink-0" style={{ width: '6px', height: '6px', backgroundColor: '#2563eb', marginTop: '4px' }}></span>
                              )}
                            </div>
                            <p className="text-xs mb-1" style={{ lineHeight: '1.4', color: '#4b5563', wordBreak: 'break-word' }}>
                              {notification.message}
                            </p>
                            <div className="d-flex align-items-center gap-1.5">
                              <span className="text-xs" style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{notification.time}</span>
                              <span className="text-xs" style={{ color: '#d1d5db', fontSize: '0.7rem' }}>•</span>
                              <span className="text-xs" style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{notification.date}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="position-relative" ref={profileRef}>
          <button 
            onClick={() => {
              setShowProfile(!showProfile)
              setShowNotifications(false)
            }}
            className="btn btn-link p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200"
            aria-label="Profil menüsü"
            aria-expanded={showProfile}
            aria-haspopup="true"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </button>

          {showProfile && (
            <div 
              className="position-absolute end-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50"
              style={{ 
                width: '18rem',
                overflow: 'hidden'
              }}
              role="menu"
              aria-label="Profil menüsü"
            >
              <div className="px-4 py-3 border-bottom border-gray-100" style={{ backgroundColor: '#f9fafb' }}>
                <div className="d-flex align-items-center gap-3">
                  {userProfile?.avatar ? (
                    <div className="flex-shrink-0">
                      <img 
                        src={userProfile.avatar} 
                        alt={userProfile.name}
                        className="rounded-circle"
                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ 
                        width: '48px', 
                        height: '48px',
                        backgroundColor: '#3b82f6',
                        color: 'white'
                      }}
                    >
                      <User style={{ width: '24px', height: '24px' }} />
                    </div>
                  )}
                  
                  <div className="flex-grow-1 min-w-0">
                    <h4 className="text-sm fw-bold mb-0" style={{ color: '#111827', lineHeight: '1.3' }}>
                      {userProfile?.name || 'Kullanıcı'}
                    </h4>
                    <p className="text-xs mb-0" style={{ color: '#6b7280', marginTop: '2px' }}>
                      {userProfile?.role || 'Kullanıcı'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/profile/view"
                  onClick={() => setShowProfile(false)}
                  className="d-flex align-items-center px-4 py-2.5 text-sm text-gray-700 text-decoration-none"
                  style={{ 
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <User className="flex-shrink-0" style={{ width: '16px', height: '16px', color: '#6b7280', marginRight: '12px' }} />
                  <span className="fw-medium">Profil</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setShowProfile(false)}
                  className="d-flex align-items-center px-4 py-2.5 text-sm text-gray-700 text-decoration-none"
                  style={{ 
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Settings className="flex-shrink-0" style={{ width: '16px', height: '16px', color: '#6b7280', marginRight: '12px' }} />
                  <span className="fw-medium">Ayarlar</span>
                </Link>
                <Link
                  href="/account"
                  onClick={() => setShowProfile(false)}
                  className="d-flex align-items-center px-4 py-2.5 text-sm text-gray-700 text-decoration-none"
                  style={{ 
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <UserCog className="flex-shrink-0" style={{ width: '16px', height: '16px', color: '#6b7280', marginRight: '12px' }} />
                  <span className="fw-medium">Hesap Yönetimi</span>
                </Link>
                
                <div className="border-top border-gray-100 my-1"></div>
                
                <button
                  onClick={async () => {
                    try {
                      await fetchWithAuth('/api/auth/logout', {
                        method: 'POST'
                      })
                      
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('supabase.auth.token')
                        localStorage.removeItem('authToken')
                        localStorage.removeItem('userEmail')
                        localStorage.removeItem('userName')
                        deleteCookie('sb-access-token', { path: '/' })
                        deleteCookie('sb-refresh-token', { path: '/' })
                        deleteCookie('authToken', { path: '/' })
                      }
                      setShowProfile(false)
                      logger.log('User logged out')
                      router.push('/login')
                      router.refresh()
                    } catch (error) {
                      logger.error('Logout error:', error)
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('supabase.auth.token')
                        localStorage.removeItem('authToken')
                        localStorage.removeItem('userEmail')
                        localStorage.removeItem('userName')
                        deleteCookie('sb-access-token', { path: '/' })
                        deleteCookie('sb-refresh-token', { path: '/' })
                        deleteCookie('authToken', { path: '/' })
                      }
                      router.push('/login')
                      router.refresh()
                    }
                  }}
                  className="w-100 d-flex align-items-center px-4 py-2.5 text-sm text-danger border-0 bg-transparent text-start"
                  style={{ 
                    transition: 'background-color 0.15s ease',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut className="flex-shrink-0" style={{ width: '16px', height: '16px', marginRight: '12px' }} />
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default Header
