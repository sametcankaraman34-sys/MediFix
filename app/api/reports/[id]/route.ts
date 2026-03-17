import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest, validateRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { reportSchema } from '@/lib/validation'
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
      logRequest('GET', `/api/reports/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Rapor bulunamadı', 404), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (!data) {
        return addCorsHeaders(
          createErrorResponse(null, 'Rapor bulunamadı', 404),
          request.headers.get('origin')
        )
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
        createSuccessResponse(formattedData),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading report:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Rapor yüklenirken bir hata oluştu'),
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
      logRequest('PUT', `/api/reports/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const body = await request.json()

      const validation = validateRequest(reportSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const validatedData = validation.data
      const updateData = {
        report_no: validatedData.reportNo,
        date: validatedData.date,
        company_name: validatedData.companyName,
        authorized_person: validatedData.authorizedPerson || null,
        contact: validatedData.contact || null,
        address: validatedData.address || null,
        brand: validatedData.brand || null,
        model: validatedData.model || null,
        serial_no: validatedData.serialNo || null,
        description: validatedData.description || null,
        delivered_by: validatedData.deliveredBy || null,
        delivered_to: validatedData.deliveredTo || null,
        status: validatedData.status || 'Hazırlanıyor',
        checklist: validatedData.checklist || {}
      }

      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (error) throw error
      if (!data) {
        return addCorsHeaders(
          createErrorResponse(null, 'Rapor bulunamadı', 404),
          request.headers.get('origin')
        )
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
        createSuccessResponse(formattedData),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error updating report:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Rapor güncellenirken bir hata oluştu'),
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
      logRequest('DELETE', `/api/reports/${params.id}`)
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(createErrorResponse(userError, 'Geçersiz session', 401), request.headers.get('origin'))
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      return addCorsHeaders(
        createSuccessResponse({}),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error deleting report:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Rapor silinirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
