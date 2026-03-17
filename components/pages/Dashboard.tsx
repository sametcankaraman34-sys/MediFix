'use client'

import { memo, useState, useEffect } from 'react'
import { 
  Activity,
  Wrench,
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Plus,
  Calendar as CalendarIcon,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { fetchWithAuth } from '@/lib/api'
import { logger } from '@/lib/logger'
import type { RecentActivity } from '@/lib/types'

function Dashboard() {
  const [stats, setStats] = useState({
    activeServiceRequests: 0,
    pendingRepairs: 0,
    totalReports: 0,
    preparingReports: 0,
    completedReports: 0,
    totalAppointments: 0,
    failureRate: 0,
    totalCompleted: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    loadStats(true)
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStats(false)
      }
    }
    
    const handleFocus = () => {
      loadStats(false)
    }
    
    const handleDataChange = () => {
      loadStats(false)
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('serviceRequestChanged', handleDataChange)
    window.addEventListener('appointmentChanged', handleDataChange)
    window.addEventListener('reportChanged', handleDataChange)
    
    const interval = setInterval(() => {
      loadStats(false)
    }, 30000)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('serviceRequestChanged', handleDataChange)
      window.removeEventListener('appointmentChanged', handleDataChange)
      window.removeEventListener('reportChanged', handleDataChange)
      clearInterval(interval)
    }
  }, [])

  const loadStats = async (showLoading: boolean = false) => {
    try {
      if (showLoading && isInitialLoad) {
        setIsLoading(true)
      }
      
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetchWithAuth('/api/dashboard/stats'),
        fetchWithAuth('/api/dashboard/activities')
      ])
      
      const statsData = await statsResponse.json()
      const activitiesData = await activitiesResponse.json()
      
      if (statsData?.success) {
        setStats(statsData.data)
      }
      
      if (activitiesData?.success) {
        setRecentActivities(activitiesData.data || [])
      }
    } catch (error) {
      logger.error('Error loading stats:', error)
    } finally {
      if (isInitialLoad) {
        setIsLoading(false)
        setIsInitialLoad(false)
      }
    }
  }

  const statsCards = [
    { 
      name: 'Aktif Servis Talepleri', 
      value: stats.activeServiceRequests.toString(),
      subtitle: `${stats.activeServiceRequests} talep`,
      icon: Activity, 
      iconBg: 'bg-blue-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Bekleyen Onarımlar', 
      value: stats.pendingRepairs.toString(),
      subtitle: `${stats.pendingRepairs} onarım`,
      icon: Wrench, 
      iconBg: 'bg-orange-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Toplam Rapor Sayısı', 
      value: stats.totalReports.toString(),
      subtitle: `${stats.totalReports} rapor`,
      icon: Package, 
      iconBg: 'bg-green-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Hazırlanan Raporlar', 
      value: stats.preparingReports.toString(),
      subtitle: stats.preparingReports > 0 ? `${stats.preparingReports} rapor hazırlanıyor` : 'Hazırlanan rapor yok',
      icon: Clock, 
      iconBg: 'bg-yellow-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Tamamlanan Raporlar', 
      value: stats.completedReports.toString(),
      subtitle: stats.completedReports > 0 ? `${stats.completedReports} rapor tamamlandı` : 'Tamamlanan rapor yok',
      icon: CheckCircle, 
      iconBg: 'bg-green-500',
      iconColor: 'text-white'
    },
    { 
      name: 'Cihaz Arıza Oranı', 
      value: `${stats.failureRate}%`,
      subtitle: `${stats.failureRate}% arıza oranı`,
      icon: TrendingUp, 
      iconBg: 'bg-red-500',
      iconColor: 'text-white'
    },
  ]

  const quickStats = [
    { name: 'Tamamlanan İşler', value: stats.totalCompleted.toString(), color: 'text-green-600' },
    { name: 'Aktif İşler', value: stats.activeServiceRequests.toString(), color: 'text-blue-600' },
    { name: 'Randevular', value: stats.totalAppointments.toString(), color: 'text-orange-600' },
  ]

  return (
    <div className="container-fluid px-0">
      <div className="mb-5">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-base text-gray-600">
          Sistem genel durumu ve istatistikler
        </p>
      </div>

      {isLoading ? (
        <div className="row g-4 mb-5">
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-3 mb-4">
          {statsCards.map((stat, index) => (
          <div key={stat.name} className="col-12 col-sm-6 col-lg-4" style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s both` }}>
            <div className="card card-hover h-100 p-3 border-0" style={{ borderRadius: '12px' }}>
              <div className="d-flex align-items-start gap-3">
                <div className={`${stat.iconBg} rounded-lg p-2.5 flex-shrink-0 shadow-md`} style={{ borderRadius: '8px' }}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold text-gray-900 mb-1" style={{ lineHeight: '1.2' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-semibold text-gray-900 mb-0.5">
                    {stat.name}
                  </p>
                  <p className="text-xs text-gray-500 mb-0">
                    {stat.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      <div className="row g-4 mb-5">
        <div className="col-12 col-lg-8">
          <div className="card h-100 border-0" style={{ borderRadius: '16px' }}>
            <div className="p-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 m-0">
                  Son Aktiviteler
                </h3>
                <Link 
                  href="/reports" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold text-decoration-none d-flex align-items-center gap-1 transition-colors"
                >
                  Tümünü Görüntüle
                  <span>→</span>
                </Link>
              </div>
              {recentActivities.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-6 text-center">
                  <div className="bg-gray-100 rounded-full p-4 mb-3" style={{ borderRadius: '50%' }}>
                    <Activity className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">
                    Henüz aktivite yok
                  </p>
                  <p className="text-sm text-gray-500 mb-0">
                    Sistem aktiviteleri burada görüntülenecek
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="d-flex align-items-start gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className={`rounded-circle p-2 flex-shrink-0 ${activity.type === 'service_request' ? 'bg-blue-100' : activity.type === 'appointment' ? 'bg-green-100' : 'bg-purple-100'}`}>
                        {activity.type === 'service_request' ? (
                          <Activity className="h-4 w-4 text-blue-600" />
                        ) : activity.type === 'appointment' ? (
                          <CalendarIcon className="h-4 w-4 text-green-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 mb-0">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card h-100 border-0" style={{ borderRadius: '16px' }}>
            <div className="p-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 m-0">
                  Hızlı İstatistikler
                </h3>
                <div className="bg-blue-100 rounded-lg p-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="d-flex flex-column gap-4">
                {quickStats.map((stat, index) => (
                  <div key={stat.name} className="d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-sm font-semibold text-gray-700">{stat.name}</span>
                      <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                    <div className="w-100" style={{ height: '6px', backgroundColor: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div 
                        className={`h-100 rounded-full transition-all duration-500`}
                        style={{ 
                          width: '0%',
                          backgroundColor: stat.color === 'text-green-600' ? '#10b981' : stat.color === 'text-blue-600' ? '#3b82f6' : '#f97316',
                          animation: `slideUp 0.5s ease-out ${index * 0.1 + 0.3}s both`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Hızlı İşlemler</h3>
        <div className="row g-2">
          <div className="col-12 col-sm-6 col-md-4">
            <Link 
              href="/service-requests" 
              className="d-inline-flex align-items-center justify-content-center w-100 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md transition-all duration-200 text-decoration-none"
              style={{ borderRadius: '8px' }}
            >
              <Activity className="h-4 w-4 me-1.5" />
              Yeni Servis Talebi
            </Link>
          </div>
          <div className="col-12 col-sm-6 col-md-4">
            <Link 
              href="/appointments" 
              className="d-inline-flex align-items-center justify-content-center w-100 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-sm hover:shadow-md transition-all duration-200 text-decoration-none"
              style={{ borderRadius: '8px' }}
            >
              <CalendarIcon className="h-4 w-4 me-1.5" />
              Randevu Oluştur
            </Link>
          </div>
          <div className="col-12 col-sm-6 col-md-4">
            <Link 
              href="/reports" 
              className="d-inline-flex align-items-center justify-content-center w-100 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-sm hover:shadow-md transition-all duration-200 text-decoration-none"
              style={{ borderRadius: '8px' }}
            >
              <FileText className="h-4 w-4 me-1.5" />
              Rapor Oluştur
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Dashboard)
