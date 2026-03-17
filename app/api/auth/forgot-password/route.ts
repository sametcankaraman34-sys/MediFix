import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, logRequest, validateRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { forgotPasswordSchema } from '@/lib/validation'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('POST', '/api/auth/forgot-password')
      const body = await request.json()

      const validation = validateRequest(forgotPasswordSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const { email } = validation.data

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`
      })

      if (error) {
        return addCorsHeaders(
          createErrorResponse(error, error.message, 400),
          request.headers.get('origin')
        )
      }

      return addCorsHeaders(
        createSuccessResponse({
          message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi'
        }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error during forgot password:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Şifre sıfırlama işlemi başarısız oldu'),
        request.headers.get('origin')
      )
    }
  }, 5, 60 * 1000)(request)
}
