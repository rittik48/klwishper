alter table public.rooms add column if not exists visibility text not null default 'public' check (visibility in ('public', 'private'));
alter table public.rooms add column if not exists discoverable boolean not null default true;
alter table public.rooms add column if not exists allow_join boolean not null default true;

update public.rooms set visibility = 'public', discoverable = true, allow_join = true where visibility is null;

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'approved' check (status in ('pending', 'approved', 'blocked')),
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists room_members_user_idx on public.room_members(user_id, room_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

alter table public.room_members enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "rooms authenticated read" on public.rooms;
drop policy if exists "public rooms visible" on public.rooms;
create policy "public rooms visible" on public.rooms for select to authenticated using (visibility = 'public' or (discoverable = true and visibility = 'private') or owner_id = auth.uid() or exists (select 1 from public.room_members m where m.room_id = rooms.id and m.user_id = auth.uid() and m.status = 'approved'));
create policy "users join public rooms" on public.room_members for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.rooms r where r.id = room_id and (r.owner_id = auth.uid() or (r.visibility = 'public' and r.allow_join = true))));
create policy "members read membership" on public.room_members for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.rooms r where r.id = room_id and r.owner_id = auth.uid()));
drop policy if exists "conversation members read own" on public.conversation_members;
create policy "conversation members read own" on public.conversation_members for select to authenticated using (user_id = auth.uid());
drop policy if exists "conversation members insert self" on public.conversation_members;
create policy "messages participants read" on public.messages for select to authenticated using (exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()));
create policy "messages participants insert" on public.messages for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()));

 drop policy if exists "posts authenticated read" on public.posts;
create policy "posts public or member read" on public.posts for select to authenticated using (not is_deleted and exists (select 1 from public.rooms r where r.id = posts.room_id and (r.visibility = 'public' or r.owner_id = auth.uid() or exists (select 1 from public.room_members m where m.room_id = r.id and m.user_id = auth.uid() and m.status = 'approved'))));
drop policy if exists "posts own insert" on public.posts;
create policy "posts own insert with room access" on public.posts for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.rooms r where r.id = room_id and (r.visibility = 'public' or r.owner_id = auth.uid() or exists (select 1 from public.room_members m where m.room_id = r.id and m.user_id = auth.uid() and m.status = 'approved'))));

create or replace function public.public_feed(page_size integer default 50)
returns table (id uuid, content text, created_at timestamptz, room_id uuid, room_name text, anonymous_label text)
language sql security definer set search_path = public
as $$
  select p.id, p.content, p.created_at, p.room_id, r.name, coalesce(pr.anonymous_label, 'Anonymous')
  from public.posts p join public.rooms r on r.id = p.room_id join public.profiles pr on pr.id = p.user_id
  where p.is_deleted = false and r.visibility = 'public'
  order by p.created_at desc limit least(greatest(page_size, 1), 100);
$$;
revoke all on function public.public_feed(integer) from public;
grant execute on function public.public_feed(integer) to authenticated;

create or replace function public.search_public_rooms(search_term text default '')
returns table (id uuid, name text, description text, type public.room_type, visibility text, discoverable boolean, allow_join boolean, owner_id uuid)
language sql security definer set search_path = public
as $$
  select r.id, r.name, r.description, r.type, r.visibility, r.discoverable, r.allow_join, r.owner_id
  from public.rooms r
  where r.discoverable = true and (r.visibility = 'public' or r.owner_id = auth.uid() or exists (select 1 from public.room_members m where m.room_id = r.id and m.user_id = auth.uid()))
    and (search_term = '' or r.name ilike '%' || search_term || '%' or coalesce(r.description, '') ilike '%' || search_term || '%')
  order by r.name limit 50;
$$;
revoke all on function public.search_public_rooms(text) from public;
grant execute on function public.search_public_rooms(text) to authenticated;

create or replace function public.start_conversation(target_label text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare target_id uuid; conversation_id uuid;
begin
  select id into target_id from public.profiles where anonymous_label = target_label and id <> auth.uid();
  if target_id is null then raise exception 'Anonymous user not found'; end if;
  insert into public.conversations default values returning id into conversation_id;
  insert into public.conversation_members(conversation_id, user_id) values (conversation_id, auth.uid()), (conversation_id, target_id);
  return conversation_id;
end;
$$;
revoke all on function public.start_conversation(text) from public;
grant execute on function public.start_conversation(text) to authenticated;

create or replace function public.conversation_messages(target_conversation uuid)
returns table (id uuid, content text, created_at timestamptz, anonymous_label text)
language sql security definer set search_path = public
as $$
  select m.id, m.content, m.created_at, coalesce(p.anonymous_label, 'Anonymous')
  from public.messages m join public.profiles p on p.id = m.sender_id
  where m.conversation_id = target_conversation and exists (select 1 from public.conversation_members cm where cm.conversation_id = m.conversation_id and cm.user_id = auth.uid())
  order by m.created_at limit 100;
$$;
revoke all on function public.conversation_messages(uuid) from public;
grant execute on function public.conversation_messages(uuid) to authenticated;
