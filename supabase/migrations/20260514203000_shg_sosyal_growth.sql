alter type public.user_role add value if not exists 'teacher';

alter table public.profiles
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspension_reason text,
  add column if not exists participation_points integer not null default 0;

alter table public.communities
  add column if not exists rejection_reason text,
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspended_by uuid references public.profiles(id) on delete set null,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text;

alter table public.events
  add column if not exists lifecycle text not null default 'scheduled' check (lifecycle in ('scheduled', 'postponed', 'canceled')),
  add column if not exists capacity integer check (capacity is null or capacity > 0),
  add column if not exists rejection_reason text,
  add column if not exists cancellation_reason text,
  add column if not exists postponed_from_date date,
  add column if not exists postponed_from_time time;

alter table public.event_participants
  add column if not exists status text not null default 'going' check (status in ('going', 'waitlisted'));

alter table public.comments
  add column if not exists deleted_at timestamptz;

alter table public.notifications
  add column if not exists digest_key text;

alter table public.reports
  add column if not exists resolution_note text,
  add column if not exists resolved_by uuid references public.profiles(id) on delete set null,
  add column if not exists resolved_at timestamptz;

create unique index if not exists notifications_user_digest_unique
on public.notifications (user_id, digest_key)
where digest_key is not null;

create index if not exists post_votes_popularity_idx on public.post_votes(post_id, direction);
create index if not exists friendships_lookup_idx on public.friendships(status, requester_id, receiver_id);
create index if not exists community_feed_idx on public.posts(community_id, deleted_at, created_at desc);
create index if not exists admin_pending_events_idx on public.events(status, created_at);
create index if not exists admin_pending_communities_idx on public.communities(status, created_at);

create table if not exists public.community_followers (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  audience text not null default 'school' check (audience in ('school', 'students', 'teachers')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  point_threshold integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

drop trigger if exists announcements_touch_updated_at on public.announcements;
create trigger announcements_touch_updated_at
before update on public.announcements
for each row execute function public.touch_updated_at();

drop trigger if exists polls_touch_updated_at on public.polls;
create trigger polls_touch_updated_at
before update on public.polls
for each row execute function public.touch_updated_at();

create or replace function public.can_publish_schoolwide()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role()::text in ('admin', 'moderator', 'teacher'), false)
$$;

create or replace function public.prevent_admin_self_demotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'admin' and old.id = auth.uid() and new.role <> 'admin' then
    raise exception 'Admins cannot demote themselves';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_admin_self_demotion on public.profiles;
create trigger profiles_prevent_admin_self_demotion
before update on public.profiles
for each row execute function public.prevent_admin_self_demotion();

create or replace function public.award_event_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'going' then
    update public.profiles
    set participation_points = participation_points + 10
    where id = new.user_id;

    insert into public.user_badges (user_id, badge_id)
    select new.user_id, badges.id
    from public.badges
    join public.profiles on profiles.id = new.user_id
    where profiles.participation_points >= badges.point_threshold
    on conflict (user_id, badge_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists event_participants_award_points on public.event_participants;
create trigger event_participants_award_points
after insert on public.event_participants
for each row execute function public.award_event_points();

insert into public.badges (code, name, description, point_threshold)
values
  ('first_event', 'İlk Etkinlik', 'İlk etkinlik katılımını yaptı.', 10),
  ('campus_regular', 'Kampüs Müdavimi', 'En az 5 etkinlik katılımı yaptı.', 50),
  ('social_leader', 'Sosyal Lider', 'En az 10 etkinlik katılımı yaptı.', 100)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    point_threshold = excluded.point_threshold;

alter table public.community_followers enable row level security;
alter table public.announcements enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.audit_logs enable row level security;
alter table public.moderation_actions enable row level security;

create policy "Users can read own follows and community staff can inspect"
on public.community_followers for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_community_admin(community_id)
  or public.is_admin_or_moderator()
);

create policy "Users can follow approved communities"
on public.community_followers for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.communities
    where communities.id = community_followers.community_id
      and communities.status = 'approved'
      and communities.is_suspended = false
  )
);

