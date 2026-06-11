# ŞHG Sosyal Production Checklist

Bu liste canlıya çıkmadan önce kontrol edilmesi gereken en kritik backend, Supabase ve operasyon adımlarını toplar.

## 1. Supabase migration kontrolü

Supabase SQL Editor içinde migration dosyaları sırayla çalışmış olmalı. Özellikle şu son dosyalar canlı DB'de eksiksiz olmalı:

```txt
supabase/migrations/20260525213000_backend_social_core.sql
supabase/migrations/20260526103000_engagement_rewards_calendar_core.sql
supabase/migrations/20260526125500_fix_dm_conversation_ambiguity.sql
supabase/migrations/20260528153000_production_readiness_checks.sql
supabase/migrations/20260528154500_notification_digest_hardening.sql
supabase/migrations/20260528161000_pwa_push_subscriptions.sql
```

Admin panelinde sağdaki `Production` alanı eksik migration veya kritik tablo varsa uyarı gösterir.

SQL Editor içinde hızlı kontrol:

```sql
select key, label, ok, severity, fix_hint
from public.production_readiness_checks
order by severity, key;
```

Tüm `critical` kayıtlar `ok = true` dönmeden canlı test tamamlanmış sayılmaz.

## 2. Secret ve auth ayarları

- Daha önce paylaşılan Supabase `service_role`, anon/publishable ve secret keyler production öncesi rotate edilmeli.
- Netlify env değerleri güncel olmalı:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_EMAIL`
  - `CRON_SECRET`
  - `NEXT_PUBLIC_SITE_URL`
- Supabase Auth redirect URL listesine canlı Netlify domaini eklenmeli.
- Supabase Auth email confirmation açık olmalı.
- Service role key sadece server env'de kalmalı; client bundle veya public env içinde olmamalı.
- PWA push için `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` ve `VAPID_SUBJECT` Netlify env içinde tanımlı olmalı.

## 3. Kritik manuel akışlar

- Yeni kullanıcı kayıt olur, e-posta doğrular, profil otomatik oluşur.
- Admin `/admin` içinde gerçek kullanıcı listesini görür.
- Kullanıcı `@etiket` ile arkadaş arar, istek gönderir, karşı taraf kabul eder.
- Accepted iki arkadaş DM başlatır ve mesaj gönderir.
- Arkadaş olmayan iki kullanıcı DM başlatamaz.
- Etkinliğe katılım puan üretir, uygun rozet görünür, leaderboard güncellenir.
- Topluluk başvurusu admin paneline düşer, onay/red bildirimi oluşur.
- Raporlanan post/comment admin panelinde görünür, işlem geçmişi audit log'a düşer.

## 4. RLS güvenlik smoke testleri

Hazır SQL test dosyası:

```txt
docs/rls-smoke-test.sql
```

Dosyadaki örnek UUID değerleri canlı DB'deki gerçek kullanıcı, arkadaşlık ve conversation kayıtlarıyla değiştirildikten sonra Supabase SQL Editor'da çalıştırılmalı.

- Student başka kullanıcının profilini update edememeli.
- Student başka kullanıcıların arkadaşlık kayıtlarını görememeli.
- Conversation üyesi olmayan kullanıcı DM mesajlarını okuyamamalı veya yazamamalı.
- Rol/suspend işlemleri sadece admin tarafından yapılabilmeli; öğretmen ve topluluk admini bu işlemleri yapamamalı.
- Anonim kullanıcı sadece public/yayınlanmış etkinlikleri görebilmeli.

## 5. Performans ve veri sağlığı

- Ana sayfa, admin, friends, messages ve profile loader'ları production'da kabul edilebilir sürede açılmalı.
- Admin kullanıcı listesinde pagination/search/role filter çalışmalı.
- `point_events` aynı hedef için duplicate puan üretmemeli.
- `notifications.digest_key` kullanan bildirimlerde spam oluşmamalı.
- Cron endpoint günlük bildirimleri tekilleştirerek üretmeli.

## 6. Deploy smoke

Netlify production deploy sonrası şu rotalar 200 dönmeli:

```txt
/
/events
/communities
/posts
/calendar
/friends
/messages
/badges
/leaderboard
/admin
```

Build komutları:

```bash
npm run lint
npm run typecheck
npm run build
```
