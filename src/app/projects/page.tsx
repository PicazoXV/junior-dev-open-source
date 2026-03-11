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
  title: "Proyectos open source para contribuir | PrimerIssue",
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

type TaskRow = {
  id: string;
  project_id: string;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  assigned_to: string | null;
  labels?: string[] | null;
  estimated_minutes?: number | null;
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

type ProjectsPageProps = {
  searchParams: Promise<{
    tech?: string;
    difficulty?: string;
    status?: string;
    track?: string;
    estimate?: string;
    favorites?: string;
  }>;
};

function hasAnyTrackLabel(labels: string[] | null | undefined, track: string) {
  if (!track || !labels || labels.length === 0) return true;
  const normalized = labels.map((item) => item.toLowerCase());
  if (track === "frontend") return normalized.some((label) => ["frontend", "ui", "react", "css"].includes(label));
  if (track === "backend") return normalized.some((label) => ["backend", "api", "server", "database"].includes(label));
  if (track === "docs") return normalized.some((label) => ["docs", "documentation", "readme"].includes(label));
  if (track === "testing") return normalized.some((label) => ["testing", "test", "qa", "e2e"].includes(label));
  return true;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const locale = await getCurrentLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { tech = "", difficulty = "", status = "active", track = "", estimate = "", favorites = "" } =
    await searchParams;
  const favoriteProjectIds = await getFavoriteIdsByType({
    supabase,
    userId: user?.id || null,
    itemType: "project",
  });

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, name, short_description, description, repo_url, difficulty, tech_stack")
    .eq("status", status === "archived" ? "archived" : "active")
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const projectRows = (projects || []) as ProjectRow[];
  const projectIds = projectRows.map((project) => project.id);

  const tasksResult =
    projectIds.length > 0
      ? await supabase
          .from("tasks")
          .select("id, project_id, status, assigned_to, labels, estimated_minutes")
          .in("project_id", projectIds)
      : { data: [], error: null };

  let tasks = tasksResult.data;
  let tasksError = tasksResult.error;

  if (tasksError && isMissingEstimatedColumnError(tasksError)) {
    const fallback =
      projectIds.length > 0
        ? await supabase
            .from("tasks")
            .select("id, project_id, status, assigned_to, labels")
            .in("project_id", projectIds)
        : { data: [], error: null };

    tasks = (fallback.data || []).map((task) => ({ ...task, estimated_minutes: null }));
    tasksError = fallback.error;
  }

  if (tasksError) {
    console.error("Error cargando métricas de tareas:", tasksError.message);
  }

  const tasksByProject = new Map<string, TaskRow[]>();
  ((tasks || []) as TaskRow[]).forEach((task) => {
    const current = tasksByProject.get(task.project_id) || [];
    current.push(task);
    tasksByProject.set(task.project_id, current);
  });

  const matchesEstimate = (relatedTasks: TaskRow[]) => {
    if (!estimate) return true;
    const estimates = relatedTasks
      .map((task) => task.estimated_minutes)
      .filter((value): value is number => typeof value === "number");
    if (estimates.length === 0) return false;
    const min = Math.min(...estimates);
    if (estimate === "short") return min <= 30;
    if (estimate === "medium") return min > 30 && min <= 90;
    if (estimate === "long") return min > 90;
    return true;
  };
  const matchesTrack = (relatedTasks: TaskRow[]) =>
    !track || relatedTasks.some((task) => hasAnyTrackLabel(task.labels || null, track));

  const filteredProjects = projectRows.filter((project) => {
    const relatedTasks = tasksByProject.get(project.id) || [];
    const techMatch =
      !tech ||
      (project.tech_stack || []).some((item) => item.toLowerCase() === tech.toLowerCase());
    const difficultyMatch = !difficulty || project.difficulty === difficulty;
    const favoriteMatch = favorites !== "1" || favoriteProjectIds.has(project.id);
    const estimateMatch = matchesEstimate(relatedTasks);
    const trackMatch = matchesTrack(relatedTasks);

    return techMatch && difficultyMatch && favoriteMatch && estimateMatch && trackMatch;
  });

  const availableTech = [
    ...new Set(projectRows.flatMap((project) => project.tech_stack || [])),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <PublicLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="p-8">
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

        {filteredProjects.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No active projects yet" : "No hay proyectos activos por ahora"}
            description={
              locale === "en"
                ? "Come back soon. New repositories and tasks are published continuously."
                : "Vuelve pronto. Nuevos repositorios y tareas se publican continuamente."
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProjects.map((project) => {
              const relatedTasks = tasksByProject.get(project.id) || [];
              const openTasks = relatedTasks.filter((task) => task.status === "open").length;
              const contributors = new Set(
                relatedTasks
                  .map((task) => task.assigned_to)
                  .filter((id): id is string => typeof id === "string" && id.length > 0)
              ).size;

              return (
                <article
                  key={project.id}
                  className="rounded-2xl border border-white/20 bg-black/20 p-5"
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
                    <Badge tone="info">{openTasks} tareas abiertas</Badge>
                    <Badge tone="default">
                      {contributors} {locale === "en" ? "developers contributing" : "developers contribuyendo"}
                    </Badge>
                    <Badge tone="warning">
                      {locale === "en" ? "Difficulty" : "Dificultad"}: {project.difficulty || (locale === "en" ? "not specified" : "no especificada")}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(project.tech_stack || []).slice(0, 6).map((tech) => (
                      <Badge key={`${project.id}-${tech}`}>{tech}</Badge>
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
        )}
      </SectionCard>
    </PublicLayout>
  );
}
