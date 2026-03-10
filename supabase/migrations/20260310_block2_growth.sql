-- BLOQUE 2: comunidad + escalado

-- Comentarios en tareas
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_created_idx
  on public.task_comments (task_id, created_at desc);

create index if not exists task_comments_user_created_idx
  on public.task_comments (user_id, created_at desc);

alter table public.task_comments enable row level security;

drop policy if exists "task_comments_select_authenticated" on public.task_comments;
create policy "task_comments_select_authenticated"
  on public.task_comments
  for select
  using (auth.uid() is not null);

drop policy if exists "task_comments_insert_own" on public.task_comments;
create policy "task_comments_insert_own"
  on public.task_comments
  for insert
  with check (auth.uid() = user_id);

