import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, logRequest, validateRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { registerSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      const body = await request.json()
      logRequest('POST', '/api/auth/register', { email: body.email, firstName: body.firstName, lastName: body.lastName })

      const validation = validateRequest(registerSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const { email, password, firstName, lastName, phone } = validation.data

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            name: `${firstName} ${lastName}`.trim()
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
        }
      })

      if (authError) {
        logger.error('Supabase Auth Error:', authError)
        const isNetwork = authError.message?.includes('fetch failed') || (authError as Error).cause?.toString().includes('ENOTFOUND')
        const userMessage = isNetwork
          ? 'Supabase bağlantısı kurulamadı. İnternet bağlantınızı ve .env.local içindeki NEXT_PUBLIC_SUPABASE_URL değerini kontrol edin.'
          : (authError.message || 'Kullanıcı oluşturulurken bir hata oluştu')
        return addCorsHeaders(
          createErrorResponse(authError, userMessage, isNetwork ? 503 : 400),
          request.headers.get('origin')
        )
      }

      if (!authData.user) {
        return addCorsHeaders(
          createErrorResponse(
            null,
            'Kullanıcı oluşturulamadı',
            500
          ),
          request.headers.get('origin')
        )
      }

      return addCorsHeaders(
        createSuccessResponse(
          {
            user: authData.user,
            session: authData.session,
            emailConfirmed: !!authData.user.email_confirmed_at,
            needsVerification: !authData.user.email_confirmed_at
          },
          201
        ),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Registration error:', error)
      const err = error instanceof Error ? error : new Error(String(error))
      const isNetwork = err.message?.includes('fetch failed') || err.cause?.toString().includes('ENOTFOUND')
      const userMessage = isNetwork
        ? 'Supabase bağlantısı kurulamadı. İnternet ve .env.local (NEXT_PUBLIC_SUPABASE_URL) kontrol edin.'
        : err.message || 'Kayıt işlemi başarısız oldu'
      return addCorsHeaders(
        createErrorResponse(error, userMessage, isNetwork ? 503 : 500),
        request.headers.get('origin')
      )
    }
  }, 5, 60 * 1000)(request)
}
