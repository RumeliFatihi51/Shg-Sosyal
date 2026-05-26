alter table public.event_participants
  drop constraint if exists event_participants_status_check;

alter table public.event_participants
  add constraint event_participants_status_check
  check (status in ('going', 'waitlisted', 'interested', 'not_going'));

create table if not exists public.user_points (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_points integer not null default 0 check (total_points >= 0),
  weekly_points integer not null default 0 check (weekly_points >= 0),
  daily_points integer not null default 0 check (daily_points >= 0),
  daily_reset_on date not null default current_date,
  weekly_reset_on date not null default date_trunc('week', now())::date,
  updated_at timestamptz not null default now()
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null,
  target_type text not null,
  target_id uuid,
  idempotency_key text,
  points integer not null check (points <> 0),
  metadata jsonb not null default '{}'::jsonb,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.badges
  add column if not exists icon text not null default 'sparkles',
  add column if not exists category text not null default 'Katılım',
  add column if not exists criteria_type text not null default 'points',
  add column if not exists criteria_key text,
  add column if not exists criteria_value integer not null default 0,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true;

create unique index if not exists point_events_idempotency_unique
on public.point_events(idempotency_key)
where idempotency_key is not null and revoked_at is null;

create unique index if not exists point_events_target_unique
on public.point_events(user_id, action_type, target_type, target_id)
where target_id is not null and revoked_at is null;

create index if not exists point_events_user_created_idx
on public.point_events(user_id, created_at desc);

create index if not exists point_events_action_created_idx
on public.point_events(action_type, created_at desc);

create index if not exists point_events_target_idx
on public.point_events(target_type, target_id);

create index if not exists user_points_total_idx
on public.user_points(total_points desc);

create index if not exists user_points_weekly_idx
on public.user_points(weekly_points desc, updated_at desc);

create index if not exists user_points_daily_idx
on public.user_points(daily_points desc, updated_at desc);

create index if not exists badges_category_sort_idx
on public.badges(category, sort_order, name);

alter table public.user_points enable row level security;
alter table public.point_events enable row level security;

drop policy if exists "Users read own points" on public.user_points;
create policy "Users read own points"
on public.user_points for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.current_user_role()::text in ('admin', 'moderator', 'teacher')
);

drop policy if exists "Users read own point events" on public.point_events;
create policy "Users read own point events"
on public.point_events for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.current_user_role()::text in ('admin', 'moderator', 'teacher')
);

grant select on public.user_points to authenticated;
grant select on public.point_events to authenticated;

insert into public.badges
  (code, name, description, icon, category, criteria_type, criteria_key, criteria_value, point_threshold, sort_order, is_active)
values
  ('first_step', 'İlk Adım', 'Profilini tamamlayıp ŞHG Sosyal’e ilk katkını yaptın.', 'sparkles', 'Sosyal', 'action_count', 'profile_complete', 1, 1, 10, true),
  ('first_event_join', 'İlk Katılım', 'İlk etkinliğine katıldın.', 'calendar-check', 'Katılım', 'action_count', 'event_join', 1, 10, 20, true),
  ('social_participant', 'Sosyal Katılımcı', '5 etkinliğe katıldın.', 'users', 'Katılım', 'action_count', 'event_join', 5, 50, 30, true),
  ('event_hunter', 'Etkinlik Avcısı', '10 etkinliğe katıldın.', 'trophy', 'Katılım', 'action_count', 'event_join', 10, 100, 40, true),
  ('idea_maker', 'Fikir Veren', 'İlk etkinlik önerini gönderdin.', 'lightbulb', 'Üretim', 'action_count', 'event_suggest', 1, 15, 50, true),
  ('organizer', 'Organizatör', 'Onaylanan ilk etkinliğini oluşturdun.', 'megaphone', 'Üretim', 'action_count', 'event_approved', 1, 30, 60, true),
  ('community_founder', 'Topluluk Kurucusu', 'İlk topluluğunu onaylattın.', 'badge-plus', 'Topluluk', 'action_count', 'community_approved', 1, 25, 70, true),
  ('active_commenter', 'Aktif Yorumcu', '10 yorum yaptın.', 'message-circle', 'Sosyal', 'action_count', 'comment_create', 10, 40, 80, true),
  ('poll_maker', 'Anketçi', 'İlk anketini oluşturdun.', 'list-checks', 'Üretim', 'action_count', 'poll_create', 1, 12, 90, true),
  ('voter', 'Oy Veren', '10 ankete oy verdin.', 'check-circle', 'Sosyal', 'action_count', 'poll_vote', 10, 30, 100, true),
  ('weekly_active', 'Haftanın Aktifi', 'Bu hafta 75 puana ulaştın.', 'flame', 'Haftalık başarı', 'weekly_points', null, 75, 75, 110, true)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    category = excluded.category,
    criteria_type = excluded.criteria_type,
    criteria_key = excluded.criteria_key,
    criteria_value = excluded.criteria_value,
    point_threshold = excluded.point_threshold,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

