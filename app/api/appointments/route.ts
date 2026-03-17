import { NextRequest } from 'next/server'
import { appointmentSchema } from '@/lib/validation'
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
    logRequest('GET', '/api/appointments')
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
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) throw error

    const formattedData = data.map(item => ({
      id: item.id,
      title: item.title,
      date: item.date,
      time: item.time,
      duration: item.duration,
      type: item.type,
      equipment: item.equipment,
      notes: item.notes,
      assignedTo: item.assigned_to,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))

    return addCorsHeaders(
      createSuccessResponse(formattedData),
      request.headers.get('origin')
    )
  } catch (error: unknown) {
    logger.error('Error loading appointments:', error)
    return addCorsHeaders(
      createErrorResponse(error, 'Randevular yüklenirken bir hata oluştu'),
      request.headers.get('origin')
    )
  }
  }, 100, 60 * 1000)(request)
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      const body = await request.json()
      logRequest('POST', '/api/appointments', body)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile randevu eklenemez', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const validation = validateRequest(appointmentSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

    const validatedData = validation.data

    const insertData = {
      title: validatedData.title,
      date: validatedData.date,
      time: validatedData.time,
      duration: validatedData.duration,
      type: validatedData.type,
      equipment: validatedData.equipment,
      notes: validatedData.notes || '',
      assigned_to: body.assignedTo || null,
      status: body.status || 'Planlandı',
      user_id: user.id
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    try {
      await createNotification(
        supabase,
        user.id,
        'Yeni Randevu Oluşturuldu',
        `"${data.title}" başlıklı randevu başarıyla oluşturuldu.`,
        'appointment',
        data.id
      )
    } catch (notifError) {
      logger.error('Failed to create notification:', notifError)
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
        createSuccessResponse(formattedData, 201),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error creating appointment:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Randevu eklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
