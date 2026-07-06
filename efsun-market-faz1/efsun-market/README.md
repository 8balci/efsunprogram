# EFSUN Market — Finans, Kasa, Veresiye ve Stok Yönetim Sistemi

**Faz 1 (Çekirdek):** Kimlik doğrulama, canlı Dashboard, Günlük Kasa, Gelir Yönetimi, Gider Yönetimi.

Bu proje modüler bir yapıda tasarlanmıştır; sonraki fazlarda (Ürün/Stok/Barkod, POS, Veresiye, Cari Hesap, Finans/Raporlama, Yetkilendirme/Log, Çoklu Şube) aynı mimarinin üzerine inşa edilecektir.

## Mimari

- **Backend:** Node.js + Express, PostgreSQL + Prisma ORM, JWT tabanlı kimlik doğrulama, bcrypt ile şifreleme
- **Frontend:** React 18 + Vite, Tailwind CSS (glassmorphism tasarım), React Router, PWA desteği (vite-plugin-pwa)
- **Konteynerizasyon:** Docker + Docker Compose (PostgreSQL, backend, frontend ayrı servisler)

## Hızlı Başlangıç (Docker ile — Önerilen)

Gereksinim: [Docker](https://www.docker.com/) ve Docker Compose kurulu olmalı.

```bash
cd efsun-market
docker compose up --build
```

Birkaç saniye içinde:
- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:4000/api**
- PostgreSQL: `localhost:5432` (kullanıcı: `efsun`, şifre: `efsun_sifre`, db: `efsun_market`)

İlk açılışta backend, veritabanı şemasını otomatik oluşturur ve varsayılan yönetici kullanıcısını ekler:

```
E-posta: admin@efsunmarket.com
Şifre:   Efsun2026!
```

> Güvenlik: Bu bilgileri `docker-compose.yml` içindeki `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` ve `JWT_SECRET` değerlerini değiştirerek güncelleyin, özellikle production'a almadan önce.

## Manuel Kurulum (Docker'sız — Geliştirme İçin)

### 1) PostgreSQL

Kendi PostgreSQL sunucunuzu kullanın veya:
```bash
docker run -d --name efsun-postgres -e POSTGRES_USER=efsun -e POSTGRES_PASSWORD=efsun_sifre -e POSTGRES_DB=efsun_market -p 5432:5432 postgres:16-alpine
```

### 2) Backend

```bash
cd backend
cp .env.example .env    # .env dosyasını kendi ayarlarınıza göre düzenleyin
npm install
npx prisma generate
npx prisma db push       # semayi veritabanina uygular
node prisma/seed.js      # varsayilan yonetici + gider kategorilerini olusturur
npm run dev               # http://localhost:4000
```

### 3) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

## Proje Yapısı

```
efsun-market/
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Veritabani semasi
│   │   └── seed.js            # Varsayilan admin + gider kategorileri
│   └── src/
│       ├── index.js           # Express uygulama girisi
│       ├── middleware/auth.js # JWT dogrulama ve yetki kontrolu
│       ├── routes/            # auth, kasa, gelir, gider, dashboard
│       └── utils/prisma.js
└── frontend/
    └── src/
        ├── api/client.js      # Axios + JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/        # Layout, Sidebar, StatKart
        └── pages/              # Login, Dashboard, Kasa, Gelir, Gider, Ayarlar
```

## Faz 1'de Tamamlanan Özellikler

- ✅ Şifre korumalı giriş, "Beni Hatırla", oturum açık tutma, şifre değiştirme, çıkış yap
- ✅ Canlı Dashboard: bugünkü/aylık gelir-gider-net kâr, güncel kasa nakiti, son işlemler, son giderler
- ✅ Günlük Kasa: kasa aç/kapat, otomatik beklenen kasa hesaplama, kasa farkı (pozitif/negatif)
- ✅ Gelir Yönetimi: tarih, tutar, kategori, açıklama, ödeme türü (Nakit/Kart/Havale/FAST/QR/Diğer)
- ✅ Gider Yönetimi: 23 varsayılan kategori, fiş/fatura/PDF yükleme, ödeme türü
- ✅ Rol altyapısı (Yönetici / Kasiyer / Muhasebe) ve işlem log kaydı (kim, ne zaman, hangi işlem)
- ✅ Responsive glassmorphism tasarım (bilgisayar / tablet / telefon), PWA temel yapı

## Sonraki Fazlar (Yol Haritası)

| Faz | Kapsam |
|---|---|
| **Faz 2** | Ürün Yönetimi, Barkod sistemi (okuma/oluşturma/etiket), POS Satış Ekranı, Stok Takibi (giriş/çıkış/sayım/fire/SKT) |
| **Faz 3** | Veresiye Modülü (müşteri, tahsilat, ekstre, WhatsApp paylaşım), Tedarikçi Yönetimi, Cari Hesap |
| **Faz 4** | Finans (nakit akışı, kâr-zarar, aylık/yıllık analiz), Raporlar (Excel/PDF/CSV), interaktif grafikler, Takvim, Düzenli Giderler + Hatırlatmalar |
| **Faz 5** | Detaylı Yetkilendirme, gelişmiş İşlem Geçmişi (IP, log filtreleme), Çoklu Şube Desteği, Yedekleme (otomatik/manuel/bulut, JSON-SQLite-Excel içe/dışa aktarım), tam Offline senkronizasyon |

Her faz, mevcut mimari (Express + Prisma + PostgreSQL + React) üzerine modüler olarak eklenecek şekilde tasarlanmıştır; mevcut tablolar ve API yapısı bozulmadan genişletilecektir.

## Güvenlik Notları

- Şifreler bcrypt ile hashlenerek saklanır.
- JWT `JWT_SECRET` production ortamında mutlaka güçlü ve gizli bir değerle değiştirilmelidir.
- Giriş uç noktasında (`/api/auth/login`) kaba kuvvet saldırılarına karşı hız sınırlama (rate limiting) uygulanmıştır.
- Prisma ORM kullanıldığı için SQL injection riski minimize edilmiştir.
- Üretim ortamına almadan önce HTTPS (ters proxy / Cloudflare / Nginx SSL) kullanılması önerilir.

## Production Notu — Migration

Bu Faz 1 teslimatında hız için `prisma db push` kullanılmıştır (şemayı doğrudan veritabanına uygular). Sürüm kontrollü, geri alınabilir migration geçmişi için:

```bash
cd backend
npx prisma migrate dev --name init
```

komutunu çalıştırıp oluşan `prisma/migrations/` klasörünü projeye dahil edin, ardından `Dockerfile` içindeki başlangıç komutunu `npx prisma migrate deploy` olarak güncelleyin.
