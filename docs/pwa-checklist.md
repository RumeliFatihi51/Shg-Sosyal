# ŞHG Sosyal PWA Checklist

ŞHG Sosyal artık install edilebilir PWA altyapısına sahiptir: manifest, app ikonları, service worker, offline fallback, update uyarısı ve Web Push aboneliği.

## Dosyalar

- `src/app/manifest.ts`: Web App Manifest.
- `public/sw.js`: Service worker, offline fallback ve push notification handler.
- `src/components/pwa/pwa-provider.tsx`: service worker register, install prompt, update prompt ve push izin akışı.
- `src/app/offline/page.tsx`: çevrimdışı fallback sayfası.
- `supabase/migrations/20260528161000_pwa_push_subscriptions.sql`: push abonelik tablosu ve RLS.

## Supabase migration

Push bildirimleri için Supabase SQL Editor'da çalıştır:

```txt
supabase/migrations/20260528161000_pwa_push_subscriptions.sql
```

Production readiness kontrolü için daha önceki view migration'ı da tekrar çalıştırılabilir:

```txt
supabase/migrations/20260528153000_production_readiness_checks.sql
```

## VAPID env değerleri

Web Push için VAPID key gerekir. Lokal makinede üretebilirsin:

```bash
npx web-push generate-vapid-keys
```

Netlify env içine ekle:

```txt
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:<admin-email>
```

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` tarayıcıya gider; `VAPID_PRIVATE_KEY` sadece server env olarak kalmalıdır.

## Test

- Site HTTPS üzerinde açılır.
- Chrome DevTools > Application > Manifest içinde hata yok.
- Service worker `activated` durumunda.
- Site mobilde ana ekrana eklenebilir.
- Offline moda alınca `/offline` fallback açılır.
- Giriş yapan kullanıcı bildirim izni verdiğinde `push_subscriptions` tablosuna kayıt düşer.
- DM veya arkadaşlık bildirimi oluşunca browser push bildirimi gelir.

## Notlar

- iOS push notification yalnız ana ekrana eklenmiş PWA için çalışır.
- Local push test için HTTPS gerekir; `npm run dev -- --experimental-https` kullanılabilir.
- VAPID env eksikse PWA install/offline çalışır, push kısmı sessizce devre dışı kalır.
