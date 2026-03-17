import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse, logRequest, getSupabaseClient } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser, demoProfile } from '@/lib/auth-server'

type UserMetadata = {
  first_name?: string
  last_name?: string
  name?: string
  role?: string
  phone?: string
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/auth/profile')

      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Oturum bulunamadı. Lütfen tekrar giriş yapın.', 401),
          request.headers.get('origin')
        )
      }

      if (isDemoUser(user)) {
        return addCorsHeaders(
          createSuccessResponse({ user, profile: demoProfile }),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        const userMetadata = (user.user_metadata || {}) as UserMetadata
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            name: userMetadata.name || `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim() || user.email || 'Kullanıcı',
            first_name: userMetadata.first_name || null,
            last_name: userMetadata.last_name || null,
            role: userMetadata.role || 'technician',
            phone: userMetadata.phone || null
          })
          .select()
          .single()

        if (createError) {
          return addCorsHeaders(
            createErrorResponse(createError, 'Profil oluşturulurken bir hata oluştu', 500),
            request.headers.get('origin')
          )
        }

        profile = newProfile
      } else if (profileError) {
        return addCorsHeaders(
          createErrorResponse(profileError, 'Profil bulunamadı', 404),
          request.headers.get('origin')
        )
      }

      if (!profile) {
        return addCorsHeaders(
          createErrorResponse(null, 'Profil bulunamadı', 404),
          request.headers.get('origin')
        )
      }

      return addCorsHeaders(
        createSuccessResponse({
          user,
          profile
        }),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      return addCorsHeaders(
        createErrorResponse(error, 'Profil yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}

export async function PUT(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('PUT', '/api/auth/profile')

      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Oturum bulunamadı. Lütfen tekrar giriş yapın.', 401),
          request.headers.get('origin')
        )
      }

      const body = await request.json()
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createSuccessResponse({ ...demoProfile, ...body }),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const { firstName, lastName, phone, address } = body

      const updateData: Record<string, unknown> = {}
      if (firstName !== undefined) updateData.first_name = firstName
      if (lastName !== undefined) updateData.last_name = lastName
      if (phone !== undefined) updateData.phone = phone
      if (address !== undefined) updateData.address = address

      if (firstName !== undefined || lastName !== undefined) {
        const { data: currentProfile } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        const newFirstName = firstName !== undefined ? firstName : currentProfile?.first_name || ''
        const newLastName = lastName !== undefined ? lastName : currentProfile?.last_name || ''
        const fullName = `${newFirstName} ${newLastName}`.trim()
        
        if (fullName) {
          updateData.name = fullName
        }
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) {
        logger.error('Profile update error:', updateError)
        return addCorsHeaders(
          createErrorResponse(updateError, updateError.message || 'Profil güncellenirken bir hata oluştu'),
          request.headers.get('origin')
        )
      }

      if (!updatedProfile) {
        return addCorsHeaders(
          createErrorResponse(null, 'Profil güncellenemedi', 500),
          request.headers.get('origin')
        )
      }

      return addCorsHeaders(
        createSuccessResponse(updatedProfile),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      return addCorsHeaders(
        createErrorResponse(error, 'Profil güncellenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
