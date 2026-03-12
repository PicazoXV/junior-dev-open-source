-- Reset global de tareas "de fábrica":
-- - sin solicitudes
-- - sin asignaciones
-- - estado open
-- - limpia enlaces/ids de issue/PR si existen columnas

begin;

do $$
declare
  v_sql text;
begin
  if to_regclass('public.task_requests') is not null then
    delete from public.task_requests;
  end if;

  if to_regclass('public.task_comments') is not null then
    delete from public.task_comments;
  end if;

  v_sql := 'update public.tasks set status = ''open''';

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'assigned_to'
  ) then
    v_sql := v_sql || ', assigned_to = null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'github_issue_url'
  ) then
    v_sql := v_sql || ', github_issue_url = null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'github_issue_number'
  ) then
    v_sql := v_sql || ', github_issue_number = null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'github_pr_url'
  ) then
    v_sql := v_sql || ', github_pr_url = null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'github_pr_number'
  ) then
    v_sql := v_sql || ', github_pr_number = null';
  end if;

  execute v_sql;
end
$$;

commit;

-- Verificación:
-- select status, assigned_to, github_issue_url, github_pr_url from public.tasks limit 25;
-- select count(*) from public.task_requests;
