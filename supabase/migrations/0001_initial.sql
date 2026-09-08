create extension if not exists pgcrypto;

create type public.room_type as enum ('general', 'college', 'department', 'subject', 'hostel', 'events');
create type public.report_status as enum ('open', 'dismissed', 'resolved');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, department text not null, year text not null, is_banned boolean not null default false, created_at timestamptz not null default now());
create table public.rooms (id uuid primary key default gen_random_uuid(), name text not null unique, description text, type public.room_type not null default 'general', created_at timestamptz not null default now());
create table public.posts (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, room_id uuid not null references public.rooms(id), content text not null check (char_length(content) between 1 and 500), is_deleted boolean not null default false, created_at timestamptz not null default now());
create table public.replies (id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, content text not null check (char_length(content) between 1 and 500), is_deleted boolean not null default false, created_at timestamptz not null default now());
create table public.reports (id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade, reporter_id uuid not null references public.profiles(id) on delete cascade, reason text not null, status public.report_status not null default 'open', created_at timestamptz not null default now());
create table public.bans (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, reason text not null, created_at timestamptz not null default now(), expires_at timestamptz);
create table public.reactions (id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, reaction text not null, created_at timestamptz not null default now(), unique(post_id, user_id, reaction));

create index posts_created_at_idx on public.posts(created_at desc);
create index posts_room_idx on public.posts(room_id, created_at desc);
create index replies_post_idx on public.replies(post_id, created_at asc);
create index reports_status_idx on public.reports(status, created_at desc);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.posts enable row level security;
alter table public.replies enable row level security;
alter table public.reports enable row level security;
alter table public.bans enable row level security;
alter table public.reactions enable row level security;

create policy "profiles own read" on public.profiles for select using (auth.uid() = id);
create policy "profiles own insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles own update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "rooms authenticated read" on public.rooms for select to authenticated using (true);
create policy "posts authenticated read" on public.posts for select to authenticated using (not is_deleted);
create policy "posts own insert" on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "posts own update" on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "replies authenticated read" on public.replies for select to authenticated using (not is_deleted);
create policy "replies own insert" on public.replies for insert to authenticated with check (auth.uid() = user_id);
create policy "replies own update" on public.replies for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reports own insert" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "reactions authenticated read" on public.reactions for select to authenticated using (true);
create policy "reactions own write" on public.reactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.rooms (name, description, type) values ('General', 'Campus-wide conversation', 'general'), ('College', 'KL University-wide updates', 'college'), ('Departments', 'Department conversations', 'department'), ('Subjects', 'Classes, assignments, and study help', 'subject'), ('Hostel', 'Hostel life and housing', 'hostel'), ('Events', 'Events and campus activities', 'events');
