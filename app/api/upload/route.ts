import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('POST', '/api/upload')

      const formData = await request.formData()
      const file = formData.get('file') as File
      const folder = formData.get('folder') as string || 'reports'

      if (!file) {
        return addCorsHeaders(
          createErrorResponse(null, 'Dosya bulunamadı', 400),
          request.headers.get('origin')
        )
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        return addCorsHeaders(
          createErrorResponse(null, 'Dosya boyutu 10MB\'dan büyük olamaz', 400),
          request.headers.get('origin')
        )
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Geçersiz dosya tipi. Sadece resim, PDF ve Word dosyaları kabul edilir', 400),
          request.headers.get('origin')
        )
      }

      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExt = file.name.split('.').pop()
      const fileName = `${timestamp}-${randomString}.${fileExt}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(`${folder}/${fileName}`, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(`${folder}/${fileName}`)

      return addCorsHeaders(
        createSuccessResponse({
          url: urlData.publicUrl,
          path: uploadData.path,
          fileName: fileName,
          size: file.size,
          type: file.type
        }, 201),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error uploading file:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Dosya yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 20, 60 * 1000)(request)
}
