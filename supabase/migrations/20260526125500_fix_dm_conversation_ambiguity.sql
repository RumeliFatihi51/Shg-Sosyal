create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = auth.uid()
  )
$$;

create or replace function public.start_direct_conversation(p_other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_conversation_id uuid;
  v_direct_key text;
begin
  if v_current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_other_user is null or p_other_user = v_current_user_id then
    raise exception 'Invalid conversation target';
  end if;

  if public.friendship_block_exists(v_current_user_id, p_other_user) then
    raise exception 'Messaging is blocked';
  end if;

  if not public.are_friends(v_current_user_id, p_other_user) then
    raise exception 'Only friends can start direct conversations';
  end if;

  v_direct_key :=
    least(v_current_user_id::text, p_other_user::text)
    || ':'
    || greatest(v_current_user_id::text, p_other_user::text);

  insert into public.conversations as c (type, direct_key, last_message_at)
  values ('direct', v_direct_key, now())
  on conflict (direct_key) do update
    set updated_at = now()
  returning c.id into v_conversation_id;

  insert into public.conversation_members as cm (conversation_id, user_id)
  values
    (v_conversation_id, v_current_user_id),
    (v_conversation_id, p_other_user)
  on conflict (conversation_id, user_id) do nothing;

  return v_conversation_id;
end;
$$;

grant execute on function public.start_direct_conversation(uuid) to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;
