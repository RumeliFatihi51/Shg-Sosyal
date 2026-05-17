create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'community_admin', 'moderator', 'admin');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.friendship_status as enum ('pending', 'accepted', 'rejected', 'blocked');
create type public.report_status as enum ('open', 'reviewed', 'dismissed');
create type public.notification_type as enum (
  'community_post',
  'event_reminder',
  'post_comment',
  'daily_events',
  'admin_decision',
  'friend_request'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  class_name text,
  school_number text,
  interests text[] not null default '{}',
  avatar_path text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  image_path text,
  status public.approval_status not null default 'pending',
  created_by uuid not null references public.profiles(id) on delete cascade,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  event_date date not null,
  start_time time not null,
  location text not null,
  image_url text,
  status public.approval_status not null default 'pending',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  direction smallint not null check (direction in (-1, 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'event', 'community')),
  target_id uuid not null,
  reason text not null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> receiver_id),
  unique (requester_id, receiver_id)
);

create unique index friendships_pair_unique
on public.friendships (least(requester_id, receiver_id), greatest(requester_id, receiver_id));

create index communities_status_idx on public.communities(status);
create index events_status_date_idx on public.events(status, event_date);
create index posts_community_created_idx on public.posts(community_id, created_at desc);
create index comments_post_created_idx on public.comments(post_id, created_at);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index reports_status_created_idx on public.reports(status, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger communities_touch_updated_at
before update on public.communities
for each row execute function public.touch_updated_at();

create trigger events_touch_updated_at
before update on public.events
for each row execute function public.touch_updated_at();

create trigger posts_touch_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

create trigger comments_touch_updated_at
before update on public.comments
for each row execute function public.touch_updated_at();

create trigger post_votes_touch_updated_at
before update on public.post_votes
for each row execute function public.touch_updated_at();

create trigger reports_touch_updated_at
before update on public.reports
for each row execute function public.touch_updated_at();

create trigger friendships_touch_updated_at
before update on public.friendships
for each row execute function public.touch_updated_at();

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_admin_or_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'moderator'), false)
$$;

create or replace function public.is_service_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.role() = 'service_role', false)
$$;

create or replace function public.is_community_admin(target_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members
    where community_id = target_community_id
      and user_id = auth.uid()
      and role = 'admin'
  )
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not (public.is_admin() or public.is_service_role()) then
    raise exception 'Only admins can change roles';
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create or replace function public.prevent_approval_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and not (public.is_admin_or_moderator() or public.is_service_role()) then
    raise exception 'Only admins or moderators can change approval status';
  end if;

  return new;
end;
$$;

create trigger communities_prevent_approval_escalation
before update on public.communities
for each row execute function public.prevent_approval_escalation();

create trigger events_prevent_approval_escalation
before update on public.events
for each row execute function public.prevent_approval_escalation();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, class_name, school_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'class_name', ''),
    coalesce(new.raw_user_meta_data ->> 'school_number', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.friendships enable row level security;

create policy "Authenticated users can read profiles"
on public.profiles for select
to authenticated
using (true);

create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id or public.is_admin())
with check ((select auth.uid()) = id or public.is_admin());

create policy "Approved communities are public"
on public.communities for select
to anon, authenticated
using (
  status = 'approved'
  or created_by = (select auth.uid())
  or public.is_admin_or_moderator()
);

create policy "Authenticated users can request communities"
on public.communities for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'pending'
);

create policy "Community owners and staff can update communities"
on public.communities for update
to authenticated
using (
  created_by = (select auth.uid())
  or public.is_community_admin(id)
  or public.is_admin_or_moderator()
)
with check (
  created_by = (select auth.uid())
  or public.is_community_admin(id)
  or public.is_admin_or_moderator()
);

create policy "Authenticated users can read community members"
on public.community_members for select
to authenticated
using (
  exists (
    select 1 from public.communities
    where communities.id = community_members.community_id
      and communities.status = 'approved'
  )
  or user_id = (select auth.uid())
  or public.is_admin_or_moderator()
);

create policy "Users can join approved communities"
on public.community_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    exists (
      select 1 from public.communities
      where communities.id = community_members.community_id
        and communities.status = 'approved'
    )
    or exists (
      select 1 from public.communities
      where communities.id = community_members.community_id
        and communities.created_by = (select auth.uid())
        and communities.status = 'pending'
        and community_members.role = 'admin'
    )
  )
);

create policy "Users can leave member role"
on public.community_members for delete
to authenticated
using (
  user_id = (select auth.uid())
  and role = 'member'
);

create policy "Staff can manage community members"
on public.community_members for all
to authenticated
using (public.is_admin_or_moderator() or public.is_community_admin(community_id))
with check (public.is_admin_or_moderator() or public.is_community_admin(community_id));

