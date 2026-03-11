-- Seed de prueba: proyecto real MiPrimerIssue/openapi-finder + 5 tasks
-- Ejecutar en SQL Editor de Supabase o vía psql.
-- Idempotente: no duplica proyecto por slug ni tasks por (project_id + title).

do $$
declare
  v_created_by uuid;
  v_project_id uuid;
  v_has_estimated_minutes boolean;
  v_has_learning_resources boolean;
  v_task record;
begin
  -- 1) Buscar maintainer/admin para created_by (fallback: primer perfil existente)
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

  -- 2) Crear proyecto si no existe (slug canónico: openapi-finder)
  if not exists (
    select 1
    from public.projects
    where slug = 'openapi-finder'
  ) then
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
      'openapi-finder',
      'openapi-finder',
      'Descubre APIs públicas de forma rápida y visual, con contribuciones guiadas para juniors.',
      'Aplicación open source para descubrir APIs públicas, filtrarlas por categoría y explorar su detalle. Forma parte del ecosistema MiPrimerIssue para practicar contribuciones reales en Next.js, TypeScript, Tailwind CSS y Supabase.',
      'https://github.com/MiPrimerIssue/openapi-finder',
      array['nextjs', 'typescript', 'tailwindcss', 'supabase']::text[],
      'active',
      'beginner',
      v_created_by
    );
  end if;

  -- 3) Asegurar que el proyecto queda actualizado para el test
  update public.projects
  set
    name = 'openapi-finder',
    short_description = 'Descubre APIs públicas de forma rápida y visual, con contribuciones guiadas para juniors.',
    description = 'Aplicación open source para descubrir APIs públicas, filtrarlas por categoría y explorar su detalle. Forma parte del ecosistema MiPrimerIssue para practicar contribuciones reales en Next.js, TypeScript, Tailwind CSS y Supabase.',
    repo_url = 'https://github.com/MiPrimerIssue/openapi-finder',
    tech_stack = array['nextjs', 'typescript', 'tailwindcss', 'supabase']::text[],
    status = 'active',
    difficulty = 'beginner',
    created_by = v_created_by
  where slug = 'openapi-finder';

  select p.id
  into v_project_id
  from public.projects p
  where p.slug = 'openapi-finder'
  limit 1;

  if v_project_id is null then
    raise exception 'No se pudo resolver project_id para slug=openapi-finder';
  end if;

  -- 4) Detectar columnas opcionales de tasks
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

  -- 5) Insertar 5 tasks coherentes con el repo (sin duplicar por título)
  for v_task in
    select *
    from (
      values
        (
          'Task 001 - Search Bar Component',
          'Crear un componente reutilizable SearchBar para filtrar APIs por nombre en la vista principal. Debe soportar value/onChange, placeholder y comportamiento responsive.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'ui', 'search']::text[],
          45,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/tasks/beginner/task-001-search-bar.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/docs/project-overview.md'
          ]::text[]
        ),
        (
          'Task 002 - API Card Component',
          'Implementar un componente ApiCard reutilizable que muestre nombre, descripción breve, categoría y si soporta HTTPS. Debe integrarse en el listado principal.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'components', 'ui']::text[],
          60,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/tasks/beginner/task-002-api-card.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/docs/roadmap.md'
          ]::text[]
        ),
        (
          'Task 003 - Empty State UI',
          'Añadir un estado vacío claro y amigable cuando no existan resultados por búsqueda o filtros. Debe mantener coherencia visual con el resto de la interfaz.',
          'beginner',
          'open',
          array['good first issue', 'frontend', 'ux', 'empty-state']::text[],
          35,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/tasks/beginner/task-003-empty-state.md'
          ]::text[]
        ),
        (
          'Task 101 - Category Filter',
          'Implementar filtro por categoría y combinarlo con la búsqueda por nombre. Debe permitir mostrar todas las categorías o una categoría concreta sin romper el listado.',
          'intermediate',
          'open',
          array['feature', 'frontend', 'filters', 'category']::text[],
          90,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/tasks/intermediate/task-101-category-filter.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/docs/roadmap.md'
          ]::text[]
        ),
        (
          'Task 102 - API Detail Page',
          'Crear la vista de detalle de API (ruta tipo /apis/[id]) mostrando información ampliada y navegación consistente con la lista principal.',
          'intermediate',
          'open',
          array['feature', 'frontend', 'routing', 'api-detail']::text[],
          120,
          array[
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/tasks/intermediate/task-102-api-detail-page.md',
            'https://raw.githubusercontent.com/MiPrimerIssue/openapi-finder/main/docs/project-overview.md'
          ]::text[]
        )
    ) as t(
      title,
      description,
      difficulty,
      status,
      labels,
      estimated_minutes,
      learning_resources
    )
  loop
    if exists (
      select 1
      from public.tasks t
      where t.project_id = v_project_id
        and lower(t.title) = lower(v_task.title)
    ) then
      continue;
    end if;

    if v_has_estimated_minutes and v_has_learning_resources then
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
    elsif v_has_estimated_minutes then
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
    elsif v_has_learning_resources then
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
  end loop;
end $$;

-- Verificación rápida opcional:
-- select id, name, slug, repo_url, status from public.projects where slug = 'openapi-finder';
-- select id, title, difficulty, status, estimated_minutes from public.tasks where project_id = (select id from public.projects where slug = 'openapi-finder') order by created_at desc;
