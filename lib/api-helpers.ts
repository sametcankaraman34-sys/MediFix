import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from './logger'
import { createSupabaseClientWithToken } from './supabase'

export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string; status: number } {
  try {
    const validated = schema.parse(body)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      return { success: false, error: `Validation error: ${errors}`, status: 400 }
    }
    return { success: false, error: 'Invalid request data', status: 400 }
  }
}

export function createErrorResponse(
  error: unknown,
  defaultMessage: string = 'An error occurred',
  statusCode: number = 500
): NextResponse {
  let message = defaultMessage
  let status = statusCode

  if (error instanceof Error) {
    message = error.message
    logger.error(`API Error: ${message}`, { error: error.stack })
  } else if (typeof error === 'string') {
    message = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String(error.message)
  }

  if (message.includes('Validation error') || message.includes('required')) {
    status = 400
  } else if (message.includes('not found') || message.includes('bulunamadı')) {
    status = 404
  } else if (message.includes('unauthorized') || message.includes('yetkisiz')) {
    status = 401
  } else if (message.includes('forbidden') || message.includes('yasak')) {
    status = 403
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString()
    },
    { status: statusCode }
  )
}

export function logRequest(
  method: string,
  path: string,
  body?: unknown
): void {
  logger.log(`API Request: ${method} ${path}`, {
    body: body ? JSON.stringify(body).substring(0, 200) : undefined
  })
}

export function getSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.replace('Bearer ', '') || 
                     request.cookies.get('sb-access-token')?.value ||
                     request.cookies.get('supabase.auth.token')?.value
  
  return createSupabaseClientWithToken(accessToken || undefined)
}
