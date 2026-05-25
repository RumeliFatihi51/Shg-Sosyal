-- ŞHG Sosyal zengin demo seed.
-- Önce uygulamadan en az bir kullanıcı oluşturun; seed ilk profili demo sahibi olarak kullanır.
-- SQL Editor'da tekrar çalıştırmaya dayanacak şekilde slug/title kontrolleri kullanır.

with owner_profile as (
  select p.id
  from public.profiles as p
  order by p.created_at asc
  limit 1
),
upsert_communities as (
  insert into public.communities (name, slug, description, status, created_by, approved_by, approved_at)
  select demo.name, demo.slug, demo.description, 'approved', owner_profile.id, owner_profile.id, now()
  from (
    values
      ('Yapay Zeka Topluluğu', 'yapay-zeka-toplulugu-demo', 'Üretken yapay zeka, robotik ve proje geliştirme oturumları düzenleyen okul topluluğu.'),
      ('Sahne ve Tiyatro', 'sahne-ve-tiyatro-demo', 'Okul içi oyun, doğaçlama ve sahne arkası ekiplerini bir araya getirir.'),
      ('Spor ve Sağlık', 'spor-ve-saglik-demo', 'Turnuvalar, sabah koşuları ve sağlıklı yaşam etkinlikleri organize eder.'),
      ('Müzik Kulübü', 'muzik-kulubu-demo', 'Konser, jam session ve okul korosu çalışmalarını duyurur.')
  ) as demo(name, slug, description)
  cross join owner_profile
  on conflict (slug) do update
    set description = excluded.description,
        status = 'approved',
        approved_at = coalesce(public.communities.approved_at, now())
  returning public.communities.id, public.communities.slug
)
insert into public.community_members (community_id, user_id, role)
select upsert_communities.id, owner_profile.id, 'admin'
from upsert_communities
cross join owner_profile
on conflict (community_id, user_id) do nothing;

with owner_profile as (
  select p.id
  from public.profiles as p
  order by p.created_at asc
  limit 1
),
event_rows as (
  select
    communities.id as community_id,
    owner_profile.id as created_by,
    demo.title,
    demo.description,
    demo.day_offset,
    demo.start_time,
    demo.location,
    demo.capacity
  from (
    values
      ('yapay-zeka-toplulugu-demo', 'AI Proje Atölyesi', 'Takımlar halinde küçük bir fikirden çalışan prototipe giden hızlı atölye.', 1, '15:30'::time, 'Bilişim Laboratuvarı', 36),
      ('sahne-ve-tiyatro-demo', 'Doğaçlama Sahnesi', 'Kısa oyunlar ve doğaçlama egzersizleriyle sahne pratiği.', 2, '16:00'::time, 'Çok Amaçlı Salon', 80),
      ('spor-ve-saglik-demo', '3x3 Basketbol Turnuvası', 'Sınıflar arası hızlı turnuva ve dostluk maçları.', 4, '14:00'::time, 'Spor Salonu', 60),
      ('muzik-kulubu-demo', 'Akustik Öğle Arası', 'Öğle arasında kısa akustik performanslar ve açık mikrofon.', 6, '12:40'::time, 'Bahçe Sahnesi', 120),
      ('yapay-zeka-toplulugu-demo', 'Robotik Mini Demo', 'Sensör, motor ve basit otomasyon demo masaları.', 9, '15:00'::time, 'Fizik Laboratuvarı', 30)
  ) as demo(slug, title, description, day_offset, start_time, location, capacity)
  join public.communities as communities on communities.slug = demo.slug
  cross join owner_profile
)
insert into public.events (
  community_id,
  created_by,
  title,
  description,
  event_date,
  start_time,
  location,
  capacity,
  status,
  lifecycle,
  approved_by,
  approved_at
)
select
  event_rows.community_id,
  event_rows.created_by,
  event_rows.title,
  event_rows.description,
  current_date + event_rows.day_offset,
  event_rows.start_time,
  event_rows.location,
  event_rows.capacity,
  'approved',
  'scheduled',
  event_rows.created_by,
  now()
from event_rows
where not exists (
  select 1
  from public.events as existing_events
  where existing_events.title = event_rows.title
);

