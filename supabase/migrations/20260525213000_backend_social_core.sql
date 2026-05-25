create extension if not exists pgcrypto;

alter type public.notification_type add value if not exists 'friend_accept';
alter type public.notification_type add value if not exists 'dm_message';

alter table public.profiles
  add column if not exists username text,
  add column if not exists tag text,
  add column if not exists email text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists last_seen_at timestamptz;

create unique index if not exists profiles_username_lower_unique
on public.profiles (lower(username))
where username is not null;

create unique index if not exists profiles_tag_lower_unique
on public.profiles (lower(tag))
where tag is not null;

create index if not exists profiles_username_idx on public.profiles (username);
create index if not exists profiles_tag_idx on public.profiles (tag);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists friendships_receiver_status_idx on public.friendships(receiver_id, status);
create index if not exists friendships_requester_status_idx on public.friendships(requester_id, status);
create index if not exists friendships_pair_status_idx on public.friendships(status, requester_id, receiver_id);
drop index if exists public.friendships_pair_unique;
with ranked_friendships as (
  select
    id,
    row_number() over (
      partition by least(requester_id, receiver_id), greatest(requester_id, receiver_id)
      order by
        case status
          when 'blocked' then 0
          when 'accepted' then 1
          when 'pending' then 2
          else 3
        end,
        updated_at desc nulls last,
        created_at desc nulls last
    ) as rn
  from public.friendships
  where status in ('pending', 'accepted', 'blocked')
)
delete from public.friendships f
using ranked_friendships r
where f.id = r.id
  and r.rn > 1;
create unique index if not exists friendships_pair_active_unique
  on public.friendships (least(requester_id, receiver_id), greatest(requester_id, receiver_id))
  where status in ('pending', 'accepted', 'blocked');
create index if not exists events_community_idx on public.events(community_id);
create index if not exists event_participants_event_idx on public.event_participants(event_id);
create index if not exists event_participants_user_idx on public.event_participants(user_id);
create index if not exists notifications_user_read_created_idx on public.notifications(user_id, read_at, created_at desc);

create or replace function public.normalize_username(input text)
returns text
language plpgsql
immutable
as $$
declare
  value text;
begin
  value := lower(coalesce(input, ''));
  value := replace(value, 'ş', 's');
  value := replace(value, 'ğ', 'g');
  value := replace(value, 'ü', 'u');
  value := replace(value, 'ö', 'o');
  value := replace(value, 'ç', 'c');
  value := replace(value, 'ı', 'i');
  value := replace(value, 'â', 'a');
  value := replace(value, 'î', 'i');
  value := replace(value, 'û', 'u');
  value := regexp_replace(value, '[^a-z0-9._]+', '', 'g');
  value := regexp_replace(value, '[._]{2,}', '.', 'g');
  value := trim(both '._' from value);

  if length(value) < 3 then
    value := 'ogrenci';
  end if;

  return left(value, 24);
end;
$$;

create or replace function public.profile_base_username(
  email text,
  first_name text,
  last_name text,
  user_id uuid
)
returns text
language plpgsql
immutable
as $$
declare
  base text;
begin
  base := public.normalize_username(
    coalesce(
      nullif(split_part(email, '@', 1), ''),
      nullif(concat_ws('.', first_name, last_name), ''),
      replace(user_id::text, '-', '')
    )
  );

  if length(base) < 3 then
    base := 'ogrenci';
  end if;

  return left(base, 24);
end;
$$;

create or replace function public.generate_unique_username(
  target_user_id uuid,
  requested_base text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  base text := public.normalize_username(requested_base);
  candidate text;
  suffix integer := 0;
  suffix_text text;
begin
  if length(base) < 3 then
    base := 'ogrenci';
  end if;

  loop
    suffix_text := case when suffix = 0 then '' else suffix::text end;
    candidate := left(base, 24 - length(suffix_text)) || suffix_text;

    if not exists (
      select 1
      from public.profiles
      where id <> target_user_id
        and lower(username) = lower(candidate)
    ) then
      return candidate;
    end if;

    suffix := suffix + 1;

    if suffix > 9999 then
      return left(base, 16) || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    end if;
  end loop;
end;
$$;

create or replace function public.sync_profile_identity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.username := public.generate_unique_username(
    new.id,
    coalesce(new.username, public.profile_base_username(new.email, new.first_name, new.last_name, new.id))
  );
  new.tag := '@' || new.username;
  return new;
end;
$$;

drop trigger if exists profiles_sync_identity on public.profiles;
create trigger profiles_sync_identity
before insert or update of username, email, first_name, last_name
on public.profiles
for each row execute function public.sync_profile_identity();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_name text := coalesce(new.raw_user_meta_data->>'first_name', '');
  last_name text := coalesce(new.raw_user_meta_data->>'last_name', '');
  base_username text := public.profile_base_username(new.email, first_name, last_name, new.id);
  generated_username text := public.generate_unique_username(new.id, base_username);
begin
  insert into public.profiles (
    id,
    first_name,
    last_name,
    class_name,
    school_number,
    email,
    username,
    tag,
    role
  )
  values (
    new.id,
    first_name,
    last_name,
    coalesce(new.raw_user_meta_data->>'class_name', ''),
    coalesce(new.raw_user_meta_data->>'school_number', ''),
    new.email,
    generated_username,
    '@' || generated_username,
    'student'
  )
  on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email),
      username = coalesce(public.profiles.username, excluded.username),
      tag = coalesce(public.profiles.tag, excluded.tag),
      updated_at = now();

  return new;
