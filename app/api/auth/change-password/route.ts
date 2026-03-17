import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, logRequest, validateRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { passwordChangeSchema } from '@/lib/validation'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('POST', '/api/auth/change-password')
      const body = await request.json()

      const validation = validateRequest(passwordChangeSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const { currentPassword, newPassword } = validation.data

      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(null, 'Oturum bulunamadı. Lütfen tekrar giriş yapın.', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı şifre değiştiremez', 403),
          request.headers.get('origin')
        )
      }

      if (!user.email) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }

      if (!user.email) {
        return addCorsHeaders(
          createErrorResponse(null, 'E-posta adresi bulunamadı', 400),
          request.headers.get('origin')
        )
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (signInError) {
        return addCorsHeaders(
          createErrorResponse(signInError, 'Mevcut şifre hatalı', 401),
          request.headers.get('origin')
        )
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        logger.error('Password update error:', updateError)
        return addCorsHeaders(
          createErrorResponse(updateError, updateError.message || 'Şifre güncellenirken bir hata oluştu', 400),
          request.headers.get('origin')
        )
      }

      return addCorsHeaders(
        createSuccessResponse({
          message: 'Şifre başarıyla değiştirildi'
        }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      return addCorsHeaders(
        createErrorResponse(error, 'Şifre değiştirilirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 5, 60 * 1000)(request)
}