with owner_profile as (
  select p.id
  from public.profiles as p
  order by p.created_at asc
  limit 1
),
post_rows as (
  select
    communities.id as community_id,
    owner_profile.id as author_id,
    demo.title,
    demo.body
  from (
    values
      ('yapay-zeka-toplulugu-demo', 'Yeni dönem proje fikirleri', 'Bu hafta kısa sunumlarla proje fikirlerini toplayıp çalışma gruplarını oluşturuyoruz.'),
      ('sahne-ve-tiyatro-demo', 'Sahne arkası ekibi aranıyor', 'Işık, ses ve dekor tarafında görev almak isteyenler bu gönderiye yorum bırakabilir.'),
      ('spor-ve-saglik-demo', 'Turnuva fikstürü önerileri', 'Basketbol turnuvası için sınıf temsilcilerinden fikstür önerilerini bekliyoruz.'),
      ('muzik-kulubu-demo', 'Açık mikrofon listesi', 'Akustik Öğle Arası için çalmak istediğin parçayı ve ekibini yaz.')
  ) as demo(slug, title, body)
  join public.communities as communities on communities.slug = demo.slug
  cross join owner_profile
)
insert into public.posts (community_id, author_id, title, body)
select post_rows.community_id, post_rows.author_id, post_rows.title, post_rows.body
from post_rows
where not exists (
  select 1
  from public.posts as existing_posts
  where existing_posts.title = post_rows.title
);

with owner_profile as (
  select p.id
  from public.profiles as p
  order by p.created_at asc
  limit 1
),
sample_posts as (
  select posts.id
  from public.posts as posts
  where posts.title in ('Yeni dönem proje fikirleri', 'Sahne arkası ekibi aranıyor', 'Turnuva fikstürü önerileri')
)
insert into public.comments (post_id, author_id, body)
select sample_posts.id, owner_profile.id, 'Demo yorum: buna katılmak isterim, detayları bekliyorum.'
from sample_posts
cross join owner_profile
where not exists (
  select 1
  from public.comments as existing_comments
  where existing_comments.post_id = sample_posts.id
    and existing_comments.body = 'Demo yorum: buna katılmak isterim, detayları bekliyorum.'
);

with owner_profile as (
  select p.id
  from public.profiles as p
  order by p.created_at asc
  limit 1
),
sample_posts as (
  select posts.id
  from public.posts as posts
  where posts.title in ('Yeni dönem proje fikirleri', 'Sahne arkası ekibi aranıyor', 'Turnuva fikstürü önerileri', 'Açık mikrofon listesi')
)
insert into public.post_votes (post_id, user_id, direction)
select sample_posts.id, owner_profile.id, 1
from sample_posts
cross join owner_profile
on conflict (post_id, user_id) do update set direction = excluded.direction;

with owner_profile as (
  select p.id
  from public.profiles as p
  order by p.created_at asc
  limit 1
),
sample_events as (
  select events.id
  from public.events as events
  where events.title in ('AI Proje Atölyesi', 'Doğaçlama Sahnesi', '3x3 Basketbol Turnuvası')
)
insert into public.event_participants (event_id, user_id, status)
select sample_events.id, owner_profile.id, 'going'
from sample_events
cross join owner_profile
on conflict (event_id, user_id) do nothing;

with owner_profile as (
  select p.id
  from public.profiles as p
  order by p.created_at asc
  limit 1
)
insert into public.announcements (author_id, title, body, audience)
select owner_profile.id, 'Haftanın sosyal takvimi yayında', 'Bu hafta atölye, sahne, spor ve müzik etkinlikleri ŞHG Sosyal takvimine eklendi.', 'school'
from owner_profile
where not exists (
  select 1
  from public.announcements as existing_announcements
  where existing_announcements.title = 'Haftanın sosyal takvimi yayında'
);

with owner_profile as (
  select p.id
  from public.profiles as p
  order by p.created_at asc
  limit 1
),
inserted_poll as (
  insert into public.polls (created_by, title, description, status, closes_at)
  select
    owner_profile.id,
    'Bahçe etkinlik alanı nasıl kullanılmalı?',
    'Okul bahçesindeki açık alan için sosyal etkinlik fikrini seç.',
    'open',
    now() + interval '14 days'
  from owner_profile
  where not exists (
    select 1
    from public.polls as existing_polls
    where existing_polls.title = 'Bahçe etkinlik alanı nasıl kullanılmalı?'
  )
  returning public.polls.id
),
selected_poll as (
  select inserted_poll.id
  from inserted_poll
  union
  select existing_polls.id
  from public.polls as existing_polls
  where existing_polls.title = 'Bahçe etkinlik alanı nasıl kullanılmalı?'
  limit 1
),
poll_options_to_insert as (
  select selected_poll.id as poll_id, options.option_label, options.position
  from selected_poll
  cross join (
    values
      ('Açık hava konserleri', 1),
      ('Sınıflar arası turnuva', 2),
      ('Kulüp tanıtım stantları', 3),
      ('Sessiz çalışma alanı', 4)
  ) as options(option_label, position)
)
insert into public.poll_options (poll_id, label, position)
select poll_options_to_insert.poll_id, poll_options_to_insert.option_label, poll_options_to_insert.position
from poll_options_to_insert
where not exists (
  select 1
  from public.poll_options as existing_options
  where existing_options.poll_id = poll_options_to_insert.poll_id
    and existing_options.label = poll_options_to_insert.option_label
);