end;
$$;

do $$
declare
  auth_user record;
  base_username text;
  generated_username text;
begin
  for auth_user in
    select id, email, raw_user_meta_data, created_at
    from auth.users
  loop
    base_username := public.profile_base_username(
      auth_user.email,
      coalesce(auth_user.raw_user_meta_data->>'first_name', ''),
      coalesce(auth_user.raw_user_meta_data->>'last_name', ''),
      auth_user.id
    );
    generated_username := public.generate_unique_username(auth_user.id, base_username);

    insert into public.profiles (
      id,
      first_name,
      last_name,
      class_name,
      school_number,
      interests,
      email,
      username,
      tag,
      role,
      created_at,
      updated_at
    )
    values (
      auth_user.id,
      coalesce(auth_user.raw_user_meta_data->>'first_name', ''),
      coalesce(auth_user.raw_user_meta_data->>'last_name', ''),
      coalesce(auth_user.raw_user_meta_data->>'class_name', ''),
      coalesce(auth_user.raw_user_meta_data->>'school_number', ''),
      '{}'::text[],
      auth_user.email,
      generated_username,
      '@' || generated_username,
      'student',
      coalesce(auth_user.created_at, now()),
      now()
    )
    on conflict (id) do update
    set email = coalesce(public.profiles.email, excluded.email),
        username = coalesce(public.profiles.username, excluded.username),
        tag = coalesce(public.profiles.tag, excluded.tag),
        updated_at = now();
  end loop;
end;
$$;

create or replace function public.are_friends(left_user uuid, right_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships
    where status = 'accepted'
      and (
        (requester_id = left_user and receiver_id = right_user)
        or (requester_id = right_user and receiver_id = left_user)
      )
  )
$$;

create or replace function public.friendship_block_exists(left_user uuid, right_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships
    where status = 'blocked'
      and (
        (requester_id = left_user and receiver_id = right_user)
        or (requester_id = right_user and receiver_id = left_user)
      )
  )
$$;

drop policy if exists "Users see own friendships" on public.friendships;
drop policy if exists "Users send own friend requests" on public.friendships;
drop policy if exists "Receivers can answer friend requests" on public.friendships;
drop policy if exists "Users can remove own friendships" on public.friendships;

create policy "Users see own friendships"
on public.friendships for select
to authenticated
using (
  requester_id = (select auth.uid())
  or receiver_id = (select auth.uid())
  or public.is_admin_or_moderator()
);

create policy "Users send own friend requests"
on public.friendships for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and requester_id <> receiver_id
  and status = 'pending'
  and not public.friendship_block_exists(requester_id, receiver_id)
);

create policy "Receivers can answer friend requests"
on public.friendships for update
to authenticated
using (
  receiver_id = (select auth.uid())
  and status = 'pending'
)
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

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct')),
  direct_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member')),
  last_read_at timestamptz,
  muted boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  status text not null default 'sent' check (status in ('sent', 'edited', 'deleted')),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  constraint messages_content_valid check (
    deleted_at is not null
    or (content is not null and char_length(trim(content)) between 1 and 2000)
  )
);

alter table public.messages alter column content drop not null;
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages drop constraint if exists messages_content_valid;
alter table public.messages
  add constraint messages_content_valid check (
    deleted_at is not null
    or (content is not null and char_length(trim(content)) between 1 and 2000)
  );

drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
before update on public.conversations
for each row execute function public.touch_updated_at();

