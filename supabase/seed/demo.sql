-- SHG Sosyal zengin demo seed.
-- Once uygulamadan en az bir kullanici olusturun; seed ilk profili demo sahibi olarak kullanir.
-- SQL Editor'da tekrar calistirmaya dayanacak sekilde slug/title kontrolleri kullanir.

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
      ('Yapay Zeka Toplulugu', 'yapay-zeka-toplulugu-demo', 'Uretken yapay zeka, robotik ve proje gelistirme oturumlari duzenleyen okul toplulugu.'),
      ('Sahne ve Tiyatro', 'sahne-ve-tiyatro-demo', 'Okul ici oyun, dogaclama ve sahne arkasi ekiplerini bir araya getirir.'),
      ('Spor ve Saglik', 'spor-ve-saglik-demo', 'Turnuvalar, sabah kosulari ve saglikli yasam etkinlikleri organize eder.'),
      ('Muzik Kulubu', 'muzik-kulubu-demo', 'Konser, jam session ve okul korosu calismalarini duyurur.')
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
      ('yapay-zeka-toplulugu-demo', 'AI Proje Atolyesi', 'Takimlar halinde kucuk bir fikirden calisan prototipe giden hizli atolye.', 1, '15:30'::time, 'Bilisim Laboratuvari', 36),
      ('sahne-ve-tiyatro-demo', 'Dogaclama Sahnesi', 'Kisa oyunlar ve dogaclama egzersizleriyle sahne pratigi.', 2, '16:00'::time, 'Cok Amacli Salon', 80),
      ('spor-ve-saglik-demo', '3x3 Basketbol Turnuvasi', 'Siniflar arasi hizli turnuva ve dostluk maclari.', 4, '14:00'::time, 'Spor Salonu', 60),
      ('muzik-kulubu-demo', 'Akustik Ogle Arasi', 'Ogle arasinda kisa akustik performanslar ve acik mikrofon.', 6, '12:40'::time, 'Bahce Sahnesi', 120),
      ('yapay-zeka-toplulugu-demo', 'Robotik Mini Demo', 'Sensor, motor ve basit otomasyon demo masalari.', 9, '15:00'::time, 'Fizik Laboratuvari', 30)
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
      ('yapay-zeka-toplulugu-demo', 'Yeni donem proje fikirleri', 'Bu hafta kisa sunumlarla proje fikirlerini toplayip calisma gruplarini olusturuyoruz.'),
      ('sahne-ve-tiyatro-demo', 'Sahne arkasi ekibi araniyor', 'Isik, ses ve dekor tarafinda gorev almak isteyenler bu gonderiye yorum birakabilir.'),
      ('spor-ve-saglik-demo', 'Turnuva fiksturu onerileri', 'Basketbol turnuvasi icin sinif temsilcilerinden fikstur onerilerini bekliyoruz.'),
      ('muzik-kulubu-demo', 'Acik mikrofon listesi', 'Akustik Ogle Arasi icin calmak istedigin parcayi ve ekibini yaz.')
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
  where posts.title in ('Yeni donem proje fikirleri', 'Sahne arkasi ekibi araniyor', 'Turnuva fiksturu onerileri')
)
insert into public.comments (post_id, author_id, body)
select sample_posts.id, owner_profile.id, 'Demo yorum: buna katilmak isterim, detaylari bekliyorum.'
from sample_posts
cross join owner_profile
where not exists (
  select 1
  from public.comments as existing_comments
  where existing_comments.post_id = sample_posts.id
    and existing_comments.body = 'Demo yorum: buna katilmak isterim, detaylari bekliyorum.'
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
  where posts.title in ('Yeni donem proje fikirleri', 'Sahne arkasi ekibi araniyor', 'Turnuva fiksturu onerileri', 'Acik mikrofon listesi')
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
  where events.title in ('AI Proje Atolyesi', 'Dogaclama Sahnesi', '3x3 Basketbol Turnuvasi')
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
select owner_profile.id, 'Haftanin sosyal takvimi yayinda', 'Bu hafta atolye, sahne, spor ve muzik etkinlikleri SHG Sosyal takvimine eklendi.', 'school'
from owner_profile
where not exists (
  select 1
  from public.announcements as existing_announcements
  where existing_announcements.title = 'Haftanin sosyal takvimi yayinda'
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
    'Bahce etkinlik alani nasil kullanilmali?',
    'Okul bahcesindeki acik alan icin sosyal etkinlik fikrini sec.',
    'open',
    now() + interval '14 days'
  from owner_profile
  where not exists (
    select 1
    from public.polls as existing_polls
    where existing_polls.title = 'Bahce etkinlik alani nasil kullanilmali?'
  )
  returning public.polls.id
),
selected_poll as (
  select inserted_poll.id
  from inserted_poll
  union
  select existing_polls.id
  from public.polls as existing_polls
  where existing_polls.title = 'Bahce etkinlik alani nasil kullanilmali?'
  limit 1
),
poll_options_to_insert as (
  select selected_poll.id as poll_id, options.option_label, options.position
  from selected_poll
  cross join (
    values
      ('Acik hava konserleri', 1),
      ('Siniflar arasi turnuva', 2),
      ('Kulup tanitim stantlari', 3),
      ('Sessiz calisma alani', 4)
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
