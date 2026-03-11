import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PublicLayout from "@/components/layout/public-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Button from "@/components/ui/button";
import { FiltersForm, FilterField, FilterSelect } from "@/components/ui/filters";
import { getCurrentLocale } from "@/lib/i18n/server";
import FavoriteToggle from "@/components/favorites/favorite-toggle";
import { getFavoriteIdsByType } from "@/lib/favorites";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Proyectos open source para contribuir | MiPrimerIssue",
  description:
    "Explora proyectos open source con tareas reales, filtros por tecnología y nivel, y encuentra dónde empezar a contribuir como developer junior.",
  alternates: {
    canonical: `${getSiteUrl()}/projects`,
  },
};

type ProjectRow = {
  id: string;
  slug: string | null;
  name: string | null;
  short_description: string | null;
  description: string | null;
  repo_url: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  tech_stack: string[] | null;
};

type TaskMetricRow = {
  project_id: string;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  assigned_to: string | null;
};

type TaskFilterRow = {
  project_id: string | null;
};

type TechStackRow = {
  tech_stack: string[] | null;
};

type ProjectsPageProps = {
  searchParams: Promise<{
    tech?: string;
    difficulty?: string;
    status?: string;
    track?: string;
    estimate?: string;
    favorites?: string;
    page?: string;
  }>;
};

const PROJECTS_PER_PAGE = 12;

