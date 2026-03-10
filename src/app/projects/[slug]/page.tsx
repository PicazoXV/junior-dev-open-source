import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import TaskCard from "@/components/task-card";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import { isReviewerRole } from "@/lib/roles";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const resolvedParams = await params;
  const rawSlug = resolvedParams?.slug;

  if (!rawSlug || typeof rawSlug !== "string") {
    notFound();
  }

  const slug = rawSlug.trim().toLowerCase();
  const supabase = await createClient();

  if (!slug) {
    notFound();
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug, name, short_description, description, repo_url, tech_stack")
    .eq("slug", slug)
    .maybeSingle();

  if (projectError) {
    console.error("Error cargando proyecto:", projectError.message);
    notFound();
  }

  if (!project) {
    notFound();
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, status, difficulty, github_issue_url")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("Error cargando tareas:", tasksError.message);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const canEdit = isReviewerRole(profile?.role);

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={project.name}
          description={project.short_description || "Sin descripción corta disponible."}
          actions={
            <>
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                Volver a proyectos
              </Link>
              {canEdit ? (
                <Link
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                >
                  Editar proyecto
                </Link>
              ) : null}
            </>
          }
        />

        <section className="rounded-2xl border border-white/20 bg-black/20 p-6">
          <p className="whitespace-pre-line text-gray-200">
            {project.description || "Sin descripción detallada disponible."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {project.tech_stack && project.tech_stack.length > 0 ? (
              project.tech_stack.map((tech: string) => (
                <Badge key={`${project.id}-${tech}`}>{tech}</Badge>
              ))
            ) : (
              <span className="text-xs text-gray-500">Tech stack no especificado.</span>
            )}
          </div>

          {project.repo_url ? (
            <Link
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Ver repositorio
            </Link>
          ) : (
            <p className="mt-5 text-sm text-gray-500">Repositorio no disponible.</p>
          )}
        </section>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Tareas del proyecto"
          description="Explora las tareas disponibles y su dificultad."
        />

        {tasks && tasks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Este proyecto todavía no tiene tareas"
            description="Cuando el maintainer publique tareas, aparecerán aquí para que puedas solicitarlas."
          />
        )}
      </SectionCard>
    </AppLayout>
  );
}
