import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { validateRequest, personnelSchema } from '@/lib/validation'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', `/api/personnel/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Personel bulunamadı', 404),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) {
        return addCorsHeaders(
          createErrorResponse(null, 'Personel bulunamadı', 404),
          request.headers.get('origin')
        )
      }

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
        createSuccessResponse(formattedData),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading personnel:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Personel bilgileri yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRateLimit(async () => {
    try {
      logRequest('PUT', `/api/personnel/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const body = await request.json()
      const validation = validateRequest(personnelSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const validatedData = validation.data

      const updateData = {
        name: validatedData.name,
        role: validatedData.role,
        email: validatedData.email,
        phone: validatedData.phone || null
      }

      const { data, error } = await supabase
        .from('personnel')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      if (!data) {
        return addCorsHeaders(
          createErrorResponse(null, 'Personel bulunamadı', 404),
          request.headers.get('origin')
        )
      }

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
        createSuccessResponse(formattedData),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error updating personnel:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Personel güncellenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRateLimit(async () => {
    try {
      logRequest('DELETE', `/api/personnel/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const { error } = await supabase
        .from('personnel')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      return addCorsHeaders(
        createSuccessResponse({}),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error deleting personnel:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Personel silinirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
