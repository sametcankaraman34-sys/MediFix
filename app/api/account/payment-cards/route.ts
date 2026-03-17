import { NextRequest } from 'next/server'
import { getSupabaseClient, createErrorResponse, createSuccessResponse, logRequest } from '@/lib/api-helpers'
import { addCorsHeaders, handleCorsOptions, withRateLimit } from '@/lib/middleware-helpers'
import { logger } from '@/lib/logger'
import { PaymentCard } from '@/lib/types'
import { getAuthUser, isDemoUser } from '@/lib/auth-server'

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request.headers.get('origin'))
}

export async function GET(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('GET', '/api/account/payment-cards')
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
      const { data: cards, error } = await supabase
        .from('payment_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedCards: PaymentCard[] = (cards || []).map(card => ({
        id: card.id,
        cardNumber: card.card_number,
        cardHolder: card.card_holder,
        expiryDate: card.expiry_date,
        isDefault: card.is_default,
        cardType: card.card_type
      }))

      return addCorsHeaders(
        createSuccessResponse(formattedCards),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error loading payment cards:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Kartlar yüklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 100, 60 * 1000)(request)
}

export async function POST(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('POST', '/api/account/payment-cards')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile kart eklenemez', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const body = await request.json()
      const { validateRequest } = await import('@/lib/api-helpers')
      const { paymentCardSchema } = await import('@/lib/validation')
      
      const validation = validateRequest(paymentCardSchema, body)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const { cardNumber, cardHolder, expiryDate, cardType, isDefault } = validation.data

      if (isDefault) {
        await supabase
          .from('payment_cards')
          .update({ is_default: false })
          .eq('user_id', user.id)
      }

      const { data: card, error } = await supabase
        .from('payment_cards')
        .insert({
          user_id: user.id,
          card_number: cardNumber,
          card_holder: cardHolder,
          expiry_date: expiryDate,
          card_type: cardType,
          is_default: isDefault || false
        })
        .select()
        .single()

      if (error) throw error

      const formattedCard: PaymentCard = {
        id: card.id,
        cardNumber: card.card_number,
        cardHolder: card.card_holder,
        expiryDate: card.expiry_date,
        isDefault: card.is_default,
        cardType: card.card_type
      }

      return addCorsHeaders(
        createSuccessResponse(formattedCard, 201),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error creating payment card:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Kart eklenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}

export async function PUT(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('PUT', '/api/account/payment-cards')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)
      const body = await request.json()
      const { id, ...cardData } = body
      
      if (!id) {
        return addCorsHeaders(
          createErrorResponse(null, 'Kart ID gerekli', 400),
          request.headers.get('origin')
        )
      }

      const { validateRequest } = await import('@/lib/api-helpers')
      const { paymentCardSchema } = await import('@/lib/validation')
      
      const validation = validateRequest(paymentCardSchema, cardData)
      if (!validation.success) {
        return addCorsHeaders(
          createErrorResponse(validation.error, validation.error, validation.status),
          request.headers.get('origin')
        )
      }

      const { cardNumber, cardHolder, expiryDate, cardType, isDefault } = validation.data

      if (isDefault) {
        await supabase
          .from('payment_cards')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id)
      }

      const { data: card, error } = await supabase
        .from('payment_cards')
        .update({
          card_number: cardNumber,
          card_holder: cardHolder,
          expiry_date: expiryDate,
          card_type: cardType,
          is_default: isDefault
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      const formattedCard: PaymentCard = {
        id: card.id,
        cardNumber: card.card_number,
        cardHolder: card.card_holder,
        expiryDate: card.expiry_date,
        isDefault: card.is_default,
        cardType: card.card_type
      }

      return addCorsHeaders(
        createSuccessResponse(formattedCard),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error updating payment card:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Kart güncellenirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}

export async function DELETE(request: NextRequest) {
  return withRateLimit(async () => {
    try {
      logRequest('DELETE', '/api/account/payment-cards')
      const { data: { user }, error: userError } = await getAuthUser(request)
      if (userError || !user) {
        return addCorsHeaders(
          createErrorResponse(userError, 'Geçersiz session', 401),
          request.headers.get('origin')
        )
      }
      if (isDemoUser(user)) {
        return addCorsHeaders(
          createErrorResponse(null, 'Demo kullanıcı ile işlem yapılamaz', 403),
          request.headers.get('origin')
        )
      }

      const supabase = getSupabaseClient(request)

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return addCorsHeaders(
          createErrorResponse(null, 'Kart ID gerekli', 400),
          request.headers.get('origin')
        )
      }

      const { error } = await supabase
        .from('payment_cards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      return addCorsHeaders(
        createSuccessResponse({}),
        request.headers.get('origin')
      )
    } catch (error: unknown) {
      logger.error('Error deleting payment card:', error)
      return addCorsHeaders(
        createErrorResponse(error, 'Kart silinirken bir hata oluştu'),
        request.headers.get('origin')
      )
    }
  }, 50, 60 * 1000)(request)
}
