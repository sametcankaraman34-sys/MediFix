import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY environment variable is not set')
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true
    })
  : null

export interface CreatePaymentIntentParams {
  amount: number
  currency?: string
  paymentMethodId?: string
  customerId?: string
  metadata?: Record<string, string>
}

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  const { amount, currency = 'try', paymentMethodId, customerId, metadata } = params

  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata: metadata || {}
  }

  if (customerId) {
    paymentIntentParams.customer = customerId
  }

  if (paymentMethodId) {
    paymentIntentParams.payment_method = paymentMethodId
    paymentIntentParams.confirmation_method = 'manual'
    paymentIntentParams.confirm = true
  }

  return await stripe.paymentIntents.create(paymentIntentParams)
}

export interface CreateCustomerParams {
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}

export async function createCustomer(params: CreateCustomerParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  const { email, name, phone, metadata } = params

  return await stripe.customers.create({
    email,
    name,
    phone,
    metadata: metadata || {}
  })
}

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  paymentMethodId?: string
  metadata?: Record<string, string>
}

export async function createSubscription(params: CreateSubscriptionParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  const { customerId, priceId, paymentMethodId, metadata } = params

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    metadata: metadata || {},
    expand: ['latest_invoice.payment_intent']
  }

  if (paymentMethodId) {
    subscriptionParams.default_payment_method = paymentMethodId
  }

  return await stripe.subscriptions.create(subscriptionParams)
}

export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  return await stripe.subscriptions.cancel(subscriptionId)
}

export async function updateSubscription(
  subscriptionId: string,
  params: {
    priceId?: string
    paymentMethodId?: string
    metadata?: Record<string, string>
  }
) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  const { priceId, paymentMethodId, metadata } = params
  const updateParams: Stripe.SubscriptionUpdateParams = {}

  if (priceId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    updateParams.items = [
      {
        id: subscription.items.data[0].id,
        price: priceId
      }
    ]
    updateParams.proration_behavior = 'always_invoice'
  }

  if (paymentMethodId) {
    updateParams.default_payment_method = paymentMethodId
  }

  if (metadata) {
    updateParams.metadata = metadata
  }

  return await stripe.subscriptions.update(subscriptionId, updateParams)
}

export async function createPaymentMethod(cardData: {
  number: string
  expMonth: number
  expYear: number
  cvc: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  return await stripe.paymentMethods.create({
    type: 'card',
    card: {
      number: cardData.number.replace(/\s/g, ''),
      exp_month: cardData.expMonth,
      exp_year: cardData.expYear,
      cvc: cardData.cvc
    }
  })
}

export async function attachPaymentMethodToCustomer(
  paymentMethodId: string,
  customerId: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId
  })
}

export async function detachPaymentMethod(paymentMethodId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  return await stripe.paymentMethods.detach(paymentMethodId)
}

export async function listCustomerPaymentMethods(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }

  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card'
  })
}
