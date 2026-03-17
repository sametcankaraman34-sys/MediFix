import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseClient } from '@/lib/api-helpers'

export const DEMO_ACCESS_TOKEN = 'DEMO_TEST_USER'
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

const demoUser = {
  id: DEMO_USER_ID,
  email: 'test@medifix.local',
  email_confirmed_at: new Date().toISOString(),
  user_metadata: { first_name: 'Test', last_name: 'Kullanıcı', name: 'Test Kullanıcı' },
  app_metadata: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const demoProfile = {
  id: DEMO_USER_ID,
  email: 'test@medifix.local',
  name: 'Test Kullanıcı',
  first_name: 'Test',
  last_name: 'Kullanıcı',
  role: 'technician' as const,
  phone: null as string | null,
  avatar: null as string | null,
  address: null as string | null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export function isDemoUser(user: { id?: string } | null): boolean {
  return user?.id === DEMO_USER_ID
}

export function getAccessToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get('authorization')
  const token =
    authHeader?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('sb-access-token')?.value
  return token || undefined
}

export async function getAuthUser(request: NextRequest): Promise<{
  data: { user: any | null }
  error: Error | null
}> {
  const token = getAccessToken(request)
  if (!token) {
    return { data: { user: null }, error: new Error('Token yok') }
  }
  if (process.env.NODE_ENV === 'development' && token === DEMO_ACCESS_TOKEN) {
    return { data: { user: demoUser }, error: null }
  }
  try {
    const supabaseClient = getSupabaseClient(request)
    const { data, error } = await supabaseClient.auth.getUser(token)
    if (error) return { data: { user: null }, error }
    return { data: { user: data.user }, error: null }
  } catch (e) {
    return {
      data: { user: null },
      error: e instanceof Error ? e : new Error(String(e))
    }
  }
}

export { demoUser }
