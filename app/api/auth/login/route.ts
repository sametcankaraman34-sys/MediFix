import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, logRequest, validateRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { loginSchema } from '@/lib/validation'
import { DEMO_ACCESS_TOKEN, demoUser, demoProfile } from '@/lib/auth-server'

const DEMO_EMAIL = 'test@medifix.local'
const DEMO_PASSWORD = 'Test123!'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('POST', '/api/auth/login')
      const body = await request.json()

      const validation = validateRequest(loginSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const { email, password } = validation.data

      if (process.env.NODE_ENV === 'development' && email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const session = {
          access_token: DEMO_ACCESS_TOKEN,
          refresh_token: 'DEMO_REFRESH',
          user: demoUser,
          expires_at: Math.floor(Date.now() / 1000) + 86400
        }
        logger.log('Demo login:', email)
        return addCorsHeaders(
          createSuccessResponse({
            user: demoUser,
            session,
            profile: demoProfile
          }),
          request.headers.get('origin')
        )
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return addCorsHeaders(
          createErrorResponse(error, error.message, 401),
          request.headers.get('origin')
        )
      }

      if (!data.user || !data.session) {
        return addCorsHeaders(
          createErrorResponse(null, 'Giriş başarısız oldu', 401),
          request.headers.get('origin')
        )
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      return addCorsHeaders(
        createSuccessResponse({
          user: data.user,
          session: data.session,
          profile: profile
        }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error during login:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Giriş işlemi başarısız oldu'),
        request.headers.get('origin')
      )
    }
  }, 10, 60 * 1000)(request)
}
