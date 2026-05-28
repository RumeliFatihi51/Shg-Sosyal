# ŞHG Sosyal

Okul içi sosyal etkinlik ve topluluk platformu. Next.js App Router, TypeScript, Tailwind CSS ve Supabase ile hazırlanmış production'a yakın sosyal uygulama.

## Özellikler

- Supabase Auth ile kayıt/giriş, e-posta doğrulama ve profil sistemi
- Roller: `student`, `community_admin`, `teacher`, `moderator`, `admin`
- Topluluk başvurusu, admin/moderator onayı, üyelik ve takip sistemi
- Etkinlik oluşturma, onay akışı, kontenjan/yedek liste, iptal/erteleme ve ilgi durumu
- Gönderi, yorum, beğeni/eksi oy, raporlama ve trend skoru
- Arkadaş sistemi, site içi bildirimler ve birebir DM mesajlaşma
- Ödül puanı, rozet kataloğu ve günlük/haftalık/genel sıralama
- Activity tracking, counter cache ve güvenli RPC akışları
- Aylık/haftalık/liste etkinlik takvimi
- Dark ağırlıklı modern sosyal uygulama teması

## Kurulum

```bash
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` içindeki Supabase değerlerini doldurun:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`ADMIN_EMAIL` ile eşleşen kullanıcı giriş/kayıt sonrasında otomatik `admin` rolüne yükseltilir. Bu işlem server-side yapılır ve `SUPABASE_SERVICE_ROLE_KEY` ister.

## Supabase

Migration sırası:

1. `supabase/migrations/20260514194000_sosyas_mvp.sql`
2. `supabase/migrations/20260514203000_shg_sosyal_growth.sql`
3. `supabase/migrations/20260514212000_shg_sosyal_role_bootstrap_fix.sql`
4. `supabase/migrations/20260516093000_backend_security_hardening.sql`
5. `supabase/migrations/20260516110000_data_processing_intelligence.sql`
6. `supabase/migrations/20260525213000_backend_social_core.sql`
7. `supabase/migrations/20260526103000_engagement_rewards_calendar_core.sql`

Supabase CLI kullanıyorsanız:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Bu makinede Supabase CLI kurulu değilse Supabase Dashboard > SQL Editor içinde migration dosyalarını yukarıdaki sırayla çalıştırın. En son migration ödül puanı, rozet kriterleri, leaderboard view'ları, etkinlik ilgi durumları ve DM izinlerini tamamlar.

Supabase Auth ayarlarında **Authentication > Providers > Email > Confirm email** seçeneğini açık tutun. Uygulama, korumalı sayfalarda doğrulanmamış e-posta ile devam edilmesini engeller.

Production öncesi daha önce paylaşılan `service_role` ve secret keyleri Supabase dashboard üzerinden rotate edin. Secret değerleri repo içine yazılmamalıdır.

Storage bucketları migration ile oluşturulur:

- `event-images`: public
- `avatars`: private
- `community-images`: private

## Opsiyonel Demo Veri

Önce uygulamadan en az bir kullanıcı oluşturun. Ardından Supabase SQL Editor içinde şu dosyanın içeriğini çalıştırın:

```txt
supabase/seed/demo.sql
```

Bu seed ilk profili demo topluluklarının sahibi olarak kullanır; topluluk, etkinlik, gönderi, yorum, oy, duyuru ve anket örnekleri üretir.

## QA

Manuel test ve RLS kontrol listesi:

```txt
docs/manual-test-checklist.md
```

Production checklist:

```txt
docs/production-readiness-checklist.md
```

Supabase RLS smoke test SQL:

```txt
docs/rls-smoke-test.sql
```

## Cron Bildirimleri

Next.js route:

```txt
/api/cron/daily-notifications
```

Harici bir zamanlayıcı ile çağırırken:

```txt
Authorization: Bearer <CRON_SECRET>
```

Netlify için `netlify/functions/daily-notifications.ts` günlük scheduled function olarak aynı route'u çağırır. `NEXT_PUBLIC_SITE_URL` production domaini olmalıdır.

## Komutlar

```bash
npm run lint
npm run typecheck
npm run build
```

## Netlify

`netlify.toml` içinde Next.js build ayarı hazırdır:

```txt
Build command: npm run build
Publish directory: .next
Node version: 24
```

Netlify environment variables bölümüne `.env.example` içindeki değerleri ekleyin. Production URL için `NEXT_PUBLIC_SITE_URL` değerini Netlify domaininizle değiştirin.
