-- Backend security hardening for SHG Sosyal.
-- Focus: active-user guards, safer security-definer functions, stronger indexes,
-- and production-friendly grants for Supabase Data API access.

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select profiles.role
  from public.profiles as profiles
  where profiles.id = auth.uid()
$$;

create or replace function public.current_user_can_bootstrap_profile()
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
    true
  )
$$;

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

create or replace function public.is_service_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.role() = 'service_role', false)
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_user_is_active()
    and public.current_user_role() = 'admin',
    false
  )
$$;

create or replace function public.is_admin_or_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_user_is_active()
    and public.current_user_role() in ('admin', 'moderator'),
    false
  )
$$;

create or replace function public.can_publish_schoolwide()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_user_is_active()
    and public.current_user_role()::text in ('admin', 'moderator', 'teacher'),
    false
  )
$$;

create or replace function public.is_community_admin(target_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_is_active(), false)
    and exists (
      select 1
      from public.community_members as community_members
      where community_members.community_id = target_community_id
        and community_members.user_id = auth.uid()
        and community_members.role = 'admin'
    )
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_service_role() then
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;

  if old.role = 'admin' and old.id = auth.uid() and new.role <> 'admin' then
    raise exception 'Admins cannot demote themselves';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_admin_self_demotion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_service_role() then
    return new;
  end if;

  if old.role = 'admin' and old.id = auth.uid() and new.role <> 'admin' then
    raise exception 'Admins cannot demote themselves';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_approval_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and not (public.is_admin_or_moderator() or public.is_service_role()) then
    raise exception 'Only admins or moderators can change approval status';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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

create or replace function public.award_event_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'going' then
    update public.profiles
    set participation_points = participation_points + 10
    where id = new.user_id
      and is_suspended = false;

    insert into public.user_badges (user_id, badge_id)
    select new.user_id, badges.id
    from public.badges as badges
    join public.profiles as profiles on profiles.id = new.user_id
    where profiles.participation_points >= badges.point_threshold
      and profiles.is_suspended = false
    on conflict (user_id, badge_id) do nothing;
  end if;

  return new;
end;
$$;

-- Suspended accounts should not keep using authenticated Data API access.
drop policy if exists "Active users can access profiles" on public.profiles;
create policy "Active users can access profiles"
on public.profiles
as restrictive
for all
to authenticated
using (public.current_user_can_bootstrap_profile())
with check (public.current_user_can_bootstrap_profile());

drop policy if exists "Active users can access communities" on public.communities;
create policy "Active users can access communities"
on public.communities
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access community members" on public.community_members;
create policy "Active users can access community members"
on public.community_members
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access events" on public.events;
create policy "Active users can access events"
on public.events
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access event participants" on public.event_participants;
create policy "Active users can access event participants"
on public.event_participants
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access posts" on public.posts;
create policy "Active users can access posts"
on public.posts
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access comments" on public.comments;
create policy "Active users can access comments"
on public.comments
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access votes" on public.post_votes;
create policy "Active users can access votes"
on public.post_votes
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access notifications" on public.notifications;
create policy "Active users can access notifications"
on public.notifications
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access reports" on public.reports;
create policy "Active users can access reports"
on public.reports
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access friendships" on public.friendships;
create policy "Active users can access friendships"
on public.friendships
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access community follows" on public.community_followers;
create policy "Active users can access community follows"
on public.community_followers
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access announcements" on public.announcements;
create policy "Active users can access announcements"
on public.announcements
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access polls" on public.polls;
create policy "Active users can access polls"
on public.polls
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access poll options" on public.poll_options;
create policy "Active users can access poll options"
on public.poll_options
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access poll votes" on public.poll_votes;
create policy "Active users can access poll votes"
on public.poll_votes
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access badges" on public.badges;
create policy "Active users can access badges"
on public.badges
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access user badges" on public.user_badges;
create policy "Active users can access user badges"
on public.user_badges
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access audit logs" on public.audit_logs;
create policy "Active users can access audit logs"
on public.audit_logs
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

drop policy if exists "Active users can access moderation actions" on public.moderation_actions;
create policy "Active users can access moderation actions"
on public.moderation_actions
as restrictive
for all
to authenticated
using (public.current_user_is_active())
with check (public.current_user_is_active());

-- Data API grants are explicit; RLS still decides row-level access.
grant usage on schema public to anon, authenticated;
grant select on public.communities, public.events to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Keep SECURITY DEFINER trigger functions private, but allow RLS helper calls.
revoke all on function public.prevent_profile_role_escalation() from public, anon, authenticated;
revoke all on function public.prevent_admin_self_demotion() from public, anon, authenticated;
revoke all on function public.prevent_approval_escalation() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.award_event_points() from public, anon, authenticated;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.current_user_can_bootstrap_profile() to authenticated;
grant execute on function public.current_user_is_active() to authenticated;
grant execute on function public.is_service_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_admin_or_moderator() to anon, authenticated;
grant execute on function public.can_publish_schoolwide() to authenticated;
grant execute on function public.is_community_admin(uuid) to anon, authenticated;

-- Foreign-key and feed indexes for production-ish data sizes.
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_suspension_idx on public.profiles(is_suspended) where is_suspended = true;

create index if not exists communities_created_by_idx on public.communities(created_by);
create index if not exists communities_status_created_at_idx on public.communities(status, created_at desc);

create index if not exists community_members_user_id_idx on public.community_members(user_id);
create index if not exists community_members_role_idx on public.community_members(community_id, role);

create index if not exists events_community_id_idx on public.events(community_id);
create index if not exists events_created_by_idx on public.events(created_by);
create index if not exists events_public_calendar_idx on public.events(status, lifecycle, event_date, start_time);

create index if not exists event_participants_user_id_idx on public.event_participants(user_id);
create index if not exists event_participants_event_status_idx on public.event_participants(event_id, status);

create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_feed_search_idx on public.posts(community_id, deleted_at, created_at desc);

create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists comments_author_id_idx on public.comments(author_id);

create index if not exists post_votes_user_id_idx on public.post_votes(user_id);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at, created_at desc);

create index if not exists reports_reporter_id_idx on public.reports(reporter_id);
create index if not exists reports_target_idx on public.reports(target_type, target_id);
create index if not exists reports_status_created_at_idx on public.reports(status, created_at desc);

create index if not exists friendships_receiver_status_idx on public.friendships(receiver_id, status);
create index if not exists friendships_requester_status_idx on public.friendships(requester_id, status);

create index if not exists community_followers_user_id_idx on public.community_followers(user_id);
create index if not exists announcements_created_at_idx on public.announcements(created_at desc);
create index if not exists polls_status_closes_at_idx on public.polls(status, closes_at);
create index if not exists poll_options_poll_position_idx on public.poll_options(poll_id, position);
create index if not exists poll_votes_user_id_idx on public.poll_votes(user_id);
create index if not exists user_badges_user_id_idx on public.user_badges(user_id);
create index if not exists moderation_actions_report_id_idx on public.moderation_actions(report_id);
create index if not exists audit_logs_actor_created_at_idx on public.audit_logs(actor_id, created_at desc);
