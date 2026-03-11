-- Permite que maintainers/admin creen notificaciones para otros usuarios
-- (ej. al aprobar/rechazar solicitudes), manteniendo inserción propia.

alter table if exists public.notifications
  enable row level security;

drop policy if exists "notifications_insert_own" on public.notifications;
drop policy if exists "notifications_insert_own_or_reviewer" on public.notifications;

create policy "notifications_insert_own_or_reviewer"
  on public.notifications
  for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role, '')) in ('admin', 'maintainer')
    )
  );