create policy "Approved events are public"
on public.events for select
to anon, authenticated
using (
  status = 'approved'
  or created_by = (select auth.uid())
  or public.is_admin_or_moderator()
  or public.is_community_admin(community_id)
);

create policy "Authenticated users can create pending events"
on public.events for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'pending'
  and (
    community_id is null
    or public.is_community_admin(community_id)
    or public.is_admin_or_moderator()
  )
);

create policy "Owners and staff can update events"
on public.events for update
to authenticated
using (
  created_by = (select auth.uid())
  or public.is_community_admin(community_id)
  or public.is_admin_or_moderator()
)
with check (
  created_by = (select auth.uid())
  or public.is_community_admin(community_id)
  or public.is_admin_or_moderator()
);

create policy "Authenticated users can view participants of approved events"
on public.event_participants for select
to authenticated
using (
  exists (
    select 1 from public.events
    where events.id = event_participants.event_id
      and events.status = 'approved'
  )
  or user_id = (select auth.uid())
  or public.is_admin_or_moderator()
);

create policy "Users can join approved events"
on public.event_participants for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.events
    where events.id = event_participants.event_id
      and events.status = 'approved'
  )
);

create policy "Users can leave events"
on public.event_participants for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin_or_moderator());

create policy "Authenticated users can read posts in approved communities"
on public.posts for select
to authenticated
using (
  deleted_at is null
  and exists (
    select 1 from public.communities
    where communities.id = posts.community_id
      and communities.status = 'approved'
  )
);

create policy "Community members can create posts"
on public.posts for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.community_members
    join public.communities on communities.id = community_members.community_id
    where community_members.community_id = posts.community_id
      and community_members.user_id = (select auth.uid())
      and communities.status = 'approved'
  )
);

create policy "Post authors and community staff can update posts"
on public.posts for update
to authenticated
using (
  author_id = (select auth.uid())
  or public.is_community_admin(community_id)
  or public.is_admin_or_moderator()
)
with check (
  author_id = (select auth.uid())
  or public.is_community_admin(community_id)
  or public.is_admin_or_moderator()
);

create policy "Post authors and staff can delete posts"
on public.posts for delete
to authenticated
using (
  author_id = (select auth.uid())
  or public.is_community_admin(community_id)
  or public.is_admin_or_moderator()
);

create policy "Authenticated users can read comments"
on public.comments for select
to authenticated
using (
  exists (
    select 1
    from public.posts
    join public.communities on communities.id = posts.community_id
    where posts.id = comments.post_id
      and posts.deleted_at is null
      and communities.status = 'approved'
  )
);

create policy "Authenticated users can comment"
on public.comments for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.posts
    join public.communities on communities.id = posts.community_id
    where posts.id = comments.post_id
      and posts.deleted_at is null
      and communities.status = 'approved'
  )
);

create policy "Comment authors and staff can delete comments"
on public.comments for delete
to authenticated
using (
  author_id = (select auth.uid())
  or public.is_admin_or_moderator()
);

create policy "Authenticated users can read votes"
on public.post_votes for select
to authenticated
using (true);

create policy "Users manage own votes"
on public.post_votes for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users read own notifications"
on public.notifications for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users update own notifications"
on public.notifications for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Users can report content"
on public.reports for insert
to authenticated
with check (reporter_id = (select auth.uid()));

create policy "Staff can read reports"
on public.reports for select
to authenticated
using (public.is_admin_or_moderator() or reporter_id = (select auth.uid()));

create policy "Staff can update reports"
on public.reports for update
to authenticated
using (public.is_admin_or_moderator())
with check (public.is_admin_or_moderator());

create policy "Users see own friendships"
on public.friendships for select
to authenticated
using (
  requester_id = (select auth.uid())
  or receiver_id = (select auth.uid())
);

create policy "Users send own friend requests"
on public.friendships for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and status = 'pending'
);

create policy "Receivers can answer friend requests"
on public.friendships for update
to authenticated
using (receiver_id = (select auth.uid()))
with check (
  receiver_id = (select auth.uid())
  and status in ('accepted', 'rejected', 'blocked')
);

create policy "Users can remove own friendships"
on public.friendships for delete
to authenticated
using (
  requester_id = (select auth.uid())
  or receiver_id = (select auth.uid())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('event-images', 'event-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('community-images', 'community-images', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read event images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'event-images');

create policy "Authenticated users can read private social images"
on storage.objects for select
to authenticated
using (bucket_id in ('avatars', 'community-images'));

create policy "Users can upload own images"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('event-images', 'avatars', 'community-images')
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "Users can update own images"
on storage.objects for update
to authenticated
using (
  bucket_id in ('event-images', 'avatars', 'community-images')
  and (storage.foldername(name))[2] = (select auth.uid())::text
)
with check (
  bucket_id in ('event-images', 'avatars', 'community-images')
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy "Users can delete own images"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('event-images', 'avatars', 'community-images')
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
