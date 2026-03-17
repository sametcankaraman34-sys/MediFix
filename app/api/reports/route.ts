import { NextRequest } from 'next/server'
import { reportSchema } from '@/lib/validation'
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
    logRequest('GET', '/api/reports')
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
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const formattedData = data.map(item => ({
      id: item.id,
      reportNo: item.report_no,
      date: item.date,
      companyName: item.company_name,
      authorizedPerson: item.authorized_person,
      contact: item.contact,
      address: item.address,
      brand: item.brand,
      model: item.model,
      serialNo: item.serial_no,
      description: item.description,
      deliveredBy: item.delivered_by,
      deliveredTo: item.delivered_to,
      status: item.status,
      checklist: item.checklist || {},
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))

    return addCorsHeaders(
      createSuccessResponse(formattedData),
      request.headers.get('origin')
    )
  } catch (error: unknown) {
    logger.error('Error loading reports:', error)
    return addCorsHeaders(
      createErrorResponse(error, 'Raporlar yüklenirken bir hata oluştu'),
      request.headers.get('origin')
    )
  }
  }, 100, 60 * 1000)(request)
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      const body = await request.json()
      logRequest('POST', '/api/reports', body)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile rapor eklenemez', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const validation = validateRequest(reportSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

    const validatedData = validation.data

    const insertData = {
      report_no: validatedData.reportNo,
      date: validatedData.date,
      company_name: validatedData.companyName,
      authorized_person: validatedData.authorizedPerson,
      contact: validatedData.contact,
      address: validatedData.address,
      brand: validatedData.brand,
      model: validatedData.model,
      serial_no: validatedData.serialNo,
      description: validatedData.description,
      delivered_by: validatedData.deliveredBy,
      delivered_to: validatedData.deliveredTo,
      status: validatedData.status || 'Hazırlanıyor',
      checklist: validatedData.checklist || {},
      user_id: user.id
    }

    const { data, error } = await supabase
      .from('reports')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    try {
      await createNotification(
        supabase,
        user.id,
        'Yeni Rapor Oluşturuldu',
        `"${data.report_no}" numaralı rapor başarıyla oluşturuldu.`,
        'report',
        data.id
      )
    } catch (notifError) {
      logger.error('Failed to create notification:', notifError)
    }

    const formattedData = {
      id: data.id,
      reportNo: data.report_no,
      date: data.date,
      companyName: data.company_name,
      authorizedPerson: data.authorized_person,
      contact: data.contact,
      address: data.address,
      brand: data.brand,
      model: data.model,
      serialNo: data.serial_no,
      description: data.description,
      deliveredBy: data.delivered_by,
      deliveredTo: data.delivered_to,
      status: data.status,
      checklist: data.checklist || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }

      return addCorsHeaders(
        createSuccessResponse(formattedData, 201),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error creating report:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Rapor eklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
