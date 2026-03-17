import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier } from './rate-limit'

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request)
    const rateLimit = checkRateLimit(identifier, { windowMs, maxRequests })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    const response = await handler(request)
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toString())

    return response
  }
}

export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',') || [])
    : ['*']

  const corsOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins.includes('*')
    ? '*'
    : allowedOrigins[0] || '*'

  response.headers.set('Access-Control-Allow-Origin', corsOrigin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

export function handleCorsOptions(origin?: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 })
  return addCorsHeaders(response, origin)
}
