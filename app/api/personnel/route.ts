import { NextRequest } from 'next/server'
import { personnelSchema } from '@/lib/validation'
import { validateRequest, createErrorResponse, createSuccessResponse, logRequest, getSupabaseClient } from '@/lib/api-helpers'
import { withRateLimit, addCorsHeaders, handleCorsOptions } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/personnel')
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
    const { data, error } = await supabase
      .from('personnel')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedData = data.map(item => ({
      id: item.id,
      name: item.name,
      role: item.role,
      email: item.email,
      phone: item.phone,
      department: item.department,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))

    return addCorsHeaders(
      createSuccessResponse(formattedData),
      request.headers.get('origin')
    )
  } catch (error: unknown) {
    logger.error('Error loading personnel:', error)
    return addCorsHeaders(
      createErrorResponse(error, 'Personel listesi yüklenirken bir hata oluştu'),
      request.headers.get('origin')
    )
  }
  }, 100, 60 * 1000)(request)
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      const body = await request.json()
      logRequest('POST', '/api/personnel', body)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile personel eklenemez', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const validation = validateRequest(personnelSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

    const validatedData = validation.data

    const { data, error } = await supabase
      .from('personnel')
      .insert([validatedData])
      .select()
      .single()

    if (error) throw error

    const formattedData = {
      id: data.id,
      name: data.name,
      role: data.role,
      email: data.email,
      phone: data.phone,
      department: data.department,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

      return addCorsHeaders(
        createSuccessResponse(formattedData, 201),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error creating personnel:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Personel eklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
