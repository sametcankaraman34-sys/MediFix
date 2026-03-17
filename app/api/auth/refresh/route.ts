import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, logRequest, validateRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { refreshTokenSchema } from '@/lib/validation'
import { DEMO_ACCESS_TOKEN, demoUser, demoProfile } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('POST', '/api/auth/refresh')
      const body = await request.json()

      const validation = validateRequest(refreshTokenSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const { refreshToken } = validation.data

      if (process.env.NODE_ENV === 'development' && refreshToken === 'DEMO_REFRESH') {
        const session = {
          access_token: DEMO_ACCESS_TOKEN,
          refresh_token: 'DEMO_REFRESH',
          user: demoUser,
          expires_at: Math.floor(Date.now() / 1000) + 86400
        }
        return addCorsHeaders(
          createSuccessResponse({ session, user: demoUser, profile: demoProfile }),
          request.headers.get('origin')
        )
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (error) {
        return addCorsHeaders(
          createErrorResponse(error, error.message, 401),
          request.headers.get('origin')
        )
      }

      if (!data.session) {
        return addCorsHeaders(
          createErrorResponse(null, 'Session yenilenemedi', 401),
          request.headers.get('origin')
        )
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      return addCorsHeaders(
        createSuccessResponse({
          session: data.session,
          user: data.session.user,
          profile: profile
        }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error refreshing session:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Session yenilenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 20, 60 * 1000)(request)
}
