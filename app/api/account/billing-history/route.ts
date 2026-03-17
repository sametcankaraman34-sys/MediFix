import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { BillingHistoryItem } from '@/lib/types'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/account/billing-history')
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
      const { data: history, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const formattedHistory: BillingHistoryItem[] = (history || []).map(item => ({
        id: item.id.toString(),
        date: item.date || new Date(item.created_at).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        amount: item.amount.includes('₺') ? item.amount : `${item.amount} ₺`,
        plan: item.plan || 'N/A',
        status: item.status || 'Tamamlandı',
        invoice: item.invoice || false
      }))

      return addCorsHeaders(
        createSuccessResponse(formattedHistory),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading billing history:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Fatura geçmişi yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}