create or replace function public.check_and_award_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_badge record;
  current_total integer;
  current_weekly integer;
  action_total integer;
begin
  if p_user_id is null then
    return;
  end if;

  select coalesce(user_points.total_points, profiles.participation_points, 0),
         case
           when user_points.weekly_reset_on = date_trunc('week', now())::date then coalesce(user_points.weekly_points, 0)
           else 0
         end
  into current_total, current_weekly
  from public.profiles
  left join public.user_points on user_points.user_id = profiles.id
  where profiles.id = p_user_id;

  for target_badge in
    select * from public.badges where is_active = true order by sort_order asc
  loop
    if target_badge.criteria_type = 'points' and current_total >= target_badge.criteria_value then
      insert into public.user_badges (user_id, badge_id)
      values (p_user_id, target_badge.id)
      on conflict (user_id, badge_id) do nothing;
    elsif target_badge.criteria_type = 'weekly_points' and current_weekly >= target_badge.criteria_value then
      insert into public.user_badges (user_id, badge_id)
      values (p_user_id, target_badge.id)
      on conflict (user_id, badge_id) do nothing;
    elsif target_badge.criteria_type = 'action_count' then
      select count(*)::integer
      into action_total
      from public.point_events
      where user_id = p_user_id
        and action_type = target_badge.criteria_key
        and revoked_at is null;

      if action_total >= target_badge.criteria_value then
        insert into public.user_badges (user_id, badge_id)
        values (p_user_id, target_badge.id)
        on conflict (user_id, badge_id) do nothing;
      end if;
    end if;
  end loop;
end;
$$;

