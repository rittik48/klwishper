alter table public.rooms add column if not exists owner_id uuid references public.profiles(id) on delete set null;
alter table public.profiles alter column department set default 'Undeclared';
alter table public.profiles alter column year set default 'Undeclared';
alter table public.profiles alter column anonymous_label set default 'Anonymous #' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

drop policy if exists "rooms authenticated insert" on public.rooms;
create policy "rooms authenticated insert" on public.rooms for insert to authenticated with check (auth.uid() = owner_id);
create policy "rooms owner delete" on public.rooms for delete to authenticated using (auth.uid() = owner_id);