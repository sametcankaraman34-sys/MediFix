import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser, demoProfile } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/auth/session')

      const { data: { user }, error } = await getAuthUser(request)
      if (error || !user) {
        return addCorsHeaders(
          createErrorResponse(error, 'Authorization header bulunamadı', 401),
          request.headers.get('origin')
        )
      }

      if (isDemoUser(user)) {
        return addCorsHeaders(
          createSuccessResponse({ user, profile: demoProfile }),
          request.headers.get('origin')
        )
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      return addCorsHeaders(
        createSuccessResponse({
          user,
          profile
        }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error checking session:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Session kontrolü başarısız oldu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}
