import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/dashboard/analytics')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createSuccessResponse({
            serviceRequests: { byStatus: {}, byPriority: {}, total: 0, trend: 0 },
            appointments: { byStatus: {}, byType: {}, total: 0 },
            reports: { byStatus: {}, total: 0 },
            period: { startDate: null, endDate: null }
          }),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const { searchParams } = new URL(request.url)
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      let serviceRequestsQuery = supabase
        .from('service_requests')
        .select('status, priority, created_at')

      if (startDate && endDate) {
        serviceRequestsQuery = serviceRequestsQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      }

      const { data: serviceRequests, error: srError } = await serviceRequestsQuery

      if (srError) throw srError

      let appointmentsQuery = supabase
        .from('appointments')
        .select('status, type, created_at')

      if (startDate && endDate) {
        appointmentsQuery = appointmentsQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      }

      const { data: appointments, error: appError } = await appointmentsQuery

      if (appError) throw appError

      let reportsQuery = supabase
        .from('reports')
        .select('status, created_at')

      if (startDate && endDate) {
        reportsQuery = reportsQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate)
      }

      const { data: reports, error: repError } = await reportsQuery

      if (repError) throw repError

      const serviceRequestsByStatus = (serviceRequests || []).reduce((acc: Record<string, number>, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})

      const serviceRequestsByPriority = (serviceRequests || []).reduce((acc: Record<string, number>, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1
        return acc
      }, {})

      const appointmentsByStatus = (appointments || []).reduce((acc: Record<string, number>, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})

      const appointmentsByType = (appointments || []).reduce((acc: Record<string, number>, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {})

      const reportsByStatus = (reports || []).reduce((acc: Record<string, number>, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})

      const now = new Date()
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const previous7Days = new Date(last7Days.getTime() - 7 * 24 * 60 * 60 * 1000)

      const { data: recentServiceRequests } = await supabase
        .from('service_requests')
        .select('created_at')
        .gte('created_at', last7Days.toISOString())

      const { data: previousServiceRequests } = await supabase
        .from('service_requests')
        .select('created_at')
        .gte('created_at', previous7Days.toISOString())
        .lt('created_at', last7Days.toISOString())

      const serviceRequestsTrend = previousServiceRequests?.length
        ? ((recentServiceRequests?.length || 0) - previousServiceRequests.length) / previousServiceRequests.length * 100
        : 0

      return addCorsHeaders(
        createSuccessResponse({
          serviceRequests: {
            byStatus: serviceRequestsByStatus,
            byPriority: serviceRequestsByPriority,
            total: serviceRequests?.length || 0,
            trend: Math.round(serviceRequestsTrend)
          },
          appointments: {
            byStatus: appointmentsByStatus,
            byType: appointmentsByType,
            total: appointments?.length || 0
          },
          reports: {
            byStatus: reportsByStatus,
            total: reports?.length || 0
          },
          period: {
            startDate: startDate || null,
            endDate: endDate || null
          }
        }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading dashboard analytics:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Analytics verileri yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}
