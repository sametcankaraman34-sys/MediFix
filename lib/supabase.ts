import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (process.env.NODE_ENV === 'development') {
  console.log('[Supabase Config]')
  console.log('  URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING (demo giriş kullanılabilir)')
  console.log('  KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'MISSING')
  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseUrl = supabaseUrl || 'https://placeholder.supabase.co'
    supabaseAnonKey = supabaseAnonKey || 'placeholder-anon-key'
  }
} else if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `
Missing Supabase environment variables!

Please ensure .env.local file exists in the project root with:
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  `.trim()
  console.error(errorMsg)
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

export function createSupabaseClientWithToken(accessToken?: string) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: accessToken ? {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    } : {}
  })
  
  return client
}

export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}
