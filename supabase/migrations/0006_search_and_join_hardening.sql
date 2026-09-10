create unique index if not exists rooms_owner_name_unique on public.rooms(owner_id, lower(name)) where owner_id is not null;

drop policy if exists "users join public rooms" on public.room_members;
create policy "users join discoverable rooms" on public.room_members for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.rooms r where r.id = room_id and r.discoverable = true and (r.visibility = 'public' and r.allow_join = true or r.visibility = 'private')));
create policy "owners manage room members" on public.room_members for update to authenticated using (exists (select 1 from public.rooms r where r.id = room_id and r.owner_id = auth.uid())) with check (true);

drop policy if exists "conversation members read own" on public.conversation_members;
create policy "conversation members read own" on public.conversation_members for select to authenticated using (user_id = auth.uid());

create or replace function public.search_anonymous_users(search_term text default '')
returns table (anonymous_label text)
language sql security definer set search_path = public
as $$
  select p.anonymous_label
  from public.profiles p
  where p.id <> auth.uid() and p.anonymous_label ilike '%' || left(search_term, 80) || '%'
  order by p.anonymous_label limit 20;
$$;
revoke all on function public.search_anonymous_users(text) from public;
grant execute on function public.search_anonymous_users(text) to authenticated;

create or replace function public.start_conversation(target_label text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare target_id uuid; conversation_id uuid;
begin
  select id into target_id from public.profiles where anonymous_label = target_label and id <> auth.uid();
  if target_id is null then raise exception 'Anonymous user not found'; end if;
  select cm1.conversation_id into conversation_id
  from public.conversation_members cm1 join public.conversation_members cm2 on cm2.conversation_id = cm1.conversation_id
  where cm1.user_id = auth.uid() and cm2.user_id = target_id limit 1;
  if conversation_id is null then
    insert into public.conversations default values returning id into conversation_id;
    insert into public.conversation_members(conversation_id, user_id) values (conversation_id, auth.uid()), (conversation_id, target_id);
  end if;
  return conversation_id;
end;
$$;
revoke all on function public.start_conversation(text) from public;
grant execute on function public.start_conversation(text) to authenticated;
