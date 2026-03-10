import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";

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
};

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, name, short_description, description, repo_url, difficulty, tech_stack")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const projectRows = (projects || []) as ProjectRow[];
  const projectIds = projectRows.map((project) => project.id);

  const { data: tasks, error: tasksError } =
    projectIds.length > 0
      ? await supabase
          .from("tasks")
          .select("id, project_id, status, assigned_to")
          .in("project_id", projectIds)
      : { data: [], error: null };

  if (tasksError) {
    console.error("Error cargando métricas de tareas:", tasksError.message);
  }

  const tasksByProject = new Map<string, TaskRow[]>();
  ((tasks || []) as TaskRow[]).forEach((task) => {
    const current = tasksByProject.get(task.project_id) || [];
    current.push(task);
    tasksByProject.set(task.project_id, current);
  });

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title="Proyectos open source"
          description="Explora proyectos reales, tareas abiertas y oportunidades para contribuir con experiencia demostrable."
        />

        {projectRows.length === 0 ? (
          <EmptyState
            title="No hay proyectos activos por ahora"
            description="Vuelve pronto. Nuevos repositorios y tareas se publican continuamente."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projectRows.map((project) => {
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
                    {project.name || "Proyecto sin nombre"}
                  </h2>
                  <p className="mt-2 text-sm text-gray-300">
                    {project.short_description ||
                      project.description ||
                      "Sin descripción disponible."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone="info">{openTasks} tareas abiertas</Badge>
                    <Badge tone="default">{contributors} developers contribuyendo</Badge>
                    <Badge tone="warning">
                      Dificultad: {project.difficulty || "no especificada"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(project.tech_stack || []).slice(0, 6).map((tech) => (
                      <Badge key={`${project.id}-${tech}`}>{tech}</Badge>
                    ))}
                    {(project.tech_stack || []).length === 0 ? (
                      <span className="text-xs text-gray-500">Tech stack no especificado</span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.slug ? (
                      <Link
                        href={`/projects/${project.slug}`}
                        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                      >
                        Ver proyecto
                      </Link>
                    ) : (
                      <span className="inline-flex rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-500">
                        Proyecto sin slug
                      </span>
                    )}
                    {project.repo_url ? (
                      <Link
                        href={project.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
                      >
                        Repo GitHub
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}

