import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { formatDateLong } from '@/lib/utils'
import { RecentActivity } from '@/lib/types'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/dashboard/activities')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createSuccessResponse([]), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { data: serviceRequests } = await supabase
        .from('service_requests')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: appointments } = await supabase
        .from('appointments')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: reports } = await supabase
        .from('reports')
        .select('id, report_no, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      const activitiesWithDates: (RecentActivity & { created_at: string })[] = []

      if (serviceRequests) {
        serviceRequests.forEach(sr => {
          activitiesWithDates.push({
            id: sr.id,
            type: 'service_request',
            title: `Servis Talebi: ${sr.title}`,
            date: formatDateLong(new Date(sr.created_at)),
            created_at: sr.created_at
          })
        })
      }

      if (appointments) {
        appointments.forEach(apt => {
          activitiesWithDates.push({
            id: apt.id,
            type: 'appointment',
            title: `Randevu: ${apt.title}`,
            date: formatDateLong(new Date(apt.created_at)),
            created_at: apt.created_at
          })
        })
      }

      if (reports) {
        reports.forEach(rep => {
          activitiesWithDates.push({
            id: rep.id,
            type: 'report',
            title: `Rapor: ${rep.report_no}`,
            date: formatDateLong(new Date(rep.created_at)),
            created_at: rep.created_at
          })
        })
      }

      activitiesWithDates.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      const activities: RecentActivity[] = activitiesWithDates.map(({ created_at, ...rest }) => rest)

      return addCorsHeaders(
        createSuccessResponse(activities.slice(0, 10)), // Return top 10 most recent
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading dashboard activities:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Aktiviteler yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}
