create or replace view public.production_readiness_checks
with (security_invoker = true)
as
select
  'profiles_table'::text as key,
  'profiles tablosu'::text as label,
  (to_regclass('public.profiles') is not null) as ok,
  'critical'::text as severity,
  'Temel MVP migration dosyasini calistir.'::text as fix_hint
union all
select
  'profile_trigger',
  'auth.users -> profiles trigger',
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'on_auth_user_created'
      and not t.tgisinternal
  ),
  'critical',
  'Profile trigger eksikse backend_social_core migration dosyasini tekrar calistir.'
union all
select
  'username_tag_columns',
  'username ve tag alanlari',
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'username'
  )
  and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'tag'
  ),
  'critical',
  'backend_social_core migration dosyasini calistir.'
union all
select
  'friendships_table',
  'arkadaslik tablosu',
  (to_regclass('public.friendships') is not null),
  'critical',
  'Temel MVP ve backend_social_core migration dosyalarini calistir.'
union all
select
  'dm_tables',
  'DM tablolari',
  (to_regclass('public.conversations') is not null)
    and (to_regclass('public.conversation_members') is not null)
    and (to_regclass('public.messages') is not null),
  'critical',
  'backend_social_core migration dosyasini calistir.'
union all
select
  'dm_rpc',
  'start_direct_conversation RPC',
  (to_regprocedure('public.start_direct_conversation(uuid)') is not null),
  'critical',
  'backend_social_core ve fix_dm_conversation_ambiguity migration dosyalarini calistir.'
union all
select
  'dm_ambiguity_fix',
  'DM conversation_id ambiguity fix',
  case
    when to_regprocedure('public.start_direct_conversation(uuid)') is null then false
    else pg_get_functiondef(to_regprocedure('public.start_direct_conversation(uuid)')) like '%v_conversation_id%'
  end,
  'critical',
  '20260526125500_fix_dm_conversation_ambiguity.sql dosyasini calistir.'
union all
select
  'messages_rls',
  'messages RLS aktif',
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'messages'
      and c.relrowsecurity
  ),
  'critical',
  'backend_social_core migration dosyasini calistir.'
union all
select
  'rewards_tables',
  'puan ve rozet tablolari',
  (to_regclass('public.user_points') is not null)
    and (to_regclass('public.point_events') is not null)
    and (to_regclass('public.badges') is not null)
    and (to_regclass('public.user_badges') is not null),
  'warning',
  'engagement_rewards_calendar_core migration dosyasini calistir.'
union all
select
  'leaderboard_views',
  'siralama viewleri',
  (to_regclass('public.daily_leaderboard') is not null)
    and (to_regclass('public.weekly_leaderboard') is not null)
    and (to_regclass('public.all_time_leaderboard') is not null),
  'warning',
  'engagement_rewards_calendar_core migration dosyasini calistir.'
union all
select
  'audit_logs',
  'audit log tablosu',
  (to_regclass('public.audit_logs') is not null),
  'warning',
  'shg_sosyal_growth veya backend_security_hardening migration dosyasini calistir.'
union all
select
  'notifications_digest_unique',
  'bildirim digest tekilligi',
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'notifications'
      and indexname = 'notifications_user_digest_unique'
  ),
  'warning',
  'notification_digest_hardening migration dosyasini calistir.'
union all
select
  'notifications_delivery_columns',
  'bildirim tekrar sayaci',
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'last_seen_at'
  )
  and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'occurrence_count'
  ),
  'warning',
  '20260528154500_notification_digest_hardening.sql dosyasini calistir.'
union all
select
  'push_subscriptions',
  'PWA push abonelikleri',
  (to_regclass('public.push_subscriptions') is not null),
  'warning',
  '20260528161000_pwa_push_subscriptions.sql dosyasini calistir.'
union all
select
  'push_subscriptions_rls',
  'PWA push abonelikleri RLS',
  exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'push_subscriptions'
      and c.relrowsecurity
  ),
  'warning',
  '20260528161000_pwa_push_subscriptions.sql dosyasini calistir.'
union all
select
  'data_api_grants',
  'authenticated Data API grantleri',
  case
    when to_regclass('public.profiles') is null
      or to_regclass('public.events') is null
      or to_regclass('public.notifications') is null
      then false
    else
      has_table_privilege('authenticated', 'public.profiles', 'SELECT')
      and has_table_privilege('authenticated', 'public.events', 'SELECT')
      and has_table_privilege('authenticated', 'public.notifications', 'SELECT')
  end,
  'warning',
  'backend_security_hardening migration dosyasini calistir.';

grant select on public.production_readiness_checks to authenticated;
