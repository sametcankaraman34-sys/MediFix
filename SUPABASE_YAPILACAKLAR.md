# Supabase Tarafında Yapılacaklar

## 0. Kayıt / Test Kullanıcı (Önce Bunu Yapın)

### 0.1 Auth → public.users senkron trigger
Yeni kayıt olan kullanıcıların `public.users` tablosunda da satır oluşması için:

1. Supabase Dashboard → **SQL Editor**
2. `supabase/migrations/005_sync_auth_users_to_public.sql` dosyasının içeriğini yapıştırıp **Run** deyin.

### 0.2 Test kullanıcı oluşturma
**A) Script ile (tercih edilen)**  
1. `.env.local` içinde `SUPABASE_SERVICE_ROLE_KEY` ekleyin (Dashboard → Project Settings → API → service_role secret).  
2. Proje kökünde: `npm run create-test-user`  
3. Giriş: **E-posta:** `test@medifix.local` **Şifre:** `Test123!`

**B) Dashboard ile**  
1. Supabase Dashboard → **Authentication** → **Users** → **Add user**  
2. E-posta ve şifre girin, **Auto Confirm User** işaretleyin.  
3. Kaydedin; trigger sayesinde `public.users` satırı otomatik oluşur.

---

## 1. Authorization Kontrolü - User ID Migration

### Adım 1: Migration Dosyasını Uygula
1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. Projeni seç
3. Sol menüden **SQL Editor**'a git
4. Yeni bir query aç
5. `supabase/migrations/003_add_user_id_and_indexes.sql` dosyasının içeriğini kopyala
6. SQL Editor'a yapıştır ve **Run** butonuna bas

### Adım 2: Mevcut Verileri Güncelle (Opsiyonel)
Eğer veritabanında mevcut kayıtlar varsa, bunlara user_id atamanız gerekebilir. Bu durumda:

```sql
-- Örnek: Tüm servis taleplerini ilk kullanıcıya ata (SADECE TEST İÇİN)
-- PRODUCTION'DA BU ŞEKİLDE YAPMAYIN!
UPDATE service_requests 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Aynısını appointments ve reports için de yapabilirsiniz
-- Ancak gerçek kullanıcı bilgilerine göre güncelleme yapmalısınız
```

### Adım 3: RLS (Row Level Security) Politikaları Ekle
SQL Editor'da şu sorguları çalıştır:

```sql
-- Service Requests RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service requests"
ON service_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service requests"
ON service_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service requests"
ON service_requests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service requests"
ON service_requests FOR DELETE
USING (auth.uid() = user_id);

-- Appointments RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
ON appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
ON appointments FOR DELETE
USING (auth.uid() = user_id);

-- Reports RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
ON reports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
ON reports FOR DELETE
USING (auth.uid() = user_id);
```

**NOT:** Eğer admin kullanıcıların tüm kayıtları görmesini istiyorsanız, ek bir policy ekleyebilirsiniz:

```sql
-- Admin kullanıcılar için özel policy (opsiyonel)
CREATE POLICY "Admins can view all service requests"
ON service_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
```

## 2. Database Performance - Index Kontrolü

### Adım 1: Mevcut Index'leri Kontrol Et
SQL Editor'da şu sorguyu çalıştır:

```sql
-- Tüm index'leri listele
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Adım 2: Kullanılmayan Index'leri Kontrol Et
SQL Editor'da şu sorguyu çalıştır (PostgreSQL 9.2+):

```sql
-- Index kullanım istatistiklerini göster
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

**Yorumlama:**
- `idx_scan = 0` olan index'ler muhtemelen kullanılmıyor
- Ancak dikkatli olun: Bazı index'ler nadiren kullanılsa da önemli olabilir (örneğin, unique constraint'ler)

### Adım 3: Gereksiz Index'leri Sil (Dikkatli!)
Eğer bir index'in gerçekten kullanılmadığından eminseniz:

```sql
-- ÖRNEK: Eğer idx_personnel_email kullanılmıyorsa (ama UNIQUE constraint için gerekli olabilir!)
-- DROP INDEX IF EXISTS idx_personnel_email;

-- ÖNCE KONTROL EDİN, SONRA SİLİN!
```

**ÖNEMLİ UYARILAR:**
1. **UNIQUE constraint'ler için oluşturulan index'leri SİLMEYİN** - Bunlar veri bütünlüğü için gereklidir
2. **Primary key index'lerini SİLMEYİN** - Bunlar otomatik oluşturulur ve gereklidir
3. **Foreign key index'lerini SİLMEYİN** - Performans için önemlidir

### Adım 4: Eksik Index'leri Ekle
Raporda belirtilen ama henüz oluşturulmamış index'ler için migration dosyası zaten hazır. Migration'ı uyguladıktan sonra index'ler otomatik oluşturulacak.

## 3. Doğrulama

### Migration Sonrası Kontrol
SQL Editor'da şu sorguları çalıştırarak kontrol edin:

```sql
-- user_id kolonlarının eklendiğini kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('service_requests', 'appointments', 'reports')
AND column_name = 'user_id';

-- Index'lerin oluşturulduğunu kontrol et
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%user_id%';
```

## Özet Checklist

- [ ] Migration dosyasını (`003_add_user_id_and_indexes.sql`) Supabase SQL Editor'da çalıştır
- [ ] RLS politikalarını ekle (yukarıdaki SQL'leri çalıştır)
- [ ] Mevcut verileri güncelle (eğer varsa)
- [ ] Index kullanım istatistiklerini kontrol et
- [ ] Gereksiz index'leri sil (dikkatli!)
- [ ] Tüm değişiklikleri test et

## Notlar

1. **RLS Politikaları:** RLS politikalarını ekledikten sonra, kullanıcılar sadece kendi kayıtlarını görebilecek. Admin kullanıcılar için özel policy eklemeniz gerekebilir.

2. **Mevcut Veriler:** Eğer production'da veri varsa, user_id atamasını dikkatli yapın. Her kaydın gerçek sahibini belirlemeniz gerekir.

3. **Index'ler:** Index'leri silmeden önce mutlaka kullanım istatistiklerini kontrol edin. Bazı index'ler nadiren kullanılsa da önemli olabilir.
