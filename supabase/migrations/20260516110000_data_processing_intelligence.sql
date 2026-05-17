-- SHG Sosyal data processing and intelligence layer.
-- Adds counter caches, activity tracking, safe RPC mutations, feed views,
-- trend scoring, and full-text search vectors.

alter type public.notification_type add value if not exists 'announcement';
alter type public.notification_type add value if not exists 'poll';
alter type public.notification_type add value if not exists 'friend_event';
alter type public.notification_type add value if not exists 'friend_post';
alter type public.notification_type add value if not exists 'activity_digest';

-- Compatibility guard: this function normally comes from
-- 20260516093000_backend_security_hardening.sql. Keeping it here makes this
-- migration re-runnable even if that hardening file was skipped by mistake.
create or replace function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select not profiles.is_suspended
      from public.profiles as profiles
      where profiles.id = auth.uid()
    ),
    false
  )
$$;

grant execute on function public.current_user_is_active() to authenticated;

alter table public.posts
  add column if not exists upvote_count integer not null default 0,
  add column if not exists downvote_count integer not null default 0,
  add column if not exists score integer not null default 0,
  add column if not exists comment_count integer not null default 0,
  add column if not exists report_count integer not null default 0,
  add column if not exists view_count integer not null default 0,
  add column if not exists activity_24h_count integer not null default 0,
  add column if not exists popularity_score double precision not null default 0;

alter table public.posts
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored;

alter table public.events
  add column if not exists participant_count integer not null default 0,
  add column if not exists waitlist_count integer not null default 0,
  add column if not exists view_count integer not null default 0,
  add column if not exists activity_24h_count integer not null default 0,
  add column if not exists trend_score double precision not null default 0;

alter table public.events
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(location, '')
    )
  ) stored;

alter table public.communities
  add column if not exists member_count integer not null default 0,
  add column if not exists follower_count integer not null default 0,
  add column if not exists post_count integer not null default 0,
  add column if not exists event_count integer not null default 0,
  add column if not exists view_count integer not null default 0,
  add column if not exists activity_24h_count integer not null default 0,
  add column if not exists trend_score double precision not null default 0;

alter table public.communities
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored;

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (
    action in (
      'event_view',
      'post_view',
      'community_visit',
      'search',
      'event_create',
      'event_join',
      'event_leave',
      'community_create',
      'community_join',
      'community_leave',
      'community_follow',
      'community_unfollow',
      'post_create',
      'post_vote',
      'comment_create',
      'report_create',
      'poll_create',
      'poll_vote',
      'click',
      'share'
    )
  ),
  target_type text not null check (target_type in ('event', 'post', 'community', 'poll', 'search', 'system')),
  target_id uuid,
  search_query text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_events enable row level security;

drop policy if exists "Users can insert own activity" on public.activity_events;
create policy "Users can insert own activity"
on public.activity_events for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and public.current_user_is_active()
);

drop policy if exists "Users read own activity" on public.activity_events;
create policy "Users read own activity"
on public.activity_events for select
to authenticated
using (
  actor_id = (select auth.uid())
  or public.is_admin_or_moderator()
);

grant select, insert on public.activity_events to authenticated;

create index if not exists activity_events_actor_created_idx
on public.activity_events(actor_id, created_at desc);

create index if not exists activity_events_target_created_idx
on public.activity_events(target_type, target_id, created_at desc);

create index if not exists activity_events_action_created_idx
on public.activity_events(action, created_at desc);

create index if not exists activity_events_search_query_idx
on public.activity_events(search_query)
where action = 'search' and search_query is not null;

create index if not exists posts_search_vector_idx
on public.posts using gin(search_vector);

create index if not exists events_search_vector_idx
on public.events using gin(search_vector);

create index if not exists communities_search_vector_idx
on public.communities using gin(search_vector);

create index if not exists posts_popularity_score_idx
on public.posts(deleted_at, popularity_score desc, created_at desc);

create index if not exists posts_community_popularity_idx
on public.posts(community_id, deleted_at, popularity_score desc, created_at desc);

create index if not exists events_trend_score_idx
on public.events(status, lifecycle, trend_score desc, event_date);

create index if not exists communities_trend_score_idx
on public.communities(status, is_suspended, trend_score desc, created_at desc);

