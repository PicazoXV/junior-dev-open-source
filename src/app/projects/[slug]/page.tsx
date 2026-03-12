import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicLayout from "@/components/layout/public-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import TaskFilterPanel from "@/components/task-filter-panel";
import { isReviewerRole } from "@/lib/roles";
import { getCurrentLocale } from "@/lib/i18n/server";
import FavoriteToggle from "@/components/favorites/favorite-toggle";
import { FilterField, FiltersForm, FilterSelect } from "@/components/ui/filters";
import Button from "@/components/ui/button";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    taskStatus?: string;
    taskDifficulty?: string;
    page?: string;
  }>;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  estimated_minutes?: number | null;
  labels: string[] | null;
  github_issue_url: string | null;
  assigned_to: string | null;
};

type ProfileLite = {
  id: string;
  github_username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type AssignedToRow = {
  assigned_to: string | null;
};

type TaskWithoutEstimateRow = Omit<TaskRow, "estimated_minutes">;

const TASKS_PER_PAGE = 12;

function toTaskRows(data: unknown): TaskRow[] {
  return Array.isArray(data) ? (data as TaskRow[]) : [];
}

function toTaskWithoutEstimateRows(data: unknown): TaskWithoutEstimateRow[] {
  return Array.isArray(data) ? (data as TaskWithoutEstimateRow[]) : [];
}

function isMissingEstimatedColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return (
    code === "42703" ||
    message.includes("estimated_minutes") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildTasksPageHref(
  slug: string,
  filters: {
    taskStatus: string;
    taskDifficulty: string;
  },
  page: number
) {
  const params = new URLSearchParams();

  if (filters.taskStatus && filters.taskStatus !== "all") {
    params.set("taskStatus", filters.taskStatus);
  }

  if (filters.taskDifficulty && filters.taskDifficulty !== "all") {
    params.set("taskDifficulty", filters.taskDifficulty);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/projects/${slug}?${query}` : `/projects/${slug}`;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";

  if (!slug) {
    return {
      title: "Proyecto open source | MiPrimerIssue",
      description:
        "Conoce proyectos open source con tareas para juniors, nivel de dificultad y contexto para contribuir con impacto.",
    };
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name, short_description")
    .eq("slug", slug)
    .maybeSingle();

  const readableName = project?.name?.trim() || slugToTitle(slug) || "Proyecto open source";
  const description =
    project?.short_description?.trim() ||
    `Explora ${readableName} en MiPrimerIssue y encuentra tareas abiertas para empezar a contribuir en open source.`;

  return {
    title: `${readableName} | MiPrimerIssue`,
    description,
  };
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const locale = await getCurrentLocale();
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";

  if (!slug) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const taskStatus = ["all", "open", "assigned", "in_review", "completed", "closed"].includes(
    resolvedSearchParams?.taskStatus || ""
  )
    ? (resolvedSearchParams?.taskStatus as "all" | "open" | "assigned" | "in_review" | "completed" | "closed")
    : "all";
  const taskDifficulty = ["all", "beginner", "intermediate", "advanced"].includes(
    resolvedSearchParams?.taskDifficulty || ""
  )
    ? (resolvedSearchParams?.taskDifficulty as "all" | "beginner" | "intermediate" | "advanced")
    : "all";

  let currentPage = parsePage(resolvedSearchParams?.page);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, slug, name, short_description, description, repo_url, tech_stack, difficulty, created_by"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (projectError || !project) {
    notFound();
  }

  const buildTasksQuery = (withEstimate: boolean) => {
    let query = supabase
      .from("tasks")
      .select(
        withEstimate
          ? "id, title, description, status, difficulty, estimated_minutes, labels, github_issue_url, assigned_to"
          : "id, title, description, status, difficulty, labels, github_issue_url, assigned_to",
        { count: "exact" }
      )
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (taskStatus !== "all") {
      query = query.eq("status", taskStatus);
    }

    if (taskDifficulty !== "all") {
      query = query.eq("difficulty", taskDifficulty);
    }

    return query;
  };

  const taskRangeStart = (currentPage - 1) * TASKS_PER_PAGE;
  const taskRangeEnd = taskRangeStart + TASKS_PER_PAGE - 1;

  const initialTasksResult = await buildTasksQuery(true).range(taskRangeStart, taskRangeEnd);
  let tasksError = initialTasksResult.error;
  let tasksCount = initialTasksResult.count || 0;
  let taskRows = toTaskRows(initialTasksResult.data);

  if (tasksError && isMissingEstimatedColumnError(tasksError)) {
    const fallback = await buildTasksQuery(false).range(taskRangeStart, taskRangeEnd);
    tasksError = fallback.error;
    tasksCount = fallback.count || 0;
    taskRows = toTaskWithoutEstimateRows(fallback.data).map((task) => ({
      ...task,
      estimated_minutes: null,
    }));
  }

  if (tasksError) {
    console.error("Error cargando tareas:", tasksError.message);
  }

  let totalTasks = tasksCount;
  const totalPages = Math.max(1, Math.ceil(totalTasks / TASKS_PER_PAGE));

  if (totalTasks > 0 && currentPage > totalPages) {
    currentPage = totalPages;
    const correctedStart = (currentPage - 1) * TASKS_PER_PAGE;
    const correctedEnd = correctedStart + TASKS_PER_PAGE - 1;

    const correctedTasksResult = await buildTasksQuery(true).range(correctedStart, correctedEnd);
    let correctedError = correctedTasksResult.error;
    let correctedCount = correctedTasksResult.count || totalTasks;
    let correctedRows = toTaskRows(correctedTasksResult.data);

    if (correctedError && isMissingEstimatedColumnError(correctedError)) {
      const fallback = await buildTasksQuery(false).range(correctedStart, correctedEnd);
      correctedError = fallback.error;
      correctedCount = fallback.count || totalTasks;
      correctedRows = toTaskWithoutEstimateRows(fallback.data).map((task) => ({
        ...task,
        estimated_minutes: null,
      }));
    }

    tasksError = correctedError;
    taskRows = correctedRows;
    totalTasks = correctedCount;
    if (tasksError) {
      console.error("Error recargando tareas paginadas:", tasksError.message);
    }
  }

  const [{ count: openTasksCount }, contributorsResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("status", "open"),
    supabase
      .from("tasks")
      .select("assigned_to")
      .eq("project_id", project.id)
      .not("assigned_to", "is", null),
  ]);

  if (contributorsResult.error) {
    console.error("Error cargando contributors del proyecto:", contributorsResult.error.message);
  }

  const contributorIds = [
    ...new Set(
      ((contributorsResult.data || []) as AssignedToRow[])
        .map((task) => task.assigned_to)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];

  const { data: contributors } =
    contributorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, github_username, full_name, avatar_url")
          .in("id", contributorIds)
      : { data: [] };

  const contributorRows = (contributors || []) as ProfileLite[];

  let canEdit = false;
  let isFavoriteProject = false;
  if (currentUser) {
    const [{ data: profile }, { data: favoriteProject }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", currentUser.id).maybeSingle(),
      supabase
        .from("favorites")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("item_type", "project")
        .eq("item_id", project.id)
        .maybeSingle(),
    ]);
    canEdit = isReviewerRole(profile?.role);
    isFavoriteProject = !!favoriteProject;
  }

  const showingFrom = totalTasks === 0 ? 0 : (currentPage - 1) * TASKS_PER_PAGE + 1;
  const showingTo = totalTasks === 0 ? 0 : Math.min(currentPage * TASKS_PER_PAGE, totalTasks);
  const taskFilters = { taskStatus, taskDifficulty };

  return (
    <PublicLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard variant="hero" className="p-8">
        <PageHeader
          title={project.name || (locale === "en" ? "Project" : "Proyecto")}
          description={
            project.short_description ||
            (locale === "en" ? "Open source project in MiPrimerIssue." : "Proyecto open source en MiPrimerIssue.")
          }
          actions={
            <>
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
              >
                {locale === "en" ? "Back to projects" : "Volver a proyectos"}
              </Link>
              {canEdit ? (
                <Link
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
                >
                  {locale === "en" ? "Edit project" : "Editar proyecto"}
                </Link>
              ) : null}
              {currentUser ? (
                <FavoriteToggle
                  itemType="project"
                  itemId={project.id}
                  initiallyFavorite={isFavoriteProject}
                  size="md"
                />
              ) : null}
            </>
          }
        />

        <div className="surface-subcard rounded-2xl p-6">
          <p className="whitespace-pre-line text-gray-200">
            {project.description ||
              (locale === "en"
                ? "Detailed description not available."
                : "Sin descripción detallada disponible.")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="info">
              {(openTasksCount || 0)} {locale === "en" ? "open tasks" : "tareas abiertas"}
            </Badge>
            <Badge tone="warning">
              {locale === "en" ? "Difficulty" : "Dificultad"}: {project.difficulty || (locale === "en" ? "not specified" : "no especificada")}
            </Badge>
            <Badge tone="default">
              {contributorRows.length} {locale === "en" ? "developers contributing via MiPrimerIssue" : "developers contribuyendo vía MiPrimerIssue"}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(project.tech_stack || []).map((tech: string) => (
              <Badge key={`${project.id}-${tech}`}>{tech}</Badge>
            ))}
            {(project.tech_stack || []).length === 0 ? (
              <span className="text-xs text-gray-500">
                {locale === "en" ? "Tech stack not specified." : "Tech stack no especificado."}
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.repo_url ? (
              <Link
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
              >
                {locale === "en" ? "View GitHub repo" : "Ver repo GitHub"}
              </Link>
            ) : (
              <p className="text-sm text-gray-500">{locale === "en" ? "Repository not available." : "Repositorio no disponible."}</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "Contributing developers" : "Developers contribuyendo"}
          description={
            locale === "en"
              ? "People already collaborating on this project through MiPrimerIssue."
              : "Personas que ya están colaborando en este proyecto desde MiPrimerIssue."
          }
        />
        {contributorRows.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {contributorRows.map((contributor) => (
              <div
                key={contributor.id}
                className="surface-subcard flex items-center justify-between rounded-xl p-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {contributor.full_name || contributor.github_username || "Developer"}
                  </p>
                  <p className="text-xs text-gray-400">
                    @{contributor.github_username || (locale === "en" ? "no-username" : "sin-username")}
                  </p>
                </div>
                {contributor.github_username ? (
                  <Link
                    href={`/dev/${contributor.github_username}`}
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  >
                    {locale === "en" ? "View profile" : "Ver perfil"}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Todavía no hay contributors en este proyecto"
            description={
              locale === "en"
                ? "Contributors will appear here once tasks are approved and assigned."
                : "Cuando se aprueben tareas y se asignen developers, aparecerán aquí."
            }
          />
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "Available tasks" : "Tareas disponibles"}
          description={
            locale === "en"
              ? "Filter by status and difficulty while keeping a lightweight paginated list."
              : "Filtra por estado y dificultad con una lista paginada más ligera."
          }
        />

        <FiltersForm className="mb-5 md:grid-cols-4">
          <FilterField htmlFor="taskStatus" label={locale === "en" ? "Status" : "Estado"}>
            <FilterSelect
              id="taskStatus"
              name="taskStatus"
              defaultValue={taskStatus}
              options={[
                { value: "all", label: locale === "en" ? "All" : "Todos" },
                { value: "open", label: locale === "en" ? "Open" : "Abiertas" },
                { value: "assigned", label: locale === "en" ? "Assigned" : "Asignadas" },
                { value: "in_review", label: locale === "en" ? "In review" : "En review" },
                { value: "completed", label: locale === "en" ? "Completed" : "Completadas" },
                { value: "closed", label: locale === "en" ? "Closed" : "Cerradas" },
              ]}
            />
          </FilterField>

          <FilterField htmlFor="taskDifficulty" label={locale === "en" ? "Difficulty" : "Dificultad"}>
            <FilterSelect
              id="taskDifficulty"
              name="taskDifficulty"
              defaultValue={taskDifficulty}
              options={[
                { value: "all", label: locale === "en" ? "All" : "Todas" },
                { value: "beginner", label: locale === "en" ? "Beginner" : "Principiante" },
                { value: "intermediate", label: locale === "en" ? "Intermediate" : "Intermedia" },
                { value: "advanced", label: locale === "en" ? "Advanced" : "Avanzada" },
              ]}
            />
          </FilterField>

          <div className="flex items-end gap-2 md:col-span-2">
            <Button type="submit" variant="accent">
              {locale === "en" ? "Apply filters" : "Aplicar filtros"}
            </Button>
            <Link
              href={buildTasksPageHref(project.slug || slug, { taskStatus: "all", taskDifficulty: "all" }, 1)}
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
            >
              {locale === "en" ? "Reset" : "Limpiar"}
            </Link>
          </div>
        </FiltersForm>

        <p className="mb-4 text-xs text-gray-400">
          {locale === "en"
            ? `Showing ${showingFrom}-${showingTo} of ${totalTasks} tasks`
            : `Mostrando ${showingFrom}-${showingTo} de ${totalTasks} tareas`}
        </p>

        {taskRows.length > 0 ? (
          <>
            <TaskFilterPanel tasks={taskRows} />

            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Link
                  href={buildTasksPageHref(project.slug || slug, taskFilters, Math.max(1, currentPage - 1))}
                  aria-disabled={currentPage <= 1}
                  className={`inline-flex rounded-lg border px-3 py-2 text-sm transition ${
                    currentPage <= 1
                      ? "pointer-events-none border-white/10 text-gray-600"
                      : "border-white/20 bg-neutral-900 text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  }`}
                >
                  {locale === "en" ? "Previous" : "Anterior"}
                </Link>

                <p className="text-sm text-gray-400">
                  {locale === "en"
                    ? `Page ${currentPage} of ${totalPages}`
                    : `Página ${currentPage} de ${totalPages}`}
                </p>

                <Link
                  href={buildTasksPageHref(project.slug || slug, taskFilters, Math.min(totalPages, currentPage + 1))}
                  aria-disabled={currentPage >= totalPages}
                  className={`inline-flex rounded-lg border px-3 py-2 text-sm transition ${
                    currentPage >= totalPages
                      ? "pointer-events-none border-white/10 text-gray-600"
                      : "border-white/20 bg-neutral-900 text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  }`}
                >
                  {locale === "en" ? "Next" : "Siguiente"}
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            title={locale === "en" ? "No tasks for these filters" : "No hay tareas para estos filtros"}
            description={
              locale === "en"
                ? "Try another combination of status and difficulty."
                : "Prueba otra combinación de estado y dificultad."
            }
          />
        )}
      </SectionCard>
    </PublicLayout>
  );
}