create index if not exists conversation_members_user_idx on public.conversation_members(user_id);
create index if not exists conversation_members_conversation_idx on public.conversation_members(conversation_id);
create index if not exists conversations_last_message_idx on public.conversations(last_message_at desc nulls last);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
create index if not exists messages_sender_idx on public.messages(sender_id);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = target_conversation_id
      and user_id = auth.uid()
  )
$$;

drop policy if exists "Users read own conversations" on public.conversations;
create policy "Users read own conversations"
on public.conversations for select
to authenticated
using (public.is_conversation_member(id));

drop policy if exists "Users read conversation members" on public.conversation_members;
create policy "Users read conversation members"
on public.conversation_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_conversation_member(conversation_id)
);

drop policy if exists "Users update own membership" on public.conversation_members;
create policy "Users update own membership"
on public.conversation_members for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Conversation members read messages" on public.messages;
create policy "Conversation members read messages"
on public.messages for select
to authenticated
using (public.is_conversation_member(conversation_id));

drop policy if exists "Conversation members send messages" on public.messages;
create policy "Conversation members send messages"
on public.messages for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and public.is_conversation_member(conversation_id)
  and deleted_at is null
);

drop policy if exists "Message authors update own messages" on public.messages;
create policy "Message authors update own messages"
on public.messages for update
to authenticated
using (
  sender_id = (select auth.uid())
  and public.is_conversation_member(conversation_id)
)
with check (
  sender_id = (select auth.uid())
  and public.is_conversation_member(conversation_id)
);

create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = coalesce(new.created_at, now()),
      updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists messages_update_conversation_last_message on public.messages;
create trigger messages_update_conversation_last_message
after insert on public.messages
for each row execute function public.update_conversation_last_message();

create or replace function public.start_direct_conversation(p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  conversation_id uuid;
  key text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_other_user is null or p_other_user = current_user_id then
    raise exception 'Invalid conversation target';
  end if;

  if public.friendship_block_exists(current_user_id, p_other_user) then
    raise exception 'Messaging is blocked';
  end if;

  if not public.are_friends(current_user_id, p_other_user) then
    raise exception 'Only friends can start direct conversations';
  end if;

  key := least(current_user_id::text, p_other_user::text) || ':' || greatest(current_user_id::text, p_other_user::text);

  insert into public.conversations (type, direct_key, last_message_at)
  values ('direct', key, now())
  on conflict (direct_key) do update
    set updated_at = now()
  returning id into conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (conversation_id, current_user_id),
    (conversation_id, p_other_user)
  on conflict (conversation_id, user_id) do nothing;

  return conversation_id;
end;
$$;

create or replace view public.direct_conversation_summaries
with (security_invoker = true)
as
select
  members.user_id,
  conversations.id as conversation_id,
  conversations.last_message_at,
  other_profiles.id as other_user_id,
  other_profiles.first_name as other_first_name,
  other_profiles.last_name as other_last_name,
  other_profiles.username as other_username,
  other_profiles.tag as other_tag,
  other_profiles.avatar_path as other_avatar_path,
  last_message.id as last_message_id,
  last_message.sender_id as last_message_sender_id,
  case
    when last_message.deleted_at is null then last_message.content
    else null
  end as last_message_content,
  last_message.created_at as last_message_created_at,
  (
    select count(*)::integer
    from public.messages unread_messages
    where unread_messages.conversation_id = conversations.id
      and unread_messages.sender_id <> members.user_id
      and unread_messages.deleted_at is null
      and (
        members.last_read_at is null
        or unread_messages.created_at > members.last_read_at
      )
  ) as unread_count
from public.conversation_members members
join public.conversations conversations on conversations.id = members.conversation_id
join public.conversation_members other_members
  on other_members.conversation_id = conversations.id
  and other_members.user_id <> members.user_id
join public.profiles other_profiles on other_profiles.id = other_members.user_id
left join lateral (
  select messages.*
  from public.messages messages
  where messages.conversation_id = conversations.id
  order by messages.created_at desc
  limit 1
) last_message on true
where conversations.type = 'direct';

grant select on public.direct_conversation_summaries to authenticated;

grant execute on function public.start_direct_conversation(uuid) to authenticated;
grant execute on function public.normalize_username(text) to authenticated;
grant execute on function public.are_friends(uuid, uuid) to authenticated;
grant execute on function public.friendship_block_exists(uuid, uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'messages'
     ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end;
$$;

revoke all on function public.generate_unique_username(uuid, text) from public, anon, authenticated;
revoke all on function public.profile_base_username(text, text, text, uuid) from public, anon, authenticated;
revoke all on function public.sync_profile_identity() from public, anon, authenticated;
revoke all on function public.update_conversation_last_message() from public, anon, authenticated;
