import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import TaskFilterPanel from "@/components/task-filter-panel";
import { isReviewerRole } from "@/lib/roles";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
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

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const currentUser = await createProfileIfNeeded();
  const supabase = await createClient();

  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;
  const slug = typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";

  if (!slug) {
    notFound();
  }

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

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, status, difficulty, labels, github_issue_url, assigned_to")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("Error cargando tareas:", tasksError.message);
  }

  const taskRows = (tasks || []) as TaskRow[];
  const openTasks = taskRows.filter((task) => task.status === "open");

  const contributorIds = [
    ...new Set(
      taskRows
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
  if (currentUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .maybeSingle();
    canEdit = isReviewerRole(profile?.role);
  }

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={project.name || "Proyecto"}
          description={project.short_description || "Proyecto open source en MiPrimerIssue."}
          actions={
            <>
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
              >
                Volver a proyectos
              </Link>
              {canEdit ? (
                <Link
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
                >
                  Editar proyecto
                </Link>
              ) : null}
            </>
          }
        />

        <div className="rounded-2xl border border-white/20 bg-black/20 p-6">
          <p className="whitespace-pre-line text-gray-200">
            {project.description || "Sin descripción detallada disponible."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="info">{openTasks.length} tareas abiertas</Badge>
            <Badge tone="warning">Dificultad: {project.difficulty || "no especificada"}</Badge>
            <Badge tone="default">
              {contributorRows.length} developers contribuyendo vía MiPrimerIssue
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(project.tech_stack || []).map((tech: string) => (
              <Badge key={`${project.id}-${tech}`}>{tech}</Badge>
            ))}
            {(project.tech_stack || []).length === 0 ? (
              <span className="text-xs text-gray-500">Tech stack no especificado.</span>
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
                Ver repo GitHub
              </Link>
            ) : (
              <p className="text-sm text-gray-500">Repositorio no disponible.</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Developers contribuyendo"
          description="Personas que ya están colaborando en este proyecto desde MiPrimerIssue."
        />
        {contributorRows.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {contributorRows.map((contributor) => (
              <div
                key={contributor.id}
                className="flex items-center justify-between rounded-xl border border-white/15 bg-black/20 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {contributor.full_name || contributor.github_username || "Developer"}
                  </p>
                  <p className="text-xs text-gray-400">
                    @{contributor.github_username || "sin-username"}
                  </p>
                </div>
                {contributor.github_username ? (
                  <Link
                    href={`/dev/${contributor.github_username}`}
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  >
                    Ver perfil
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Todavía no hay contributors en este proyecto"
            description="Cuando se aprueben tareas y se asignen developers, aparecerán aquí."
          />
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Tareas disponibles"
          description="Filtra por dificultad o etiquetas como frontend, backend, testing o good first issue."
        />
        {taskRows.length > 0 ? (
          <TaskFilterPanel tasks={taskRows} />
        ) : (
          <EmptyState
            title="Este proyecto todavía no tiene tareas"
            description="El maintainer aún no ha publicado tareas para colaborar."
          />
        )}
      </SectionCard>
    </AppLayout>
  );
}

