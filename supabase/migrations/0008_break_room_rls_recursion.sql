create or replace function public.is_room_owner(target_room uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rooms
    where id = target_room and owner_id = target_user
  );
$$;

create or replace function public.is_approved_room_member(target_room uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_id = target_room and user_id = target_user and status = 'approved'
  );
$$;

revoke all on function public.is_room_owner(uuid, uuid) from public;
revoke all on function public.is_approved_room_member(uuid, uuid) from public;
grant execute on function public.is_room_owner(uuid, uuid) to authenticated;
grant execute on function public.is_approved_room_member(uuid, uuid) to authenticated;

drop policy if exists "public rooms visible" on public.rooms;
create policy "public rooms visible" on public.rooms
for select to authenticated
using (
  visibility = 'public'
  or (discoverable = true and visibility = 'private')
  or owner_id = auth.uid()
  or public.is_approved_room_member(id, auth.uid())
);

drop policy if exists "members read membership" on public.room_members;
create policy "members read membership" on public.room_members
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_room_owner(room_id, auth.uid())
);

drop policy if exists "owners approve room members" on public.room_members;
drop policy if exists "owners manage room members" on public.room_members;
create policy "owners manage room members" on public.room_members
for update to authenticated
using (public.is_room_owner(room_id, auth.uid()))
with check (status in ('pending', 'approved', 'blocked'));

drop policy if exists "users join discoverable rooms" on public.room_members;
drop policy if exists "users join public rooms" on public.room_members;
create policy "users join discoverable rooms" on public.room_members
for insert to authenticated
with check (
  auth.uid() = user_id
  and not public.current_user_is_banned()
  and exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and r.discoverable = true
      and (
        (r.visibility = 'public' and r.allow_join = true)
        or r.owner_id = auth.uid()
      )
  )
);

drop policy if exists "posts public or member read" on public.posts;
create policy "posts public or member read" on public.posts
for select to authenticated
using (
  not is_deleted
  and exists (
    select 1
    from public.rooms r
    where r.id = posts.room_id
      and (
        r.visibility = 'public'
        or r.owner_id = auth.uid()
        or public.is_approved_room_member(r.id, auth.uid())
      )
  )
);

drop policy if exists "posts own insert with room access" on public.posts;
create policy "posts own insert with room access" on public.posts
for insert to authenticated
with check (
  auth.uid() = user_id
  and not public.current_user_is_banned()
  and exists (
    select 1
    from public.rooms r
    where r.id = room_id
      and (
        r.visibility = 'public'
        or r.owner_id = auth.uid()
        or public.is_approved_room_member(r.id, auth.uid())
      )
  )
);
