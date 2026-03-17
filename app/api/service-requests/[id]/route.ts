import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest, validateRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { serviceRequestSchema } from '@/lib/validation'
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
      logRequest('GET', `/api/service-requests/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Servis talebi bulunamadı', 404), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) {
        return addCorsHeaders(
          createErrorResponse(null, 'Servis talebi bulunamadı', 404),
          request.headers.get('origin')
        )
      }

      const formattedData = {
        id: data.id,
        title: data.title,
        equipment: data.equipment,
        priority: data.priority,
        status: data.status,
        location: data.location,
        date: data.date,
        assignedTo: data.assigned_to,
        checklist: data.checklist || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return addCorsHeaders(
        createSuccessResponse(formattedData),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading service request:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Servis talebi yüklenirken bir hata oluştu'),
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
      logRequest('PUT', `/api/service-requests/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const body = await request.json()

      const validation = validateRequest(serviceRequestSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const validatedData = validation.data
      const updateData = {
        title: validatedData.title,
        equipment: validatedData.equipment,
        priority: validatedData.priority,
        status: validatedData.status,
        location: validatedData.location || null,
        date: validatedData.date,
        assigned_to: body.assignedTo || null,
        checklist: validatedData.checklist || {}
      }

      const { data, error } = await supabase
        .from('service_requests')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      if (!data) {
        return addCorsHeaders(
          createErrorResponse(null, 'Servis talebi bulunamadı', 404),
          request.headers.get('origin')
        )
      }

      const formattedData = {
        id: data.id,
        title: data.title,
        equipment: data.equipment,
        priority: data.priority,
        status: data.status,
        location: data.location,
        date: data.date,
        assignedTo: data.assigned_to,
        checklist: data.checklist || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return addCorsHeaders(
        createSuccessResponse(formattedData),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error updating service request:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Servis talebi güncellenirken bir hata oluştu'),
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
      logRequest('DELETE', `/api/service-requests/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      return addCorsHeaders(
        createSuccessResponse({}),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error deleting service request:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Servis talebi silinirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
