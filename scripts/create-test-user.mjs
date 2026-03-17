/**
 * Supabase test kullanıcısı oluşturur.
 * Kullanım: node --env-file=.env.local scripts/create-test-user.mjs
 * .env.local içinde SUPABASE_SERVICE_ROLE_KEY ve NEXT_PUBLIC_SUPABASE_URL olmalı.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Hata: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı.')
  console.error('Çalıştırma: node --env-file=.env.local scripts/create-test-user.mjs')
  process.exit(1)
}

const TEST_EMAIL = 'test@medifix.local'
const TEST_PASSWORD = 'Test123!'

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

try {
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: 'Test',
      last_name: 'Kullanıcı',
      name: 'Test Kullanıcı'
    }
  })

  if (error) {
    if (error.message?.includes('already been registered')) {
      console.log('Test kullanıcı zaten mevcut. Giriş bilgileri:')
    } else {
      console.error('Supabase hatası:', error.message)
      process.exit(1)
    }
  } else if (data?.user) {
    console.log('Test kullanıcı oluşturuldu.')
  }

  console.log('')
  console.log('--- Test giriş bilgileri ---')
  console.log('E-posta:', TEST_EMAIL)
  console.log('Şifre:  ', TEST_PASSWORD)
  console.log('-----------------------------')
  console.log('Giriş: http://localhost:3000/login')
} catch (e) {
  console.error('Bağlantı hatası:', e.message || e)
  if (e.cause?.code === 'ENOTFOUND') {
    console.error('Supabase adresi çözülemedi. NEXT_PUBLIC_SUPABASE_URL ve internet bağlantınızı kontrol edin.')
  }
  process.exit(1)
}
