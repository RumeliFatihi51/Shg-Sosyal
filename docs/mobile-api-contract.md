# ŞHG Sosyal Mobile API Contract

Flutter uygulaması bu sözleşmeye göre konuşur. Bugün Next.js `/api/mobile` bridge kullanılıyor; ileride Ubuntu backend'e geçerken aynı endpoint ve DTO yapısı korunursa mobil UI değişmeden kalır.

## Runtime

- API mode varsayılan: `SHG_USE_API=true`
- Lokal bridge: `http://localhost:3000/api/mobile`
- Production: `--dart-define=SHG_API_BASE_URL=https://alan-adin.vercel.app/api/mobile`
- Mock mode: `--dart-define=SHG_USE_API=false`
- Auth token `ApiAuthService` tarafından secure storage'a yazılır; `ApiClient` her isteğe otomatik Bearer token ekler.

## Response

- Başarılı cevap: `{ "data": ... }`
- Hata cevabı: `{ "error": "Kullanıcıya gösterilebilir Türkçe hata" }`
- ID alanları string, tarih alanları ISO-8601 string.
- DTO alanları snake_case.

## Auth / Profile

Roller:

- `admin`: sınırsız yönetim, onay/red, rol değiştirme.
- `teacher`: güvenilir yayıncı; gönderi, etkinlik ve anketi onaysız yayınlar, admin işlemi yapmaz.
- `community_admin`: sadece yönettiği topluluk içinde üye/gönderi/etkinlik yönetir.
- `student`: varsayılan rol.

`POST /auth/login`

```json
{ "email": "user@example.com", "password": "secret" }
```

`POST /auth/register`

```json
{
  "full_name": "Eymen Aydın",
  "email": "user@example.com",
  "password": "secret",
  "class_name": "9/A",
  "username": "@eymen"
}
```

`GET /auth/me`

`GET /profile/me`

`GET /profile/:id`

`PUT /profile/me`

```json
{
  "full_name": "Eymen Aydın",
  "username": "@eymen",
  "class_name": "9/A",
  "bio": "Robotik ve okul etkinlikleri."
}
```

Profile summary:

```json
{
  "user": {},
  "badges": [],
  "events": [],
  "communities": []
}
```

## Feed

`GET /feed?filter=for-you|events|communities`

`POST /feed/posts`

```json
{
  "community_id": "c1",
  "content": "Okulda ne paylaşmak istiyorsun?",
  "image_base64": "optional-base64",
  "image_mime_type": "image/jpeg"
}
```

Görsel kuralları:

- `image/jpeg`, `image/png`, `image/webp`
- maksimum `3MB`
- backend `post-images` bucket'a yükler ve DTO içinde `image_url` döner.

`POST /feed/polls`

```json
{
  "community_id": "c1",
  "question": "Öğle arasında hangi etkinlik olsun?",
  "options": ["Müzik", "Satranç", "Bahçe"]
}
```

## Communities

`GET /communities?tab=recommended|active|joined`

`POST /communities`

```json
{
  "name": "Yapay Zeka Topluluğu",
  "description": "Okulda yapay zeka ve üretken araçlar üzerine çalışmalar.",
  "category": "Teknoloji"
}
```

`POST /communities/:id/members`

`DELETE /communities/:id/members/:userId`

## Events

`GET /events?tab=upcoming|today|popular|joined`

`POST /events`

```json
{
  "title": "Robotik Mini Demo",
  "description": "Robot projelerini birlikte deneyelim.",
  "location": "Bilişim Laboratuvarı",
  "starts_at": "2026-06-06T15:00:00.000Z",
  "community_id": "c1",
  "capacity": 30,
  "category": "workshop"
}
```

`POST /events/:id/participation`

```json
{ "status": "going" }
```

Allowed: `interested`, `going`, `not_going`.

## Friends

`GET /friends?status=accepted|incoming|outgoing`

`GET /friends/search?q=@eymen`

`POST /friends/requests`

```json
{ "receiver_id": "u2" }
```

`POST /friends/requests/:id/accept`

`POST /friends/requests/:id/reject`

`POST /friends/requests/:id/cancel`

`DELETE /friends/:id`

## Messages

Sadece kabul edilmiş arkadaşlar DM başlatabilir.

`GET /messages/conversations`

`POST /messages/direct`

```json
{ "user_id": "u2" }
```

`GET /messages/conversations/:id?before=2026-06-05T10:00:00Z`

Son 30 mesajı veya cursor öncesi eski mesajları döner. Okuma sırasında conversation read state güncellenir.

`POST /messages/conversations/:id/messages`

```json
{ "content": "Merhaba" }
```

Kurallar:

- boş mesaj gönderilemez
- maksimum `2000` karakter
- gönderim sonrası `last_message_at` güncellenir
- karşı üyeye `dm_message` bildirimi üretilir

`PUT /messages/conversations/:id/messages/:messageId`

`DELETE /messages/conversations/:id/messages/:messageId`

`POST /messages/conversations/:id/read`

## Notifications

`GET /notifications`

`POST /notifications/:id/read`

`POST /notifications/read-all`

## Rewards

`GET /badges`

`GET /leaderboard?period=daily|weekly|all_time`

Bu endpointler yalnız public profil alanları döndürmelidir.

## Admin

Mobil admin endpointleri yalnız `admin` rolüne açıktır.

`GET /admin/overview?q=@eymen&role=teacher`

`POST /admin/approvals`

```json
{
  "type": "event",
  "id": "e1",
  "decision": "reject",
  "reason": "Saat ve konum bilgisi net değil."
}
```

Allowed types: `event`, `poll`, `community`.

Allowed decisions: `approve`, `reject`.

`PUT /admin/users/:id/role`

```json
{ "role": "teacher" }
```

Allowed roles: `student`, `community_admin`, `teacher`, `admin`.
