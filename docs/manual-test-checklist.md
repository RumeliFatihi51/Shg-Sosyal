# ŞHG Sosyal Manuel QA Checklist

Bu liste production öncesi gerçek Supabase projesinde elle kontrol içindir.

## Hazırlık

- Supabase Auth > Email provider içinde `Confirm Email` açık olmalı.
- Production öncesi daha önce paylaşılan `service_role` ve secret keyler rotate edilmeli.
- `.env.local` değerleri dolu olmalı; `SUPABASE_SERVICE_ROLE_KEY` client tarafına yazılmamalı.
- Migration dosyaları README'deki sırayla çalıştırılmalı.
- Demo veri istenirse `supabase/seed/demo.sql` SQL Editor üzerinden çalıştırılmalı.

## Kritik Akışlar

- Kayıt ol: kullanıcı e-posta doğrulama mesajı görmeli.
- E-posta doğrulanmadan giriş/protected sayfa: giriş ekranına yönlenmeli veya doğrulama uyarısı göstermeli.
- Topluluk başvurusu gönder: başvuru admin panelinde bekleyen topluluklarda görünmeli.
- Admin/moderator topluluğu onayla/reddet: karar bildirimi oluşmalı.
- Etkinlik oluştur: student için pending, admin/moderator/teacher için approved davranışı korunmalı.
- Etkinliğe katıl/katılımı kaldır: katılımcı sayısı ve profil etkinlik listesi güncellenmeli.
- Gönderi oluştur: keşfet ve topluluk akışında görünmeli.
- Beğeni ve eksi oy: aynı oya tekrar basınca oy kalkmalı, zıt oy basınca skor değişmeli.
- Yorum ekle: post detayında görünmeli ve post sahibine bildirim gitmeli.
- Rapor gönder: admin panelinde açık rapor olarak görünmeli.
- Rol değiştirme: sadece admin yapabilmeli; admin kendi rolünü düşürememeli.

## Veri İşleme Kontrolleri

- `activity_events` tablosuna etkinlik görüntüleme, gönderi görüntüleme, topluluk ziyareti ve arama kayıtları düşmeli.
- `posts.score`, `posts.comment_count`, `posts.popularity_score` oy/yorum/rapor hareketlerinden sonra güncellenmeli.
- `events.participant_count` ve `events.waitlist_count` etkinliğe katılma/ayrılma sonrası güncellenmeli.
- `communities.member_count`, `follower_count`, `post_count`, `event_count` ilgili hareketlerden sonra güncellenmeli.
- Etkinliğe katılım kapasite doluyken `waitlisted` durumuna düşmeli.
- `vote_post_safely` aynı oya tekrar basınca oyu kaldırmalı.
- `home_summary_view`, `event_feed_view`, `post_feed_view`, `community_feed_view` SELECT ile veri döndürmeli.
- Arkadaşın onaylanan veya doğrudan yayınlanan etkinliği için `friend_event` bildirimi oluşmalı.
- Arkadaşın gönderi paylaştığında `friend_post` bildirimi oluşmalı.

## RLS Güvenlik Kontrolleri

- Student başka kullanıcının profilini update edememeli.
- Student sadece kendi gönderdiği/aldığı arkadaşlık kayıtlarını görebilmeli.
- Community admin sadece kendi topluluğunda etkinlik/gönderi yönetebilmeli.
- Moderator admin kullanıcı üzerinde rol/suspend işlemi yapamamalı.
- Anonim kullanıcı yalnız yayınlanmış etkinlikleri görebilmeli; posts/friends/admin protected kalmalı.
- `activity_events` için kullanıcı sadece kendi activity kayıtlarını görebilmeli; staff tamamını görebilmeli.

## Mobil / UX Kontrol

- 390px genişlikte sidebar yerine mobil header/drawer kullanılmalı.
- Admin sekmeleri yatay kaymalı, tablolar ekranı taşırmadan okunmalı.
- Form submit sırasında buton loading/disabled görünmeli.
- Toast mesajı görünüp birkaç saniye sonra kaybolmalı ve URL'den `message` parametresi temizlenmeli.
- Upload: JPG/PNG/WebP ve maksimum 3MB dışındaki dosyalar hem client hem server tarafında reddedilmeli.
- `/calendar?view=month`, `/calendar?view=week`, `/calendar?view=list` görünüm değişimleri responsive çalışmalı.
