'use client'

import { memo, useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Activity,
  Calendar, 
  BarChart3, 
  Settings,
  Users,
  X,
  LogOut
} from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { fetchWithAuth } from '@/lib/api'
import { logger } from '@/lib/logger'
import iconImage from '@/assets/icon.png'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Servis Talepleri', href: '/service-requests', icon: Activity },
  { name: 'Servis Takvimi', href: '/appointments', icon: Calendar },
  { name: 'Raporlar & Analitik', href: '/reports', icon: BarChart3 },
  { name: 'Personel Yönetimi', href: '/personnel', icon: Users },
  { name: 'Ayarlar', href: '/settings', icon: Settings },
]

const Sidebar = memo(function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar()
  const pathname = usePathname()
  const [accountPlan, setAccountPlan] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setSidebarOpen(false)
  }, [setSidebarOpen])

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const response = await fetchWithAuth('/api/account/subscription')
        const data = await response.json()
        if (data.success && data.data) {
          setAccountPlan(data.data.plan)
        } else {
          setAccountPlan('Free')
        }
      } catch (error) {
        logger.error('Error loading subscription:', error)
        setAccountPlan('Free')
      }
    }
    loadSubscription()
  }, [pathname])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname, setSidebarOpen])

  return (
    <>
      <div 
        className={`position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 z-50 d-lg-none transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 d-none'
        }`}
        style={{ transition: 'opacity 0.3s ease-in-out' }}
        onClick={() => setSidebarOpen(false)}
      />

      <div 
        id="sidebar"
        className={`position-fixed top-0 start-0 h-100 bg-white shadow-lg z-50 d-lg-none ${
          sidebarOpen ? '' : 'd-none'
        }`}
        style={{ 
          width: '16rem',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1050
        }}
        role="navigation"
        aria-label="Ana navigasyon"
      >
        <div className="d-flex flex-column h-100">
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-gray-200">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                <Image 
                  src={iconImage}
                  alt="MediFix Logo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div>
                <h1 className="text-lg fw-bold text-gray-900 mb-0">MediFix</h1>
                <p className="text-xs text-gray-500 mb-0">Medical Service</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleClose()
              }}
              className="btn btn-link p-0 text-gray-400 hover:text-gray-600 border-0"
              type="button"
              aria-label="Menüyü kapat"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-grow-1 px-2 py-3 overflow-y-auto" aria-label="Sayfa navigasyonu">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleClose}
                  className={`d-flex align-items-center px-3 py-2 mb-1 text-decoration-none rounded ${
                    isActive
                      ? 'bg-primary bg-opacity-10 text-primary fw-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{ fontSize: '0.875rem' }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="me-3" style={{ width: '1.25rem', height: '1.25rem' }} aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="px-2 py-3 border-top border-gray-200">
            {accountPlan && (
              <div className="px-3 mb-2">
                <span style={{
                  color: '#9ca3af',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  display: 'block',
                  textAlign: 'left'
                }}>
                  {accountPlan === 'Pro' ? 'Pro Hesap' : 'Free Hesap'}
                </span>
              </div>
            )}
            <button 
              className="w-100 d-flex align-items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded border-0 bg-transparent"
              style={{ fontSize: '0.875rem' }}
            >
              <LogOut className="me-3" style={{ width: '1.25rem', height: '1.25rem' }} />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      <div className="d-none d-lg-block position-fixed top-0 start-0 h-100" style={{ width: '16rem', zIndex: 1000 }}>
        <div className="d-flex flex-column h-100 bg-white border-end border-gray-200 shadow-sm">
          <div className="d-flex align-items-center px-4 py-3 border-bottom border-gray-200">
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '2.5rem', height: '2.5rem' }}>
                <Image 
                  src={iconImage}
                  alt="MediFix Logo" 
                  width={40} 
                  height={40}
                  className="object-contain"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div>
                <h1 className="text-lg fw-bold text-gray-900 mb-0">MediFix</h1>
                <p className="text-xs text-gray-500 mb-0">Medical Service</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-grow-1 px-2 py-3 overflow-y-auto" aria-label="Sayfa navigasyonu">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`d-flex align-items-center px-3 py-2 mb-1 text-decoration-none rounded ${
                    isActive
                      ? 'bg-primary bg-opacity-10 text-primary fw-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{ fontSize: '0.875rem' }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="me-3" style={{ width: '1.25rem', height: '1.25rem' }} aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="px-2 py-3 border-top border-gray-200">
            {accountPlan && (
              <div className="px-3 mb-2">
                <span style={{
                  color: '#9ca3af',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  display: 'block',
                  textAlign: 'left'
                }}>
                  {accountPlan === 'Pro' ? 'Pro Hesap' : 'Free Hesap'}
                </span>
              </div>
            )}
            <button 
              className="w-100 d-flex align-items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded border-0 bg-transparent"
              style={{ fontSize: '0.875rem' }}
            >
              <LogOut className="me-3" style={{ width: '1.25rem', height: '1.25rem' }} />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </>
  )
})

export default Sidebar
