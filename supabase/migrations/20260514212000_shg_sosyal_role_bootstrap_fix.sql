create or replace function public.is_service_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.role() = 'service_role', false)
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

-- Optional one-time bootstrap for the current local admin email.
alter table public.profiles disable trigger profiles_prevent_role_escalation;

update public.profiles
set role = 'admin'
where id in (
  select id
  from auth.users
  where lower(email) = lower('mr.eymen2011@gmail.com')
);

alter table public.profiles enable trigger profiles_prevent_role_escalation;
