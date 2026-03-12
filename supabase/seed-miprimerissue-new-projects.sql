-- Seed principal MiPrimerIssue:
-- 1) Elimina proyectos antiguos "Habit Tracker" y "Dev Jobs Board" (y sus dependencias)
-- 2) Crea/actualiza 3 proyectos nuevos:
--    - snippet-vault
--    - readme-studio
--    - devhabit-tracker
-- 3) Crea/actualiza 15 tareas reales (5 por repo) tomando como referencia /tasks del repo
--
-- Ejecutar en Supabase SQL Editor.
-- Idempotente: no duplica por (project_slug + task_title).

begin;

do $$
declare
  v_created_by uuid;
  v_old_project_ids uuid[];
  v_project_id uuid;
  v_has_estimated_minutes boolean;
  v_has_learning_resources boolean;
  v_task_exists boolean;
  v_project record;
  v_task record;
begin
  -- 1) Resolver created_by (admin/maintainer; fallback primer perfil)
  select p.id
    into v_created_by
  from public.profiles p
  where lower(coalesce(p.role, '')) in ('admin', 'maintainer')
  order by p.created_at asc nulls last
  limit 1;

  if v_created_by is null then
    select p.id
      into v_created_by
    from public.profiles p
    order by p.created_at asc nulls last
    limit 1;
  end if;

  if v_created_by is null then
    raise exception 'No hay perfiles en public.profiles. Crea primero un usuario/perfil.';
  end if;

  -- 2) Eliminar proyectos antiguos (habit tracker / dev jobs board)
  select array_agg(p.id)
    into v_old_project_ids
  from public.projects p
  where lower(coalesce(p.slug, '')) in (
      'habit-tracker',
      'dev-jobs-board',
      'devjobs-board',
      'dev-jobsboard',
      'devjobsboard'
    )
    or lower(coalesce(p.name, '')) in (
      'habit tracker',
      'dev jobs board',
      'devjobs board'
    )
    or lower(coalesce(p.repo_url, '')) like '%habit-tracker%'
    or lower(coalesce(p.repo_url, '')) like '%dev-jobs-board%'
    or lower(coalesce(p.repo_url, '')) like '%devjobs%board%';

  if coalesce(array_length(v_old_project_ids, 1), 0) > 0 then
    delete from public.task_requests tr
    where tr.project_id = any(v_old_project_ids)
       or tr.task_id in (
         select t.id
         from public.tasks t
         where t.project_id = any(v_old_project_ids)
       );

    if to_regclass('public.task_comments') is not null then
      execute $sql$
        delete from public.task_comments tc
        where tc.task_id in (
          select t.id
          from public.tasks t
          where t.project_id = any($1)
        )
      $sql$
      using v_old_project_ids;
    end if;

    if to_regclass('public.favorites') is not null then
      execute $sql$
        delete from public.favorites f
        where (f.item_type = 'project' and f.item_id = any($1))
           or (f.item_type = 'task' and f.item_id in (
                select t.id
                from public.tasks t
                where t.project_id = any($1)
              ))
      $sql$
      using v_old_project_ids;
    end if;

    delete from public.tasks t
    where t.project_id = any(v_old_project_ids);

    delete from public.projects p
    where p.id = any(v_old_project_ids);
  end if;

  -- 3) Detectar columnas opcionales en tasks
  select exists(
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'estimated_minutes'
  )
  into v_has_estimated_minutes;

  select exists(
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'learning_resources'
  )
  into v_has_learning_resources;

  -- 4) Upsert de proyectos nuevos
  for v_project in
    select *
    from (
      values
        (
          'snippet-vault',
          'snippet-vault',
          'Biblioteca open source para guardar, organizar y buscar snippets de código.',
          'Proyecto open source para gestionar snippets por lenguaje, etiquetas y uso. Incluye búsqueda, filtros y detalle de snippet para practicar contribuciones reales.',
          'https://github.com/MiPrimerIssue/snippet-vault',
          array['nextjs', 'typescript', 'tailwindcss', 'supabase']::text[],
          'active',
          'beginner'
        ),
        (
          'readme-studio',
          'readme-studio',
          'Herramienta open source para crear READMEs profesionales con bloques guiados.',
          'Aplicación para generar README de GitHub con formulario guiado, vista previa en tiempo real, selector de plantillas y exportación Markdown.',
          'https://github.com/MiPrimerIssue/readme-studio',
          array['nextjs', 'typescript', 'tailwindcss', 'supabase']::text[],
          'active',
          'beginner'
        ),
        (
          'devhabit-tracker',
          'devhabit-tracker',
          'App open source para registrar hábitos de estudio y mantener consistencia.',
          'Proyecto para registrar hábitos de desarrollo, ver progreso diario/semanal y mantener rachas de aprendizaje. Ideal para tareas guiadas de frontend.',
          'https://github.com/MiPrimerIssue/devhabit-tracker',
          array['nextjs', 'typescript', 'tailwindcss', 'supabase']::text[],
          'active',
          'beginner'
        )
    ) as p(
      name,
      slug,
      short_description,
      description,
      repo_url,
      tech_stack,
      status,
      difficulty
    )
  loop
    if exists (
      select 1
      from public.projects p2
      where lower(p2.slug) = lower(v_project.slug)
    ) then
      update public.projects p2
      set
        name = v_project.name,
        short_description = v_project.short_description,
        description = v_project.description,
        repo_url = v_project.repo_url,
        tech_stack = v_project.tech_stack,
        status = v_project.status,
        difficulty = v_project.difficulty,
        created_by = v_created_by
      where lower(p2.slug) = lower(v_project.slug);
    else
      insert into public.projects (
        name,
        slug,
        short_description,
        description,
        repo_url,
        tech_stack,
        status,
        difficulty,
        created_by
      )
      values (
        v_project.name,
        v_project.slug,
        v_project.short_description,
        v_project.description,
        v_project.repo_url,
        v_project.tech_stack,
        v_project.status,
        v_project.difficulty,
        v_created_by
      );
    end if;
  end loop;

  -- 5) Upsert de 15 tareas (5 por repo)
  for v_task in
    select *
    from (
      values
        -- snippet-vault
        (
          'snippet-vault',
          'Task 001 - Snippet Card Component',
          'Crear una tarjeta reutilizable para mostrar snippet con título, lenguaje, descripción corta y etiquetas.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'ui', 'components']::text[],
          45,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/tasks/beginner/task-001-snippet-card.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/docs/project-overview.md'
          ]::text[]
        ),
        (
          'snippet-vault',
          'Task 002 - Search Input',
          'Implementar componente SearchInput para filtrar snippets por título con API reusable (value/onChange/placeholder).',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'search', 'components']::text[],
          45,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/tasks/beginner/task-002-search-input.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/docs/setup-guide.md'
          ]::text[]
        ),
        (
          'snippet-vault',
          'Task 003 - Empty Library State',
          'Crear estado vacío reusable para biblioteca de snippets y resultados sin coincidencias.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'ux', 'empty-state']::text[],
          35,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/tasks/beginner/task-003-empty-library-state.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/docs/project-overview.md'
          ]::text[]
        ),
        (
          'snippet-vault',
          'Task 101 - Language Filter',
          'Añadir filtro por lenguaje para el listado de snippets e integrarlo con la búsqueda por título.',
          'intermediate',
          'open',
          array['feature', 'frontend', 'filters', 'search']::text[],
          90,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/tasks/intermediate/task-101-language-filter.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/docs/roadmap.md'
          ]::text[]
        ),
        (
          'snippet-vault',
          'Task 102 - Snippet Detail Page',
          'Construir página de detalle para snippet con código completo, etiquetas y metadatos.',
          'intermediate',
          'open',
          array['feature', 'frontend', 'routing', 'detail-page']::text[],
          110,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/tasks/intermediate/task-102-snippet-detail-page.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/snippet-vault/main/docs/roadmap.md'
          ]::text[]
        ),

        -- readme-studio
        (
          'readme-studio',
          'Task 001 - Project Info Form',
          'Crear formulario reusable para capturar nombre de proyecto, descripción corta y stack tecnológico.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'forms', 'ui']::text[],
          50,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/tasks/beginner/task-001-project-info-form.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/docs/project-overview.md'
          ]::text[]
        ),
        (
          'readme-studio',
          'Task 002 - README Preview Panel',
          'Implementar panel de vista previa legible para el README generado con buen comportamiento responsive.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'markdown', 'preview']::text[],
          55,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/tasks/beginner/task-002-readme-preview-card.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/docs/setup-guide.md'
          ]::text[]
        ),
        (
          'readme-studio',
          'Task 003 - Empty Template State',
          'Añadir estado vacío reusable cuando aún no hay datos para renderizar el README.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'ux', 'empty-state']::text[],
          35,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/tasks/beginner/task-003-empty-template-state.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/docs/project-overview.md'
          ]::text[]
        ),
        (
          'readme-studio',
          'Task 101 - Template Selector',
          'Implementar selector de plantillas de README y conectar la opción elegida con la vista previa.',
          'intermediate',
          'open',
          array['feature', 'frontend', 'templates', 'state']::text[],
          95,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/tasks/intermediate/task-101-template-selector.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/docs/roadmap.md'
          ]::text[]
        ),
        (
          'readme-studio',
          'Task 102 - Markdown Export',
          'Crear lógica de exportación/copia de README en Markdown válido a partir de los datos del formulario.',
          'intermediate',
          'open',
          array['feature', 'frontend', 'markdown', 'export']::text[],
          110,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/tasks/intermediate/task-102-markdown-export.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/readme-studio/main/docs/roadmap.md'
          ]::text[]
        ),

        -- devhabit-tracker
        (
          'devhabit-tracker',
          'Task 001 - Habit Card Component',
          'Crear tarjeta reusable para hábito mostrando nombre, frecuencia y estado con jerarquía visual clara.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'ui', 'components']::text[],
          45,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/tasks/beginner/task-001-habit-card.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/docs/project-overview.md'
          ]::text[]
        ),
        (
          'devhabit-tracker',
          'Task 002 - Progress Summary',
          'Implementar bloque visual de progreso diario/semanal con lectura rápida y diseño responsive.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'dashboard', 'ui']::text[],
          50,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/tasks/beginner/task-002-progress-summary.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/docs/setup-guide.md'
          ]::text[]
        ),
        (
          'devhabit-tracker',
          'Task 003 - Empty Habits State',
          'Crear estado vacío reusable para usuarios sin hábitos creados, con mensaje claro y CTA.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'ux', 'empty-state']::text[],
          35,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/tasks/beginner/task-003-empty-habits-state.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/docs/project-overview.md'
          ]::text[]
        ),
        (
          'devhabit-tracker',
          'Task 101 - Frequency Filter',
          'Agregar filtro por frecuencia (todos/diarios/semanales) para actualizar el listado de hábitos.',
          'intermediate',
          'open',
          array['feature', 'frontend', 'filters', 'state']::text[],
          90,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/tasks/intermediate/task-101-frequency-filter.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/docs/roadmap.md'
          ]::text[]
        ),
        (
          'devhabit-tracker',
          'Task 102 - Habit Detail Page',
          'Construir página de detalle de hábito con descripción, frecuencia y progreso.',
          'intermediate',
          'open',
          array['feature', 'frontend', 'routing', 'detail-page']::text[],
          105,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/tasks/intermediate/task-102-habit-detail-page.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/devhabit-tracker/main/docs/roadmap.md'
          ]::text[]
        )
    ) as t(
      project_slug,
      title,
      description,
      difficulty,
      status,
      labels,
      estimated_minutes,
      learning_resources
    )
  loop
    select p.id
      into v_project_id
    from public.projects p
    where lower(p.slug) = lower(v_task.project_slug)
    limit 1;

    if v_project_id is null then
      raise exception 'No se pudo resolver project_id para slug=%', v_task.project_slug;
    end if;

    select exists(
      select 1
      from public.tasks t
      where t.project_id = v_project_id
        and lower(t.title) = lower(v_task.title)
    )
    into v_task_exists;

    if v_has_estimated_minutes and v_has_learning_resources then
      if v_task_exists then
        update public.tasks t
        set
          description = v_task.description,
          difficulty = v_task.difficulty,
          status = v_task.status,
          labels = v_task.labels,
          estimated_minutes = v_task.estimated_minutes,
          learning_resources = v_task.learning_resources
        where t.project_id = v_project_id
          and lower(t.title) = lower(v_task.title);
      else
        insert into public.tasks (
          project_id,
          title,
          description,
          difficulty,
          status,
          labels,
          estimated_minutes,
          learning_resources,
          created_at
        )
        values (
          v_project_id,
          v_task.title,
          v_task.description,
          v_task.difficulty,
          v_task.status,
          v_task.labels,
          v_task.estimated_minutes,
          v_task.learning_resources,
          now()
        );
      end if;
    elsif v_has_estimated_minutes then
      if v_task_exists then
        update public.tasks t
        set
          description = v_task.description,
          difficulty = v_task.difficulty,
          status = v_task.status,
          labels = v_task.labels,
          estimated_minutes = v_task.estimated_minutes
        where t.project_id = v_project_id
          and lower(t.title) = lower(v_task.title);
      else
        insert into public.tasks (
          project_id,
          title,
          description,
          difficulty,
          status,
          labels,
          estimated_minutes,
          created_at
        )
        values (
          v_project_id,
          v_task.title,
          v_task.description,
          v_task.difficulty,
          v_task.status,
          v_task.labels,
          v_task.estimated_minutes,
          now()
        );
      end if;
    elsif v_has_learning_resources then
      if v_task_exists then
        update public.tasks t
        set
          description = v_task.description,
          difficulty = v_task.difficulty,
          status = v_task.status,
          labels = v_task.labels,
          learning_resources = v_task.learning_resources
        where t.project_id = v_project_id
          and lower(t.title) = lower(v_task.title);
      else
        insert into public.tasks (
          project_id,
          title,
          description,
          difficulty,
          status,
          labels,
          learning_resources,
          created_at
        )
        values (
          v_project_id,
          v_task.title,
          v_task.description,
          v_task.difficulty,
          v_task.status,
          v_task.labels,
          v_task.learning_resources,
          now()
        );
      end if;
    else
      if v_task_exists then
        update public.tasks t
        set
          description = v_task.description,
          difficulty = v_task.difficulty,
          status = v_task.status,
          labels = v_task.labels
        where t.project_id = v_project_id
          and lower(t.title) = lower(v_task.title);
      else
        insert into public.tasks (
          project_id,
          title,
          description,
          difficulty,
          status,
          labels,
          created_at
        )
        values (
          v_project_id,
          v_task.title,
          v_task.description,
          v_task.difficulty,
          v_task.status,
          v_task.labels,
          now()
        );
      end if;
    end if;
  end loop;
end
$$;

commit;

-- Verificación rápida:
-- select name, slug, repo_url, status from public.projects where slug in ('snippet-vault','readme-studio','devhabit-tracker') order by slug;
-- select p.slug, count(*) as tasks_count from public.tasks t join public.projects p on p.id = t.project_id where p.slug in ('snippet-vault','readme-studio','devhabit-tracker') group by p.slug order by p.slug;