create policy "Users can unfollow own communities"
on public.community_followers for delete
to authenticated
using (user_id = (select auth.uid()));

create policy "Authenticated users read announcements"
on public.announcements for select
to authenticated
using (true);

create policy "Teachers and staff create announcements"
on public.announcements for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and public.can_publish_schoolwide()
);

create policy "Announcement authors and staff update announcements"
on public.announcements for update
to authenticated
using (author_id = (select auth.uid()) or public.is_admin_or_moderator())
with check (author_id = (select auth.uid()) or public.is_admin_or_moderator());

create policy "Authenticated users read open polls"
on public.polls for select
to authenticated
using (status in ('open', 'closed') or created_by = (select auth.uid()) or public.is_admin_or_moderator());

create policy "Teachers and staff create polls"
on public.polls for insert
to authenticated
with check (created_by = (select auth.uid()) and public.can_publish_schoolwide());

create policy "Poll creators and staff update polls"
on public.polls for update
to authenticated
using (created_by = (select auth.uid()) or public.is_admin_or_moderator())
with check (created_by = (select auth.uid()) or public.is_admin_or_moderator());

create policy "Authenticated users read poll options"
on public.poll_options for select
to authenticated
using (
  exists (
    select 1 from public.polls
    where polls.id = poll_options.poll_id
      and polls.status in ('open', 'closed')
  )
  or public.is_admin_or_moderator()
);

create policy "Poll creators and staff manage options"
on public.poll_options for all
to authenticated
using (
  public.is_admin_or_moderator()
  or exists (
    select 1 from public.polls
    where polls.id = poll_options.poll_id
      and polls.created_by = (select auth.uid())
  )
)
with check (
  public.is_admin_or_moderator()
  or exists (
    select 1 from public.polls
    where polls.id = poll_options.poll_id
      and polls.created_by = (select auth.uid())
  )
);

create policy "Users read poll votes"
on public.poll_votes for select
to authenticated
using (true);

create policy "Users vote once per poll"
on public.poll_votes for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.polls
    where polls.id = poll_votes.poll_id
      and polls.status = 'open'
      and (polls.closes_at is null or polls.closes_at > now())
  )
);

create policy "Users update own poll votes"
on public.poll_votes for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Everyone authenticated reads badges"
on public.badges for select
to authenticated
using (true);

create policy "Users read earned badges"
on public.user_badges for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin_or_moderator());

create policy "Staff read audit logs"
on public.audit_logs for select
to authenticated
using (public.is_admin_or_moderator());

create policy "Staff create audit logs"
on public.audit_logs for insert
to authenticated
with check (public.is_admin_or_moderator() or public.can_publish_schoolwide());

create policy "Staff read moderation actions"
on public.moderation_actions for select
to authenticated
using (public.is_admin_or_moderator());

create policy "Staff create moderation actions"
on public.moderation_actions for insert
to authenticated
with check (public.is_admin_or_moderator());

drop policy if exists "Approved communities are public" on public.communities;
create policy "Approved communities are public"
on public.communities for select
to anon, authenticated
using (
  (
    status = 'approved'
    and is_suspended = false
  )
  or created_by = (select auth.uid())
  or public.is_admin_or_moderator()
);

drop policy if exists "Approved events are public" on public.events;
create policy "Approved scheduled events are public"
on public.events for select
to anon, authenticated
using (
  status = 'approved'
  or created_by = (select auth.uid())
  or public.is_admin_or_moderator()
  or public.is_community_admin(community_id)
);

drop policy if exists "Authenticated users can read posts in approved communities" on public.posts;
create policy "Authenticated users can read posts in approved communities"
on public.posts for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1 from public.communities
    where communities.id = posts.community_id
      and communities.status = 'approved'
      and communities.is_suspended = false
  )
);

drop policy if exists "Authenticated users can read comments" on public.comments;
create policy "Authenticated users can read comments"
on public.comments for select
to authenticated
using (
  comments.deleted_at is null
  and exists (
    select 1
    from public.posts
    join public.communities on communities.id = posts.community_id
    where posts.id = comments.post_id
      and posts.deleted_at is null
      and communities.status = 'approved'
      and communities.is_suspended = false
  )
);
