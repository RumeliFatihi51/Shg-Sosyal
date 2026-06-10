# Mobil Push Checklist

ŞHG Sosyal mobil uygulamasında native Android bildirimleri Firebase Cloud Messaging ile çalışır.

## Supabase

Canlı veritabanında şu migration çalışmış olmalı:

```text
supabase/migrations/20260610123000_mobile_fcm_push_tokens.sql
```

Bu migration `mobile_push_tokens` tablosunu oluşturur. Mobil uygulama login sonrası FCM tokenını `/api/mobile/push/token` endpointine kaydeder.

## Vercel Env

Vercel production ve preview ortamlarına şu değerler eklenmeli:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

`FIREBASE_PRIVATE_KEY` service account JSON içindeki private key değeridir. Tek satıra yazılacaksa `\n` kaçışları korunmalıdır.

## Flutter Android

Firebase Console içinde Android app package name:

```text
com.shgsosyal.shg_sosyal_app
```

Firebase Console'dan indirilen dosya şu konuma konmalı:

```text
mobile/shg_sosyal_app/android/app/google-services.json
```

Dosya yoksa uygulama build/test akışını kırmaz, ancak native push devre dışı kalır.

## Test

1. Kullanıcı mobil uygulamada giriş yapar.
2. `mobile_push_tokens` tablosunda kullanıcıya ait aktif token görünür.
3. Başka bir kullanıcı DM gönderir veya arkadaşlık isteği atar.
4. Bildirim hem uygulama içi listede hem Android sistem bildirimi olarak görünür.
