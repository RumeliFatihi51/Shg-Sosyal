create table if not exists public.mobile_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null default 'android',
  device_id text,
  device_label text,
  app_version text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (token),
  unique (user_id, token)
);

drop trigger if exists mobile_push_tokens_touch_updated_at on public.mobile_push_tokens;
create trigger mobile_push_tokens_touch_updated_at
before update on public.mobile_push_tokens
for each row execute function public.touch_updated_at();

alter table public.mobile_push_tokens enable row level security;

drop policy if exists "Users read own mobile push tokens" on public.mobile_push_tokens;
create policy "Users read own mobile push tokens"
on public.mobile_push_tokens for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users create own mobile push tokens" on public.mobile_push_tokens;
create policy "Users create own mobile push tokens"
on public.mobile_push_tokens for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users update own mobile push tokens" on public.mobile_push_tokens;
create policy "Users update own mobile push tokens"
on public.mobile_push_tokens for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users delete own mobile push tokens" on public.mobile_push_tokens;
create policy "Users delete own mobile push tokens"
on public.mobile_push_tokens for delete
to authenticated
using (user_id = (select auth.uid()));

create index if not exists mobile_push_tokens_user_active_idx
on public.mobile_push_tokens(user_id, is_active, last_seen_at desc);

create index if not exists mobile_push_tokens_token_idx
on public.mobile_push_tokens(token);

grant select, insert, update, delete on public.mobile_push_tokens to authenticated;
