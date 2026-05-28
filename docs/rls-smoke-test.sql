-- ŞHG Sosyal RLS smoke testleri
-- Supabase SQL Editor'da çalıştırmadan önce aşağıdaki UUID değerlerini
-- canlı projedeki gerçek kullanıcı ve konuşma kayıtlarıyla değiştir.
--
-- Beklenen test verisi:
-- - student_a ve student_b normal kullanıcı olsun.
-- - admin_user admin rolünde olsun.
-- - foreign_conversation student_a'nın üye olmadığı bir conversation olsun.
-- - foreign_friendship student_a'nın dahil olmadığı bir friendship olsun.

begin;

select set_config('shg.test.student_a', '00000000-0000-0000-0000-000000000001', true);
select set_config('shg.test.student_b', '00000000-0000-0000-0000-000000000002', true);
select set_config('shg.test.admin_user', '00000000-0000-0000-0000-000000000003', true);
select set_config('shg.test.foreign_conversation', '00000000-0000-0000-0000-000000000004', true);
select set_config('shg.test.foreign_friendship', '00000000-0000-0000-0000-000000000005', true);

do $$
begin
  if current_setting('shg.test.student_a') like '00000000-0000-0000-0000-00000000000%' then
    raise exception 'Önce docs/rls-smoke-test.sql içindeki örnek UUID değerlerini gerçek kayıtlarla değiştir.';
  end if;
end $$;

-- Student A olarak davran.
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('shg.test.student_a'), true);
set local role authenticated;

-- Student A, Student B profilini güncelleyememeli.
do $$
declare
  changed_count integer;
begin
  update public.profiles
  set bio = 'RLS test leak'
  where id = current_setting('shg.test.student_b')::uuid;

  get diagnostics changed_count = row_count;

  if changed_count <> 0 then
    raise exception 'RLS failed: student başka profili update edebiliyor.';
  end if;
end $$;

-- Student A, dahil olmadığı arkadaşlık kaydını okuyamamalı.
do $$
declare
  leaked_count integer;
begin
  select count(*) into leaked_count
  from public.friendships
  where id = current_setting('shg.test.foreign_friendship')::uuid;

  if leaked_count <> 0 then
    raise exception 'RLS failed: student başka arkadaşlık kaydını okuyabiliyor.';
  end if;
end $$;

-- Student A, üye olmadığı conversation mesajlarını okuyamamalı.
do $$
declare
  leaked_count integer;
begin
  select count(*) into leaked_count
  from public.messages
  where conversation_id = current_setting('shg.test.foreign_conversation')::uuid;

  if leaked_count <> 0 then
    raise exception 'RLS failed: student başka DM mesajlarını okuyabiliyor.';
  end if;
end $$;

-- Student A, üye olmadığı conversation'a mesaj yazamamalı.
do $$
begin
  insert into public.messages (conversation_id, sender_id, content)
  values (
    current_setting('shg.test.foreign_conversation')::uuid,
    current_setting('shg.test.student_a')::uuid,
    'RLS test message'
  );

  raise exception 'RLS failed: student üye olmadığı conversation''a mesaj yazabiliyor.';
exception
  when insufficient_privilege or check_violation or with_check_option_violation then
    null;
end $$;

-- Student A, audit logları okuyamamalı.
do $$
declare
  leaked_count integer;
begin
  select count(*) into leaked_count
  from public.audit_logs;

  if leaked_count <> 0 then
    raise exception 'RLS failed: student audit log okuyabiliyor.';
  end if;
end $$;

-- Admin olarak temel yönetim okuması yapılabilmeli.
reset role;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', current_setting('shg.test.admin_user'), true);
set local role authenticated;

do $$
declare
  user_count integer;
begin
  select count(*) into user_count
  from public.profiles;

  if user_count = 0 then
    raise exception 'Admin profiles okuyamıyor veya test admin kullanıcısı doğru değil.';
  end if;
end $$;

rollback;
