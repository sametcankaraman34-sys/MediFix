import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { formatTime, formatDate } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { Notification } from '@/lib/types'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/notifications')
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
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const formattedNotifications: Notification[] = (notifications || []).map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        time: formatTime(new Date(notif.created_at)),
        date: formatDate(new Date(notif.created_at)),
        read: notif.read,
        type: notif.type || 'info',
        relatedId: notif.related_id
      }))

      return addCorsHeaders(
        createSuccessResponse(formattedNotifications),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading notifications:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Bildirimler yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}

export async function PUT(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('PUT', '/api/notifications')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createSuccessResponse({}), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const body = await request.json()
      const { id, read } = body

      if (id) {
        const { error } = await supabase
          .from('notifications')
          .update({ read: read !== undefined ? read : true })
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false)

        if (error) throw error
      }

      return addCorsHeaders(
        createSuccessResponse({}),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error updating notification:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Bildirim güncellenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}

export async function DELETE(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('DELETE', '/api/notifications')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createSuccessResponse({}), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (id) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)

        if (error) throw error
      }

      return addCorsHeaders(
        createSuccessResponse({}),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error deleting notification:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Bildirim silinirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
