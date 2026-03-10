alter table if exists public.profiles
add column if not exists roles text[] not null default '{}';

