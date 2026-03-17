import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

const emptyStats = {
  activeServiceRequests: 0,
  pendingRepairs: 0,
  totalReports: 0,
  preparingReports: 0,
  completedReports: 0,
  totalAppointments: 0,
  completedAppointments: 0,
  failureRate: 0,
  totalServiceRequests: 0,
  totalCompleted: 0
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/dashboard/stats')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createSuccessResponse(emptyStats), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { data: serviceRequests, error: srError } = await supabase
        .from('service_requests')
        .select('status, priority')

      if (srError) throw srError

      const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select('status')

      if (appError) throw appError

      const { data: reports, error: repError } = await supabase
        .from('reports')
        .select('status')

      if (repError) throw repError

      const activeServiceRequests = serviceRequests?.filter(sr => 
        sr.status === 'Bekleyen' || sr.status === 'Devam Eden'
      ).length || 0

      const pendingRepairs = serviceRequests?.filter(sr => 
        sr.status === 'Bekleyen'
      ).length || 0

      const totalServiceRequests = serviceRequests?.length || 0
      const totalReports = reports?.length || 0
      const preparingReports = reports?.filter(r => r.status === 'Hazırlanıyor').length || 0
      const completedReports = reports?.filter(r => r.status === 'Gönderildi').length || 0
      const totalAppointments = appointments?.length || 0
      const completedAppointments = appointments?.filter(a => a.status === 'Tamamlandı').length || 0
      const highPriorityRequests = serviceRequests?.filter(sr => sr.priority === 'Yüksek').length || 0
      const failureRate = totalServiceRequests > 0 
        ? Math.round((highPriorityRequests / totalServiceRequests) * 100) 
        : 0

      return addCorsHeaders(
        createSuccessResponse({
          activeServiceRequests,
          pendingRepairs,
          totalReports,
          preparingReports,
          completedReports,
          totalAppointments,
          completedAppointments,
          failureRate,
          totalServiceRequests,
          totalCompleted: completedReports + completedAppointments
        }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading dashboard stats:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'İstatistikler yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}
