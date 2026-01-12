# MediFix Medical Service Tracker

Tıbbi cihaz servis takip web uygulaması - Next.js tabanlı modern web uygulaması

## Teknolojiler

- **Next.js 14** - React framework
- **React 18** - UI kütüphanesi
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Stil framework'ü
- **Lucide React** - İkon kütüphanesi
- **XLSX** - Excel işlemleri

## Özellikler

- ✅ Servis talepleri yönetimi
- ✅ Randevu takibi
- ✅ Servis raporları
- ✅ Dashboard ve istatistikler
- ✅ Ayarlar yönetimi
- ✅ Modern ve responsive tasarım

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Production sunucusunu başlat
npm start
```

## Proje Yapısı

```
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Ana layout
│   ├── page.tsx            # Ana sayfa (Dashboard)
│   ├── service-requests/   # Servis talepleri sayfası
│   ├── appointments/       # Randevular sayfası
│   ├── reports/            # Raporlar sayfası
│   └── settings/           # Ayarlar sayfası
├── components/             # React componentleri
│   ├── layout/             # Layout componentleri
│   └── pages/              # Sayfa componentleri
├── public/                 # Statik dosyalar
└── lib/                    # Yardımcı fonksiyonlar
```

## Geliştirme

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışır.

## Lisans

© 2024 MediFix Software Solutions
