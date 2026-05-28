create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint),
  unique (user_id, endpoint)
);

drop trigger if exists push_subscriptions_touch_updated_at on public.push_subscriptions;
create trigger push_subscriptions_touch_updated_at
before update on public.push_subscriptions
for each row execute function public.touch_updated_at();

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users read own push subscriptions" on public.push_subscriptions;
create policy "Users read own push subscriptions"
on public.push_subscriptions for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users create own push subscriptions" on public.push_subscriptions;
create policy "Users create own push subscriptions"
on public.push_subscriptions for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users update own push subscriptions" on public.push_subscriptions;
create policy "Users update own push subscriptions"
on public.push_subscriptions for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users delete own push subscriptions" on public.push_subscriptions;
create policy "Users delete own push subscriptions"
on public.push_subscriptions for delete
to authenticated
using (user_id = (select auth.uid()));

create index if not exists push_subscriptions_user_active_idx
on public.push_subscriptions(user_id, is_active, last_seen_at desc);

create index if not exists push_subscriptions_endpoint_idx
on public.push_subscriptions(endpoint);

grant select, insert, update, delete on public.push_subscriptions to authenticated;
