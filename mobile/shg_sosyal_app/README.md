# ŞHG Sosyal Flutter MVP

Bu klasör, ŞHG Sosyal için mobil öncelikli Flutter MVP iskeletidir.

Amaç mevcut Next.js web sitesini birebir kopyalamak değil; aynı ürün fikrini mobil sosyal uygulama olarak yeniden kurmaktır. İlk sürüm backend'e bağlanmaz, mock data ile çalışır. UI, provider/controller, repository ve service katmanları ayrılmıştır. Bu sayede ileride Supabase yerine Ubuntu üzerinde çalışan REST API'ye geçerken UI katmanı korunabilir.

## Mimari

```txt
UI
  -> Riverpod provider / controller
  -> Repository
  -> Service
  -> Mock data veya ileride REST API
```

## Çalıştırma

Bu makinede Flutter SDK şu an PATH içinde görünmediği için komutları burada çalıştıramadım. Flutter kurulduktan sonra:

```bash
cd mobile/shg_sosyal_app
flutter create . --platforms android,ios,web
flutter pub get
flutter analyze
flutter run
```

`flutter create .` komutu Android/iOS/Web platform klasörlerini üretir. `lib/`, `pubspec.yaml` ve mimari dosyalar korunur.

## MVP Kapsamı

- Dark theme
- GoRouter tabanlı route sistemi
- Riverpod provider mimarisi
- Mock auth
- Ana Akış
- Etkinlikler
- Topluluklar
- Arkadaşlar
- DM/Mesajlar
- Bildirimler
- Takvim
- Rozetler
- Sıralama
- Profil
- Repository/service soyutlaması
