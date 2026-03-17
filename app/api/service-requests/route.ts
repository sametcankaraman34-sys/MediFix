import { NextRequest } from 'next/server'
import { serviceRequestSchema } from '@/lib/validation'
import { validateRequest, createErrorResponse, createSuccessResponse, logRequest, getSupabaseClient } from '@/lib/api-helpers'
import { createNotification } from '@/lib/notifications'
import { logger } from '@/lib/logger'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
  try {
    logRequest('GET', '/api/service-requests')
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
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedData = data.map(item => ({
      id: item.id,
      title: item.title,
      equipment: item.equipment,
      priority: item.priority,
      status: item.status,
      location: item.location,
      date: item.date,
      assignedTo: item.assigned_to,
      checklist: item.checklist || {},
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))

    return addCorsHeaders(
      createSuccessResponse(formattedData),
      request.headers.get('origin')
    )
  } catch (error: unknown) {
    logger.error('Error loading service requests:', error)
    return addCorsHeaders(
      createErrorResponse(error, 'Servis talepleri yüklenirken bir hata oluştu'),
      request.headers.get('origin')
    )
  }
  }, 100, 60 * 1000)(request)
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      const body = await request.json()
      logRequest('POST', '/api/service-requests', body)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile servis talebi eklenemez', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const validation = validateRequest(serviceRequestSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

    const validatedData = validation.data

    const insertData = {
      title: validatedData.title,
      equipment: validatedData.equipment,
      priority: validatedData.priority,
      status: validatedData.status,
      location: validatedData.location,
      date: validatedData.date,
      assigned_to: body.assignedTo || null,
      checklist: validatedData.checklist || {},
      user_id: user.id
    }

    const { data, error } = await supabase
      .from('service_requests')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    try {
      await createNotification(
        supabase,
        user.id,
        'Yeni Servis Talebi Eklendi',
        `"${data.title}" başlıklı servis talebi başarıyla eklendi.`,
        'service_request',
        data.id
      )
    } catch (notifError) {
      logger.error('Failed to create notification:', notifError)
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
      createSuccessResponse(formattedData, 201),
      request.headers.get('origin')
    )
    } catch (error: unknown) {
      logger.error('Error creating service request:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Servis talebi eklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