const TRACK_LABELS: Record<string, string[]> = {
  frontend: ["frontend", "ui", "react", "css", "tailwind"],
  backend: ["backend", "api", "server", "database"],
  docs: ["docs", "documentation", "readme"],
  testing: ["testing", "test", "qa", "e2e"],
};

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

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildProjectsPageHref(
  filters: {
    tech: string;
    difficulty: string;
    status: string;
    track: string;
    estimate: string;
    favorites: string;
  },
  page: number
) {
  const params = new URLSearchParams();

  if (filters.tech) params.set("tech", filters.tech);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.status && filters.status !== "active") params.set("status", filters.status);
  if (filters.track) params.set("track", filters.track);
  if (filters.estimate) params.set("estimate", filters.estimate);
  if (filters.favorites === "1") params.set("favorites", "1");
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const locale = await getCurrentLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedParams = await searchParams;

  const tech = (resolvedParams.tech || "").trim();
  const difficulty = ["beginner", "intermediate", "advanced"].includes(resolvedParams.difficulty || "")
    ? (resolvedParams.difficulty as "beginner" | "intermediate" | "advanced")
    : "";
  const status = resolvedParams.status === "archived" ? "archived" : "active";
  const track = Object.keys(TRACK_LABELS).includes(resolvedParams.track || "") ? (resolvedParams.track as keyof typeof TRACK_LABELS) : "";
  const estimate = ["short", "medium", "long"].includes(resolvedParams.estimate || "")
    ? (resolvedParams.estimate as "short" | "medium" | "long")
    : "";
  const favorites = user && resolvedParams.favorites === "1" ? "1" : "";

  const requestedPage = parsePage(resolvedParams.page);
  let currentPage = requestedPage;

  const favoriteProjectIds = await getFavoriteIdsByType({
    supabase,
    userId: user?.id || null,
    itemType: "project",
  });

  let projectIdsByTaskFilters: string[] | null = null;

  if (track || estimate) {
    let tasksFilterQuery = supabase
      .from("tasks")
      .select("project_id")
      .not("project_id", "is", null)
      .in("status", ["open", "assigned", "in_review", "completed", "closed"]);

    if (track) {
      tasksFilterQuery = tasksFilterQuery.overlaps("labels", TRACK_LABELS[track]);
    }

    if (estimate === "short") {
      tasksFilterQuery = tasksFilterQuery.lte("estimated_minutes", 30);
    } else if (estimate === "medium") {
      tasksFilterQuery = tasksFilterQuery.gt("estimated_minutes", 30).lte("estimated_minutes", 90);
    } else if (estimate === "long") {
      tasksFilterQuery = tasksFilterQuery.gt("estimated_minutes", 90);
    }

    const tasksFilterResult = await tasksFilterQuery;

    if (tasksFilterResult.error && estimate && isMissingEstimatedColumnError(tasksFilterResult.error)) {
      projectIdsByTaskFilters = [];
    } else if (tasksFilterResult.error) {
      console.error("Error aplicando filtros de tareas en proyectos:", tasksFilterResult.error.message);
      projectIdsByTaskFilters = [];
    } else {
      projectIdsByTaskFilters = [
        ...new Set(
          ((tasksFilterResult.data || []) as TaskFilterRow[])
            .map((row) => row.project_id)
            .filter((projectId): projectId is string => typeof projectId === "string" && projectId.length > 0)
        ),
      ];
    }
  }

  let forceEmpty = false;

  if (favorites === "1" && favoriteProjectIds.size === 0) {
    forceEmpty = true;
  }

  if (projectIdsByTaskFilters && projectIdsByTaskFilters.length === 0) {
    forceEmpty = true;
  }

  const buildProjectsQuery = () => {
    let query = supabase
      .from("projects")
      .select("id, slug, name, short_description, description, repo_url, difficulty, tech_stack", {
        count: "exact",
      })
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (tech) {
      query = query.contains("tech_stack", [tech]);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    if (favorites === "1") {
      query = query.in("id", [...favoriteProjectIds]);
    }

    if (projectIdsByTaskFilters) {
      query = query.in("id", projectIdsByTaskFilters);
    }

    return query;
  };

  let projects: ProjectRow[] = [];
  let totalProjects = 0;

  if (!forceEmpty) {
    const start = (currentPage - 1) * PROJECTS_PER_PAGE;
    const end = start + PROJECTS_PER_PAGE - 1;

    let projectsResult = await buildProjectsQuery().range(start, end);

    if (projectsResult.error) {
      console.error("Error cargando proyectos:", projectsResult.error.message);
    }

    totalProjects = projectsResult.count || 0;
    const totalPages = Math.max(1, Math.ceil(totalProjects / PROJECTS_PER_PAGE));

    if (totalProjects > 0 && currentPage > totalPages) {
      currentPage = totalPages;
      const correctedStart = (currentPage - 1) * PROJECTS_PER_PAGE;
      const correctedEnd = correctedStart + PROJECTS_PER_PAGE - 1;
      projectsResult = await buildProjectsQuery().range(correctedStart, correctedEnd);
      if (projectsResult.error) {
        console.error("Error recargando proyectos paginados:", projectsResult.error.message);
      }
      totalProjects = projectsResult.count || totalProjects;
    }

    projects = ((projectsResult.data || []) as ProjectRow[]);
  }

  const projectIds = projects.map((project) => project.id);

  const { data: taskMetricsData, error: taskMetricsError } =
    projectIds.length > 0
      ? await supabase
          .from("tasks")
          .select("project_id, status, assigned_to")
          .in("project_id", projectIds)
      : { data: [], error: null };

  if (taskMetricsError) {
    console.error("Error cargando métricas de tareas:", taskMetricsError.message);
  }

  const taskMetricsByProject = new Map<
    string,
    {
      openTasks: number;
      contributors: Set<string>;
    }
  >();

  ((taskMetricsData || []) as TaskMetricRow[]).forEach((task) => {
    const metrics = taskMetricsByProject.get(task.project_id) || {
      openTasks: 0,
      contributors: new Set<string>(),
    };

    if (task.status === "open") {
      metrics.openTasks += 1;
    }

    if (task.assigned_to) {
      metrics.contributors.add(task.assigned_to);
    }

    taskMetricsByProject.set(task.project_id, metrics);
  });

  const { data: techRows } = await supabase
    .from("projects")
    .select("tech_stack")
    .eq("status", status);

  const availableTech = [
    ...new Set(
      ((techRows || []) as TechStackRow[]).flatMap((project) => project.tech_stack || [])
    ),
  ].sort((a, b) => a.localeCompare(b));

  const totalPages = Math.max(1, Math.ceil(totalProjects / PROJECTS_PER_PAGE));
  const hasResults = projects.length > 0;

  const filterState = {
    tech,
    difficulty,
    status,
    track,
    estimate,
    favorites,
  };

  const showingFrom = totalProjects === 0 ? 0 : (currentPage - 1) * PROJECTS_PER_PAGE + 1;
  const showingTo = totalProjects === 0 ? 0 : Math.min(currentPage * PROJECTS_PER_PAGE, totalProjects);

  return (
    <PublicLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard variant="hero" className="p-8">
        <PageHeader
          title={locale === "en" ? "Open source projects" : "Proyectos open source"}
          description={
            locale === "en"
              ? "Explore real projects, open tasks, and opportunities to contribute with demonstrable experience."
              : "Explora proyectos reales, tareas abiertas y oportunidades para contribuir con experiencia demostrable."
          }
        />

        <FiltersForm className="mb-6 md:grid-cols-6">
          <FilterField htmlFor="tech" label={locale === "en" ? "Technology" : "Tecnología"}>
            <FilterSelect
              id="tech"
              name="tech"
              defaultValue={tech}
              options={[
                { value: "", label: locale === "en" ? "All" : "Todas" },
                ...availableTech.map((item) => ({ value: item, label: item })),
              ]}
            />
          </FilterField>

          <FilterField htmlFor="difficulty" label={locale === "en" ? "Difficulty" : "Dificultad"}>
            <FilterSelect
              id="difficulty"
              name="difficulty"
              defaultValue={difficulty}
              options={[
                { value: "", label: locale === "en" ? "All" : "Todas" },
                { value: "beginner", label: locale === "en" ? "Beginner" : "Principiante" },
                { value: "intermediate", label: locale === "en" ? "Intermediate" : "Intermedia" },
                { value: "advanced", label: locale === "en" ? "Advanced" : "Avanzada" },
              ]}
            />
          </FilterField>

          <FilterField htmlFor="status" label={locale === "en" ? "Status" : "Estado"}>
            <FilterSelect
              id="status"
              name="status"
              defaultValue={status}
              options={[
                { value: "active", label: locale === "en" ? "Active" : "Activos" },
                { value: "archived", label: locale === "en" ? "Archived" : "Archivados" },
              ]}
            />
          </FilterField>

          <FilterField htmlFor="track" label={locale === "en" ? "Task type" : "Tipo de tarea"}>
            <FilterSelect
              id="track"
              name="track"
              defaultValue={track}
              options={[
                { value: "", label: locale === "en" ? "All" : "Todos" },
                { value: "frontend", label: "Frontend" },
                { value: "backend", label: "Backend" },
                { value: "docs", label: "Docs" },
                { value: "testing", label: "Testing" },
              ]}
            />
          </FilterField>

          <FilterField htmlFor="estimate" label={locale === "en" ? "Estimated time" : "Tiempo estimado"}>
            <FilterSelect
              id="estimate"
              name="estimate"
              defaultValue={estimate}
              options={[
                { value: "", label: locale === "en" ? "All" : "Todos" },
                { value: "short", label: locale === "en" ? "Up to 30 min" : "Hasta 30 min" },
                { value: "medium", label: locale === "en" ? "30-90 min" : "30-90 min" },
                { value: "long", label: locale === "en" ? "90+ min" : "90+ min" },
              ]}
            />
          </FilterField>

          <div className="flex items-end gap-2">
            {user ? (
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" name="favorites" value="1" defaultChecked={favorites === "1"} />
                {locale === "en" ? "Only favorites" : "Solo favoritos"}
              </label>
            ) : null}
            <Button type="submit" variant="accent">
              {locale === "en" ? "Apply" : "Aplicar"}
            </Button>
          </div>
        </FiltersForm>

        <p className="mb-4 text-xs text-gray-400">
          {locale === "en"
            ? `Showing ${showingFrom}-${showingTo} of ${totalProjects} projects`
            : `Mostrando ${showingFrom}-${showingTo} de ${totalProjects} proyectos`}
        </p>

        {!hasResults ? (
          <EmptyState
            title={locale === "en" ? "No projects for these filters" : "No hay proyectos para estos filtros"}
            description={
              locale === "en"
                ? "Try another combination. New repositories and tasks are published continuously."
                : "Prueba otra combinación. Nuevos repositorios y tareas se publican continuamente."
            }
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => {
                const metrics = taskMetricsByProject.get(project.id);
                const openTasks = metrics?.openTasks || 0;
                const contributors = metrics?.contributors.size || 0;

                return (
                  <article
                    key={project.id}
                    className="surface-subcard rounded-2xl p-5"
                  >
                    <h2 className="text-xl font-semibold text-white">
                      {project.name || (locale === "en" ? "Untitled project" : "Proyecto sin nombre")}
                    </h2>
                    <p className="mt-2 text-sm text-gray-300">
                      {project.short_description ||
                        project.description ||
                        (locale === "en" ? "No description available." : "Sin descripción disponible.")}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge tone="info">
                        {openTasks} {locale === "en" ? "open tasks" : "tareas abiertas"}
                      </Badge>
                      <Badge tone="default">
                        {contributors} {locale === "en" ? "developers contributing" : "developers contribuyendo"}
                      </Badge>
                      <Badge tone="warning">
                        {locale === "en" ? "Difficulty" : "Dificultad"}: {project.difficulty || (locale === "en" ? "not specified" : "no especificada")}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(project.tech_stack || []).slice(0, 6).map((stackTech) => (
                        <Badge key={`${project.id}-${stackTech}`}>{stackTech}</Badge>
                      ))}
                      {(project.tech_stack || []).length === 0 ? (
                        <span className="text-xs text-gray-500">
                          {locale === "en" ? "Tech stack not specified" : "Tech stack no especificado"}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {user ? (
                        <FavoriteToggle
                          itemType="project"
                          itemId={project.id}
                          initiallyFavorite={favoriteProjectIds.has(project.id)}
                        />
                      ) : null}
                      {project.slug ? (
                        <Link
                          href={`/projects/${project.slug}`}
                          className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                        >
                          {locale === "en" ? "View project" : "Ver proyecto"}
                        </Link>
                      ) : (
                        <span className="inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-500">
                          {locale === "en" ? "Project without slug" : "Proyecto sin slug"}
                        </span>
                      )}
                      {project.repo_url ? (
                        <Link
                          href={project.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
                        >
                          {locale === "en" ? "GitHub repo" : "Repo GitHub"}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Link
                  href={buildProjectsPageHref(filterState, Math.max(1, currentPage - 1))}
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
                  href={buildProjectsPageHref(filterState, Math.min(totalPages, currentPage + 1))}
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
        )}
      </SectionCard>
    </PublicLayout>
  );
}
