import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('POST', '/api/auth/logout')

      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }

      if (isDemoUser(user)) {
        return addCorsHeaders(
          createSuccessResponse({ message: 'Başarıyla çıkış yapıldı' }),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const { error } = await supabase.auth.signOut()
      if (error) {
        return addCorsHeaders(
          createErrorResponse(error, error.message),
          request.headers.get('origin')
        )
      }

      return addCorsHeaders(
        createSuccessResponse({ message: 'Başarıyla çıkış yapıldı' }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error during logout:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Çıkış işlemi başarısız oldu'),
        request.headers.get('origin')
      )
    }
  }, 20, 60 * 1000)(request)
}
