alter table public.profiles add column if not exists anonymous_label text;
alter table public.profiles alter column department set default 'Undeclared';
alter table public.profiles alter column year set default 'Undeclared';

update public.profiles
set anonymous_label = 'Anonymous #' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))
where anonymous_label is null;

alter table public.profiles alter column anonymous_label set not null;
alter table public.profiles add constraint profiles_anonymous_label_unique unique (anonymous_label);