create or replace function public.award_points_safely(
  p_user_id uuid,
  p_action_type text,
  p_target_type text,
  p_target_id uuid default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  base_points integer;
  current_daily integer := 0;
  available_points integer;
  awarded_points integer;
  today date := current_date;
  week_start date := date_trunc('week', now())::date;
  inserted_id uuid;
begin
  if p_user_id is null or p_action_type is null or p_target_type is null then
    return 0;
  end if;

  base_points := case p_action_type
    when 'profile_complete' then 1
    when 'event_join' then 10
    when 'event_suggest' then 15
    when 'event_approved' then 30
    when 'post_create' then 8
    when 'poll_create' then 12
    when 'poll_vote' then 3
    when 'comment_create' then 4
    when 'friend_accept' then 2
    when 'community_join' then 5
    when 'community_approved' then 25
    else 0
  end;

  if base_points <= 0 then
    return 0;
  end if;

  insert into public.user_points (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select case when daily_reset_on = today then daily_points else 0 end
  into current_daily
  from public.user_points
  where user_id = p_user_id
  for update;

  available_points := greatest(120 - coalesce(current_daily, 0), 0);
  awarded_points := least(base_points, available_points);

  if awarded_points <= 0 then
    return 0;
  end if;

  insert into public.point_events (
    user_id,
    action_type,
    target_type,
    target_id,
    idempotency_key,
    points,
    metadata
  )
  values (
    p_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    coalesce(p_idempotency_key, p_action_type || ':' || p_target_type || ':' || coalesce(p_target_id::text, 'none') || ':' || p_user_id::text),
    awarded_points,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict do nothing
  returning id into inserted_id;

  if inserted_id is null then
    return 0;
  end if;

  update public.user_points
  set total_points = total_points + awarded_points,
      daily_points = case when daily_reset_on = today then daily_points + awarded_points else awarded_points end,
      weekly_points = case when weekly_reset_on = week_start then weekly_points + awarded_points else awarded_points end,
      daily_reset_on = today,
      weekly_reset_on = week_start,
      updated_at = now()
  where user_id = p_user_id;

  update public.profiles
  set participation_points = coalesce(participation_points, 0) + awarded_points
  where id = p_user_id;

  perform public.check_and_award_badges(p_user_id);

  return awarded_points;
end;
$$;

create or replace view public.daily_leaderboard
with (security_invoker = true)
as
select
  row_number() over (order by user_points.daily_points desc, user_points.updated_at asc) as rank,
  profiles.id as user_id,
  profiles.first_name,
  profiles.last_name,
  profiles.username,
  profiles.tag,
  profiles.class_name,
  profiles.avatar_path,
  user_points.daily_points as points
from public.user_points
join public.profiles on profiles.id = user_points.user_id
where user_points.daily_reset_on = current_date
  and user_points.daily_points > 0
  and coalesce(profiles.is_suspended, false) = false;

create or replace view public.weekly_leaderboard
with (security_invoker = true)
as
select
  row_number() over (order by user_points.weekly_points desc, user_points.updated_at asc) as rank,
  profiles.id as user_id,
  profiles.first_name,
  profiles.last_name,
  profiles.username,
  profiles.tag,
  profiles.class_name,
  profiles.avatar_path,
  user_points.weekly_points as points
from public.user_points
join public.profiles on profiles.id = user_points.user_id
where user_points.weekly_reset_on = date_trunc('week', now())::date
  and user_points.weekly_points > 0
  and coalesce(profiles.is_suspended, false) = false;

create or replace view public.all_time_leaderboard
with (security_invoker = true)
as
select
  row_number() over (order by user_points.total_points desc, user_points.updated_at asc) as rank,
  profiles.id as user_id,
  profiles.first_name,
  profiles.last_name,
  profiles.username,
  profiles.tag,
  profiles.class_name,
  profiles.avatar_path,
  user_points.total_points as points
from public.user_points
join public.profiles on profiles.id = user_points.user_id
where user_points.total_points > 0
  and coalesce(profiles.is_suspended, false) = false;

create or replace view public.class_leaderboard
with (security_invoker = true)
as
select
  row_number() over (order by sum(user_points.weekly_points) desc, count(*) desc) as rank,
  profiles.class_name,
  sum(user_points.weekly_points)::integer as points,
  count(*)::integer as user_count
from public.user_points
join public.profiles on profiles.id = user_points.user_id
where user_points.weekly_reset_on = date_trunc('week', now())::date
  and user_points.weekly_points > 0
  and profiles.class_name is not null
  and coalesce(profiles.is_suspended, false) = false
group by profiles.class_name;

create or replace view public.community_leaderboard
with (security_invoker = true)
as
select
  row_number() over (order by (
    coalesce(communities.member_count, 0) * 2
    + coalesce(communities.post_count, 0) * 3
    + coalesce(communities.event_count, 0) * 4
    + coalesce(communities.activity_24h_count, 0)
  ) desc, communities.name asc) as rank,
  communities.id as community_id,
  communities.name,
  communities.slug,
  communities.member_count,
  communities.post_count,
  communities.event_count,
  (
    coalesce(communities.member_count, 0) * 2
    + coalesce(communities.post_count, 0) * 3
    + coalesce(communities.event_count, 0) * 4
    + coalesce(communities.activity_24h_count, 0)
  )::integer as points
from public.communities
where communities.status = 'approved'
  and coalesce(communities.is_suspended, false) = false;

revoke all on function public.award_points_safely(uuid, text, text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.check_and_award_badges(uuid) from public, anon, authenticated;
grant execute on function public.award_points_safely(uuid, text, text, uuid, text, jsonb) to service_role;
grant execute on function public.check_and_award_badges(uuid) to service_role;
grant select on public.daily_leaderboard to authenticated;
grant select on public.weekly_leaderboard to authenticated;
grant select on public.all_time_leaderboard to authenticated;
grant select on public.class_leaderboard to authenticated;
grant select on public.community_leaderboard to authenticated;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'start_direct_conversation') then
    grant execute on function public.start_direct_conversation(uuid) to authenticated;
  end if;
end;
$$;
