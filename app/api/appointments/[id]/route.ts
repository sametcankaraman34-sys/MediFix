import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest, validateRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { appointmentSchema } from '@/lib/validation'
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
      logRequest('GET', `/api/appointments/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Randevu bulunamadı', 404), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) {
        return addCorsHeaders(
          createErrorResponse(null, 'Randevu bulunamadı', 404),
          request.headers.get('origin')
        )
      }

      const formattedData = {
        id: data.id,
        title: data.title,
        date: data.date,
        time: data.time,
        duration: data.duration,
        type: data.type,
        equipment: data.equipment,
        notes: data.notes,
        assignedTo: data.assigned_to,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return addCorsHeaders(
        createSuccessResponse(formattedData),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading appointment:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Randevu yüklenirken bir hata oluştu'),
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
      logRequest('PUT', `/api/appointments/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const body = await request.json()

      const validation = validateRequest(appointmentSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const validatedData = validation.data
      const updateData = {
        title: validatedData.title,
        date: validatedData.date,
        time: validatedData.time,
        duration: validatedData.duration,
        type: validatedData.type,
        equipment: validatedData.equipment,
        notes: validatedData.notes || null,
        assigned_to: body.assignedTo || null,
        status: body.status || 'Planlandı'
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      if (!data) {
        return addCorsHeaders(
          createErrorResponse(null, 'Randevu bulunamadı', 404),
          request.headers.get('origin')
        )
      }

      const formattedData = {
        id: data.id,
        title: data.title,
        date: data.date,
        time: data.time,
        duration: data.duration,
        type: data.type,
        equipment: data.equipment,
        notes: data.notes,
        assignedTo: data.assigned_to,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return addCorsHeaders(
        createSuccessResponse(formattedData),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error updating appointment:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Randevu güncellenirken bir hata oluştu'),
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
      logRequest('DELETE', `/api/appointments/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      return addCorsHeaders(
        createSuccessResponse({}),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error deleting appointment:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Randevu silinirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
