import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { Subscription } from '@/lib/types'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

const PLAN_PRICES: Record<string, number> = {
  'Free': 0.00,
  'Basic': 99.00,
  'Pro': 499.00,
  'Enterprise': 499.00
}

const demoSubscription: Subscription = {
  id: 'demo-sub',
  userId: '00000000-0000-0000-0000-000000000001',
  plan: 'Free',
  status: 'Aktif',
  monthlyPrice: 0,
  startDate: new Date().toISOString(),
  endDate: null,
  autoRenewal: true,
  paymentCardId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/account/subscription')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createSuccessResponse(demoSubscription), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      let { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!subscription) {
        const defaultSubscription = {
          user_id: user.id,
          plan: 'Free',
          status: 'Aktif',
          monthly_price: PLAN_PRICES['Free'],
          start_date: new Date().toISOString(),
          end_date: null,
          auto_renewal: true,
          payment_card_id: null
        }

        const { data: newSubscription, error: createError } = await supabase
          .from('subscriptions')
          .insert(defaultSubscription)
          .select()
          .single()

        if (createError) throw createError
        subscription = newSubscription
      }

      const formattedSubscription: Subscription = {
        id: subscription.id,
        userId: subscription.user_id,
        plan: subscription.plan,
        status: subscription.status,
        monthlyPrice: parseFloat(subscription.monthly_price),
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        autoRenewal: subscription.auto_renewal,
        paymentCardId: subscription.payment_card_id,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at
      }

      return addCorsHeaders(
        createSuccessResponse(formattedSubscription),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading subscription:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Abonelik bilgileri yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}

export async function PUT(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('PUT', '/api/account/subscription')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(createSuccessResponse(demoSubscription), request.headers.get('origin'))
      }

      const supabase = getSupabaseClient(request)
      const body = await request.json()
      const { validateRequest } = await import('@/lib/api-helpers')
      const { subscriptionUpdateSchema } = await import('@/lib/validation')
      
      const validation = validateRequest(subscriptionUpdateSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const { plan, autoRenewal, paymentCardId, status, billingPeriod } = validation.data

      let { data: currentSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!currentSubscription) {
        const defaultSubscription = {
          user_id: user.id,
          plan: 'Free',
          status: 'Aktif',
          monthly_price: PLAN_PRICES['Free'],
          start_date: new Date().toISOString(),
          end_date: null,
          auto_renewal: true,
          payment_card_id: null
        }

        const { data: newSubscription, error: createError } = await supabase
          .from('subscriptions')
          .insert(defaultSubscription)
          .select()
          .single()

        if (createError) throw createError
        currentSubscription = newSubscription
      }

      const updateData: Record<string, unknown> = {}
      
      if (plan !== undefined) {
        updateData.plan = plan
        updateData.monthly_price = PLAN_PRICES[plan]
        
        if (plan !== 'Free') {
          updateData.status = 'Aktif'
          updateData.start_date = new Date().toISOString()
          
          if (billingPeriod === 'yearly') {
            const endDate = new Date()
            endDate.setFullYear(endDate.getFullYear() + 1)
            updateData.end_date = endDate.toISOString()
          } else {
            const endDate = new Date()
            endDate.setMonth(endDate.getMonth() + 1)
            updateData.end_date = endDate.toISOString()
          }
        } else {
          updateData.status = 'Aktif'
          updateData.end_date = null
        }
      }
      
      if (status !== undefined) {
        updateData.status = status
      }
      
      if (autoRenewal !== undefined) {
        updateData.auto_renewal = autoRenewal
      }
      
      if (paymentCardId !== undefined) {
        updateData.payment_card_id = paymentCardId
      }

      updateData.updated_at = new Date().toISOString()

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      if (plan !== undefined && plan !== 'Free') {
        let amount: string
        if (plan === 'Pro' && billingPeriod === 'yearly') {
          amount = '4999.00'
        } else if (billingPeriod === 'yearly') {
          amount = (PLAN_PRICES[plan] * 12).toFixed(2)
        } else {
          amount = PLAN_PRICES[plan].toFixed(2)
        }

        await supabase
          .from('billing_history')
          .insert({
            user_id: user.id,
            date: new Date().toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            amount: amount,
            plan: `${plan} Plan (${billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'})`,
            status: 'Tamamlandı',
            invoice: true
          })
      }

      const formattedSubscription: Subscription = {
        id: subscription.id,
        userId: subscription.user_id,
        plan: subscription.plan,
        status: subscription.status,
        monthlyPrice: parseFloat(subscription.monthly_price),
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        autoRenewal: subscription.auto_renewal,
        paymentCardId: subscription.payment_card_id,
        createdAt: subscription.created_at,
        updatedAt: subscription.updated_at
      }

      return addCorsHeaders(
        createSuccessResponse(formattedSubscription),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error updating subscription:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Abonelik güncellenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
