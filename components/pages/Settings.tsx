'use client'

import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon,
  Save, 
  Trash2, 
  RotateCcw, 
  LogOut,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { fetchWithAuth, fetchServiceRequests, fetchAppointments, fetchReports } from '@/lib/api'
import { logger } from '@/lib/logger'
import { parseDate } from '@/lib/utils'
import type { ServiceRequest, Appointment, Report } from '@/lib/types'

interface ExpiringTask {
  id: string
  type: 'service_request' | 'appointment' | 'report'
  title: string
  date: string
  daysRemaining: number
}

export default function Settings() {
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [desktopNotifications, setDesktopNotifications] = useState(true)
  const [dataStats, setDataStats] = useState({
    serviceRequests: 0,
    appointments: 0,
    reports: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isCheckingExpiring, setIsCheckingExpiring] = useState(false)
  const [expiringTasks, setExpiringTasks] = useState<ExpiringTask[]>([])
  const [hasCheckedExpiring, setHasCheckedExpiring] = useState(false)

  useEffect(() => {
    loadDataStats()
  }, [])

  const loadDataStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await fetchWithAuth('/api/dashboard/stats')
      const data = await response.json()
      if (data.success) {
        setDataStats({
          serviceRequests: data.data.totalServiceRequests || 0,
          appointments: data.data.totalAppointments || 0,
          reports: data.data.totalReports || 0
        })
      }
    } catch (error) {
      logger.error('Error loading data stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const checkExpiringTasks = async () => {
    try {
      setIsCheckingExpiring(true)
      setExpiringTasks([])
      setHasCheckedExpiring(false)

      const [serviceRequests, appointments, reports] = await Promise.all([
        fetchServiceRequests(),
        fetchAppointments(),
        fetchReports()
      ])

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tasks: ExpiringTask[] = []

      serviceRequests.forEach((sr: ServiceRequest) => {
        if (sr.status === 'Bekleyen' || sr.status === 'Devam Eden') {
          const parsedDate = parseDate(sr.date) || new Date(sr.date)
          if (isNaN(parsedDate.getTime())) return
          
          const taskDate = new Date(parsedDate)
          taskDate.setHours(0, 0, 0, 0)
          const daysDiff = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff >= 0 && daysDiff <= 7) {
            tasks.push({
              id: sr.id.toString(),
              type: 'service_request',
              title: sr.title,
              date: sr.date,
              daysRemaining: daysDiff
            })
          }
        }
      })

      appointments.forEach((apt: Appointment) => {
        if (apt.status === 'Planlandı' || apt.status === 'Devam Ediyor') {
          const parsedDate = parseDate(apt.date) || new Date(apt.date)
          if (isNaN(parsedDate.getTime())) return
          
          const taskDate = new Date(parsedDate)
          taskDate.setHours(0, 0, 0, 0)
          const daysDiff = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff >= 0 && daysDiff <= 7) {
            tasks.push({
              id: apt.id.toString(),
              type: 'appointment',
              title: apt.title,
              date: apt.date,
              daysRemaining: daysDiff
            })
          }
        }
      })

      reports.forEach((rep: Report) => {
        if (rep.status === 'Hazırlanıyor' || rep.status === 'Hazır') {
          const parsedDate = parseDate(rep.date) || new Date(rep.date)
          if (isNaN(parsedDate.getTime())) return
          
          const taskDate = new Date(parsedDate)
          taskDate.setHours(0, 0, 0, 0)
          const daysDiff = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysDiff >= 0 && daysDiff <= 7) {
            tasks.push({
              id: rep.id.toString(),
              type: 'report',
              title: rep.reportNo,
              date: rep.date,
              daysRemaining: daysDiff
            })
          }
        }
      })

      tasks.sort((a, b) => a.daysRemaining - b.daysRemaining)
      setExpiringTasks(tasks)
      setHasCheckedExpiring(true)
    } catch (error) {
      logger.error('Error checking expiring tasks:', error)
      setHasCheckedExpiring(true)
    } finally {
      setIsCheckingExpiring(false)
    }
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex align-items-center gap-3 mb-4">
        <SettingsIcon className="h-8 w-8 text-gray-700" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Uygulama ayarlarınızı buradan yönetin
          </p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100" style={{ borderRadius: '12px' }}>
            <div className="p-4 p-md-5">
              <h3 className="text-lg fw-semibold text-gray-900 mb-1">Dışa Aktarma Formatı</h3>
              <p className="text-sm text-gray-500 mb-4">Varsayılan dışa aktarma formatı</p>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="form-select"
                style={{ borderRadius: '8px' }}
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100" style={{ borderRadius: '12px' }}>
            <div className="p-4 p-md-5">
              <h3 className="text-lg fw-semibold text-gray-900 mb-1">Veri İstatistikleri</h3>
              <p className="text-sm text-gray-500 mb-4">Mevcut veri durumu</p>
              {isLoadingStats ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200 h-100" style={{ borderRadius: '8px' }}>
                      <p className="text-2xl fw-bold text-blue-900 mb-1">{dataStats.serviceRequests}</p>
                      <p className="text-xs text-blue-700 mb-0">Servis Talepleri</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200 h-100" style={{ borderRadius: '8px' }}>
                      <p className="text-2xl fw-bold text-green-900 mb-1">{dataStats.appointments}</p>
                      <p className="text-xs text-green-700 mb-0">Randevular</p>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200 h-100" style={{ borderRadius: '8px' }}>
                      <p className="text-2xl fw-bold text-purple-900 mb-1">{dataStats.reports}</p>
                      <p className="text-xs text-purple-700 mb-0">Raporlar</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card h-100" style={{ borderRadius: '12px' }}>
            <div className="p-4 p-md-5">
              <h3 className="text-lg fw-semibold text-gray-900 mb-1">Süresi Azalan İşler</h3>
              <p className="text-sm text-gray-500 mb-4">Yaklaşan son tarihleri kontrol edin</p>
              <button 
                className="btn-primary w-100 d-flex align-items-center justify-content-center" 
                style={{ borderRadius: '8px' }}
                onClick={checkExpiringTasks}
                disabled={isCheckingExpiring}
              >
                {isCheckingExpiring ? (
                  <>
                    <div className="spinner-border spinner-border-sm text-white me-2" role="status" style={{ width: '16px', height: '16px' }}>
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    Kontrol Ediliyor...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 me-2" />
                    Kontrol Et
                  </>
                )}
              </button>
              
              {expiringTasks.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="text-sm fw-semibold text-gray-900 mb-0">Yaklaşan İşler ({expiringTasks.length})</h4>
                    <button
                      className="btn btn-link p-0 text-gray-400"
                      onClick={() => setExpiringTasks([])}
                      style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                    >
                      Kapat
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {expiringTasks.map((task) => (
                      <div 
                        key={`${task.type}-${task.id}`}
                        className="d-flex align-items-start gap-2 p-2 border border-gray-200 rounded-lg"
                        style={{ 
                          backgroundColor: task.daysRemaining <= 3 ? '#fef2f2' : task.daysRemaining <= 5 ? '#fffbeb' : '#f0f9ff',
                          borderColor: task.daysRemaining <= 3 ? '#fecaca' : task.daysRemaining <= 5 ? '#fde68a' : '#bae6fd'
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {task.daysRemaining <= 3 ? (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          ) : task.daysRemaining <= 5 ? (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <p className="text-xs fw-semibold text-gray-900 mb-0.5" style={{ fontSize: '0.75rem' }}>
                            {task.type === 'service_request' ? 'Servis Talebi' : task.type === 'appointment' ? 'Randevu' : 'Rapor'}: {task.title}
                          </p>
                          <p className="text-xs text-gray-600 mb-0" style={{ fontSize: '0.7rem' }}>
                            {(parseDate(task.date) || new Date(task.date)).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} - 
                            <span className={task.daysRemaining <= 3 ? 'text-red-600 fw-semibold' : task.daysRemaining <= 5 ? 'text-yellow-600 fw-semibold' : 'text-blue-600'}>
                              {' '}{task.daysRemaining === 0 ? 'Bugün' : task.daysRemaining === 1 ? '1 gün kaldı' : `${task.daysRemaining} gün kaldı`}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {hasCheckedExpiring && !isCheckingExpiring && expiringTasks.length === 0 && (
                <div className="mt-4 text-center py-3">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-0" style={{ fontSize: '0.75rem' }}>
                    Süresi azalan iş bulunamadı
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="d-flex flex-wrap gap-3 justify-content-center">
        <button 
          className="btn d-flex flex-column align-items-center justify-content-center"
          style={{ 
            borderRadius: '12px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.625rem 1rem',
            minWidth: '110px',
            minHeight: '50px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Trash2 className="h-4 w-4 mb-1" />
          <span className="text-xs fw-medium">Tüm Verileri Temizle</span>
        </button>
        <button 
          className="btn d-flex align-items-center justify-content-center"
          style={{ 
            borderRadius: '12px',
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            padding: '0.625rem 1rem',
            minWidth: '110px',
            minHeight: '50px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb'
            e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white'
            e.currentTarget.style.borderColor = '#e5e7eb'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <RotateCcw className="h-4 w-4 me-2" />
          <span className="text-xs fw-medium">Ayarları Sıfırla</span>
        </button>
        <button 
          className="btn d-flex align-items-center justify-content-center"
          style={{ 
            borderRadius: '12px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '0.625rem 1rem',
            minWidth: '110px',
            minHeight: '50px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Save className="h-4 w-4 me-2" />
          <span className="text-xs fw-medium">Ayarları Kaydet</span>
        </button>
        <button 
          className="btn d-flex flex-column align-items-center justify-content-center"
          style={{ 
            borderRadius: '12px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.625rem 1rem',
            minWidth: '110px',
            minHeight: '50px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <LogOut className="h-4 w-4 mb-1" />
          <span className="text-xs fw-medium">Çıkış Yap</span>
        </button>
      </div>
    </div>
  )
}