create or replace function public.recalculate_post_counters(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_created_at timestamptz;
  upvotes integer;
  downvotes integer;
  comments_total integer;
  reports_total integer;
  views_total integer;
  activity_total integer;
  age_hours double precision;
  score_total integer;
  computed_score double precision;
begin
  select posts.created_at into post_created_at
  from public.posts as posts
  where posts.id = target_post_id;

  if post_created_at is null then
    return;
  end if;

  select count(*) filter (where post_votes.direction = 1),
         count(*) filter (where post_votes.direction = -1)
  into upvotes, downvotes
  from public.post_votes as post_votes
  where post_votes.post_id = target_post_id;

  select count(*) into comments_total
  from public.comments as comments
  where comments.post_id = target_post_id
    and comments.deleted_at is null;

  select count(*) into reports_total
  from public.reports as reports
  where reports.target_type = 'post'
    and reports.target_id = target_post_id;

  select count(*) filter (where activity_events.action = 'post_view'),
         count(*) filter (where activity_events.created_at >= now() - interval '24 hours')
  into views_total, activity_total
  from public.activity_events as activity_events
  where activity_events.target_type = 'post'
    and activity_events.target_id = target_post_id;

  score_total := coalesce(upvotes, 0) - coalesce(downvotes, 0);
  age_hours := greatest(extract(epoch from (now() - post_created_at)) / 3600, 1);
  computed_score := (
    coalesce(upvotes, 0) * 3
    - coalesce(downvotes, 0) * 2
    + coalesce(comments_total, 0) * 2
    + coalesce(activity_total, 0) * 1.2
    + ln(coalesce(views_total, 0) + 1)
    - coalesce(reports_total, 0) * 4
  ) / power(age_hours + 2, 0.25);

  update public.posts
  set upvote_count = coalesce(upvotes, 0),
      downvote_count = coalesce(downvotes, 0),
      score = score_total,
      comment_count = coalesce(comments_total, 0),
      report_count = coalesce(reports_total, 0),
      view_count = coalesce(views_total, 0),
      activity_24h_count = coalesce(activity_total, 0),
      popularity_score = computed_score
  where posts.id = target_post_id;
end;
$$;

create or replace function public.recalculate_event_counters(target_event_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  going_total integer;
  waitlist_total integer;
  views_total integer;
  activity_total integer;
  computed_score double precision;
begin
  if not exists (select 1 from public.events as events where events.id = target_event_id) then
    return;
  end if;

  select count(*) filter (where event_participants.status = 'going'),
         count(*) filter (where event_participants.status = 'waitlisted')
  into going_total, waitlist_total
  from public.event_participants as event_participants
  where event_participants.event_id = target_event_id;

  select count(*) filter (where activity_events.action = 'event_view'),
         count(*) filter (where activity_events.created_at >= now() - interval '24 hours')
  into views_total, activity_total
  from public.activity_events as activity_events
  where activity_events.target_type = 'event'
    and activity_events.target_id = target_event_id;

  computed_score := coalesce(going_total, 0) * 2
    + coalesce(waitlist_total, 0)
    + coalesce(activity_total, 0) * 1.5
    + ln(coalesce(views_total, 0) + 1);

  update public.events
  set participant_count = coalesce(going_total, 0),
      waitlist_count = coalesce(waitlist_total, 0),
      view_count = coalesce(views_total, 0),
      activity_24h_count = coalesce(activity_total, 0),
      trend_score = computed_score
  where events.id = target_event_id;
end;
$$;

create or replace function public.recalculate_community_counters(target_community_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  members_total integer;
  followers_total integer;
  posts_total integer;
  events_total integer;
  views_total integer;
  activity_total integer;
  computed_score double precision;
begin
  if not exists (select 1 from public.communities as communities where communities.id = target_community_id) then
    return;
  end if;

  select count(*) into members_total
  from public.community_members as community_members
  where community_members.community_id = target_community_id;

  select count(*) into followers_total
  from public.community_followers as community_followers
  where community_followers.community_id = target_community_id;

  select count(*) into posts_total
  from public.posts as posts
  where posts.community_id = target_community_id
    and posts.deleted_at is null;

  select count(*) into events_total
  from public.events as events
  where events.community_id = target_community_id
    and events.status = 'approved'
    and events.lifecycle <> 'canceled';

  select count(*) filter (where activity_events.action = 'community_visit'),
         count(*) filter (where activity_events.created_at >= now() - interval '24 hours')
  into views_total, activity_total
  from public.activity_events as activity_events
  where activity_events.target_type = 'community'
    and activity_events.target_id = target_community_id;

  computed_score := coalesce(members_total, 0) * 1.5
    + coalesce(followers_total, 0)
    + coalesce(posts_total, 0) * 2
    + coalesce(events_total, 0) * 2
    + coalesce(activity_total, 0) * 1.2
    + ln(coalesce(views_total, 0) + 1);

  update public.communities
  set member_count = coalesce(members_total, 0),
      follower_count = coalesce(followers_total, 0),
      post_count = coalesce(posts_total, 0),
      event_count = coalesce(events_total, 0),
      view_count = coalesce(views_total, 0),
      activity_24h_count = coalesce(activity_total, 0),
      trend_score = computed_score
  where communities.id = target_community_id;
end;
$$;

create or replace function public.handle_post_counter_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_post_counters(old.post_id);
    return old;
  end if;

  perform public.recalculate_post_counters(new.post_id);
  return new;
end;
$$;

create or replace function public.handle_report_counter_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.target_type = 'post' then
      perform public.recalculate_post_counters(old.target_id);
    end if;
    return old;
  end if;

  if new.target_type = 'post' then
    perform public.recalculate_post_counters(new.target_id);
  end if;

  return new;
end;
$$;

create or replace function public.handle_event_participant_counter_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_event_counters(old.event_id);
    return old;
  end if;

  perform public.recalculate_event_counters(new.event_id);
  return new;
end;
$$;

create or replace function public.handle_community_membership_counter_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_community_counters(old.community_id);
    return old;
  end if;

  perform public.recalculate_community_counters(new.community_id);
  return new;
end;
$$;

create or replace function public.handle_post_write_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_community_counters(old.community_id);
    return old;
  end if;

  perform public.recalculate_post_counters(new.id);
  perform public.recalculate_community_counters(new.community_id);

  if tg_op = 'UPDATE' and old.community_id is distinct from new.community_id then
    perform public.recalculate_community_counters(old.community_id);
  end if;

  return new;
end;
$$;

create or replace function public.handle_event_write_counters()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalculate_community_counters(old.community_id);
    return old;
  end if;

  perform public.recalculate_event_counters(new.id);
  if new.community_id is not null then
    perform public.recalculate_community_counters(new.community_id);
  end if;

  if tg_op = 'UPDATE' and old.community_id is distinct from new.community_id and old.community_id is not null then
    perform public.recalculate_community_counters(old.community_id);
  end if;

  return new;
end;
$$;

create or replace function public.handle_activity_event_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.target_type = 'post' and new.target_id is not null then
    perform public.recalculate_post_counters(new.target_id);
  elsif new.target_type = 'event' and new.target_id is not null then
    perform public.recalculate_event_counters(new.target_id);
  elsif new.target_type = 'community' and new.target_id is not null then
    perform public.recalculate_community_counters(new.target_id);
  end if;

  return new;
end;
$$;

drop trigger if exists post_votes_recount_after_write on public.post_votes;
create trigger post_votes_recount_after_write
after insert or update or delete on public.post_votes
for each row execute function public.handle_post_counter_change();

drop trigger if exists comments_recount_after_write on public.comments;
create trigger comments_recount_after_write
after insert or update or delete on public.comments
for each row execute function public.handle_post_counter_change();

drop trigger if exists reports_recount_after_write on public.reports;
create trigger reports_recount_after_write
after insert or update or delete on public.reports
for each row execute function public.handle_report_counter_change();

drop trigger if exists event_participants_recount_after_write on public.event_participants;
create trigger event_participants_recount_after_write
after insert or update or delete on public.event_participants
for each row execute function public.handle_event_participant_counter_change();

drop trigger if exists community_members_recount_after_write on public.community_members;
create trigger community_members_recount_after_write
after insert or update or delete on public.community_members
for each row execute function public.handle_community_membership_counter_change();

drop trigger if exists community_followers_recount_after_write on public.community_followers;
create trigger community_followers_recount_after_write
after insert or update or delete on public.community_followers
for each row execute function public.handle_community_membership_counter_change();

drop trigger if exists posts_recount_after_write on public.posts;
create trigger posts_recount_after_write
after insert or delete or update of deleted_at, community_id on public.posts
for each row execute function public.handle_post_write_counters();

drop trigger if exists events_recount_after_write on public.events;
create trigger events_recount_after_write
after insert or delete or update of status, lifecycle, community_id on public.events
for each row execute function public.handle_event_write_counters();

drop trigger if exists activity_events_recount_after_insert on public.activity_events;
create trigger activity_events_recount_after_insert
after insert on public.activity_events
for each row execute function public.handle_activity_event_insert();

create or replace function public.record_activity(
  p_action text,
  p_target_type text,
  p_target_id uuid default null,
  p_search_query text default null,
  p_path text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_id uuid;
begin
  if auth.uid() is null or not public.current_user_is_active() then
    raise exception 'Authentication required';
  end if;

  insert into public.activity_events (
    actor_id,
    action,
    target_type,
    target_id,
    search_query,
    path,
    metadata
  )
  values (
    auth.uid(),
    p_action,
    p_target_type,
    p_target_id,
    nullif(trim(p_search_query), ''),
    nullif(trim(p_path), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

create or replace function public.vote_post_safely(
  p_post_id uuid,
  p_direction smallint
)
returns table(current_direction smallint, current_score integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_direction smallint;
begin
  if auth.uid() is null or not public.current_user_is_active() then
    raise exception 'Authentication required';
  end if;

  if p_direction not in (-1, 1) then
    raise exception 'Invalid vote direction';
  end if;

  if not exists (
    select 1
    from public.posts as posts
    join public.communities as communities on communities.id = posts.community_id
    where posts.id = p_post_id
      and posts.deleted_at is null
      and communities.status = 'approved'
      and communities.is_suspended = false
  ) then
    raise exception 'Post is not available';
  end if;

  select post_votes.direction into existing_direction
  from public.post_votes as post_votes
  where post_votes.post_id = p_post_id
    and post_votes.user_id = auth.uid()
  for update;

  if existing_direction = p_direction then
    delete from public.post_votes
    where post_votes.post_id = p_post_id
      and post_votes.user_id = auth.uid();

    current_direction := null;
  else
    insert into public.post_votes (post_id, user_id, direction)
    values (p_post_id, auth.uid(), p_direction)
    on conflict (post_id, user_id)
    do update set direction = excluded.direction,
                  updated_at = now();

    current_direction := p_direction;
  end if;

  perform public.recalculate_post_counters(p_post_id);

  select posts.score into current_score
  from public.posts as posts
  where posts.id = p_post_id;

  return next;
end;
$$;

create or replace function public.join_event_safely(p_event_id uuid)
returns table(participation_status text, participant_count integer, waitlist_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event public.events%rowtype;
  going_total integer;
  next_status text;
begin
  if auth.uid() is null or not public.current_user_is_active() then
    raise exception 'Authentication required';
  end if;

  select *
  into target_event
  from public.events as events
  where events.id = p_event_id
    and events.status = 'approved'
  for update;

  if target_event.id is null then
    raise exception 'Event is not available';
  end if;

  if target_event.lifecycle = 'canceled' then
    raise exception 'Canceled events cannot accept participants';
  end if;

  select count(*) into going_total
  from public.event_participants as event_participants
  where event_participants.event_id = p_event_id
    and event_participants.status = 'going';

  if target_event.capacity is not null and going_total >= target_event.capacity then
    next_status := 'waitlisted';
  else
    next_status := 'going';
  end if;

  insert into public.event_participants (event_id, user_id, status)
  values (p_event_id, auth.uid(), next_status)
  on conflict (event_id, user_id)
  do update set status = excluded.status;

  perform public.recalculate_event_counters(p_event_id);

  select events.participant_count, events.waitlist_count
  into participant_count, waitlist_count
  from public.events as events
  where events.id = p_event_id;

  participation_status := next_status;
  return next;
end;
$$;

create or replace function public.create_community_with_owner(
  p_name text,
  p_slug text,
  p_description text,
  p_image_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null or not public.current_user_is_active() then
    raise exception 'Authentication required';
  end if;

  insert into public.communities (name, slug, description, image_path, created_by, status)
  values (trim(p_name), trim(p_slug), trim(p_description), p_image_path, auth.uid(), 'pending')
  returning id into new_id;

  insert into public.community_members (community_id, user_id, role)
  values (new_id, auth.uid(), 'admin')
  on conflict (community_id, user_id) do update set role = excluded.role;

  perform public.recalculate_community_counters(new_id);
  return new_id;
end;
$$;

create or replace function public.create_poll_with_options(
  p_title text,
  p_description text default null,
  p_closes_at timestamptz default null,
  p_options text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
  option_label text;
  option_position integer := 0;
begin
  if auth.uid() is null or not public.can_publish_schoolwide() then
    raise exception 'Only authorized school staff can create polls';
  end if;

  if coalesce(array_length(p_options, 1), 0) < 2 then
    raise exception 'At least two poll options are required';
  end if;

  insert into public.polls (created_by, title, description, closes_at, status)
  values (auth.uid(), trim(p_title), nullif(trim(p_description), ''), p_closes_at, 'open')
  returning id into new_id;

  foreach option_label in array p_options loop
    if nullif(trim(option_label), '') is not null then
      insert into public.poll_options (poll_id, label, position)
      values (new_id, trim(option_label), option_position);
      option_position := option_position + 1;
    end if;
  end loop;

  return new_id;
end;
$$;

revoke all on function public.recalculate_post_counters(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_event_counters(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_community_counters(uuid) from public, anon, authenticated;
revoke all on function public.handle_post_counter_change() from public, anon, authenticated;
revoke all on function public.handle_report_counter_change() from public, anon, authenticated;
revoke all on function public.handle_event_participant_counter_change() from public, anon, authenticated;
revoke all on function public.handle_community_membership_counter_change() from public, anon, authenticated;
revoke all on function public.handle_post_write_counters() from public, anon, authenticated;
revoke all on function public.handle_event_write_counters() from public, anon, authenticated;
revoke all on function public.handle_activity_event_insert() from public, anon, authenticated;

revoke all on function public.record_activity(text, text, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.vote_post_safely(uuid, smallint) from public, anon, authenticated;
revoke all on function public.join_event_safely(uuid) from public, anon, authenticated;
revoke all on function public.create_community_with_owner(text, text, text, text) from public, anon, authenticated;
revoke all on function public.create_poll_with_options(text, text, timestamptz, text[]) from public, anon, authenticated;

grant execute on function public.record_activity(text, text, uuid, text, text, jsonb) to authenticated;
grant execute on function public.vote_post_safely(uuid, smallint) to authenticated;
grant execute on function public.join_event_safely(uuid) to authenticated;
grant execute on function public.create_community_with_owner(text, text, text, text) to authenticated;
grant execute on function public.create_poll_with_options(text, text, timestamptz, text[]) to authenticated;

create or replace view public.post_feed_view
with (security_invoker = true)
as
select
  posts.id,
  posts.community_id,
  posts.author_id,
  posts.title,
  posts.body,
  posts.created_at,
  posts.updated_at,
  posts.score,
  posts.upvote_count,
  posts.downvote_count,
  posts.comment_count,
  posts.report_count,
  posts.view_count,
  posts.activity_24h_count,
  posts.popularity_score,
  communities.name as community_name,
  communities.slug as community_slug,
  profiles.first_name as author_first_name,
  profiles.last_name as author_last_name,
  profiles.avatar_path as author_avatar_path
from public.posts as posts
join public.communities as communities on communities.id = posts.community_id
join public.profiles as profiles on profiles.id = posts.author_id
where posts.deleted_at is null
  and communities.status = 'approved'
  and communities.is_suspended = false;

create or replace view public.event_feed_view
with (security_invoker = true)
as
select
  events.id,
  events.community_id,
  events.created_by,
  events.title,
  events.description,
  events.event_date,
  events.start_time,
  events.location,
  events.image_url,
  events.lifecycle,
  events.capacity,
  events.participant_count,
  events.waitlist_count,
  events.view_count,
  events.activity_24h_count,
  events.trend_score,
  communities.name as community_name,
  communities.slug as community_slug
from public.events as events
left join public.communities as communities on communities.id = events.community_id
where events.status = 'approved'
  and events.lifecycle <> 'canceled';

create or replace view public.community_feed_view
with (security_invoker = true)
as
select
  communities.id,
  communities.name,
  communities.slug,
  communities.description,
  communities.image_path,
  communities.member_count,
  communities.follower_count,
  communities.post_count,
  communities.event_count,
  communities.view_count,
  communities.activity_24h_count,
  communities.trend_score,
  communities.created_at
from public.communities as communities
where communities.status = 'approved'
  and communities.is_suspended = false;

create or replace view public.home_summary_view
with (security_invoker = true)
as
select
  (
    select count(*)
    from public.events as events
    where events.status = 'approved'
      and events.lifecycle <> 'canceled'
      and events.event_date = current_date
  ) as today_event_count,
  (
    select count(*)
    from public.communities as communities
    where communities.status = 'approved'
      and communities.is_suspended = false
  ) as active_community_count,
  (
    select count(*)
    from public.event_participants as event_participants
    where event_participants.status = 'going'
  ) as participant_count,
  (
    select count(*)
    from public.posts as posts
    where posts.deleted_at is null
      and posts.created_at >= now() - interval '7 days'
  ) as week_post_count;

grant select on public.post_feed_view to authenticated;
grant select on public.event_feed_view to anon, authenticated;
grant select on public.community_feed_view to anon, authenticated;
grant select on public.home_summary_view to anon, authenticated;

do $$
declare
  row record;
begin
  for row in select id from public.posts loop
    perform public.recalculate_post_counters(row.id);
  end loop;

  for row in select id from public.events loop
    perform public.recalculate_event_counters(row.id);
  end loop;

  for row in select id from public.communities loop
    perform public.recalculate_community_counters(row.id);
  end loop;
end $$;
