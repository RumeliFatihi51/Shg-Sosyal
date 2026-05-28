alter table public.notifications
  add column if not exists actor_id uuid references public.profiles(id) on delete set null,
  add column if not exists target_type text,
  add column if not exists target_id uuid,
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists occurrence_count integer not null default 1;

alter table public.notifications
  drop constraint if exists notifications_occurrence_count_positive;

alter table public.notifications
  add constraint notifications_occurrence_count_positive
  check (occurrence_count >= 1);

update public.notifications
set last_seen_at = coalesce(last_seen_at, created_at),
    occurrence_count = greatest(coalesce(occurrence_count, 1), 1);

create unique index if not exists notifications_user_digest_unique
on public.notifications (user_id, digest_key)
where digest_key is not null;

create index if not exists notifications_user_last_seen_idx
on public.notifications(user_id, last_seen_at desc);

create index if not exists notifications_actor_created_idx
on public.notifications(actor_id, created_at desc)
where actor_id is not null;

create index if not exists notifications_target_idx
on public.notifications(target_type, target_id)
where target_type is not null and target_id is not null;

grant select, insert, update, delete on public.notifications to authenticated;
