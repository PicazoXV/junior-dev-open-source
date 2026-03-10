import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import HeroSection from "@/components/hero-section";
import ProjectExplorer from "@/components/project-explorer";
import PageHeader from "@/components/ui/page-header";
import HomeMarketingSections from "@/components/home-marketing-sections";
import Link from "next/link";
import EmptyState from "@/components/ui/empty-state";
import { getRecentContributions } from "@/lib/activity-feed";

export default async function HomePage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    const supabase = await createClient();
    const recentContributions = await getRecentContributions(supabase, 6);

    return (
      <main className="app-bg min-h-screen p-6">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <HeroSection isAuthenticated={false} />
          <HomeMarketingSections isAuthenticated={false} />
          <SectionCard className="p-8">
            <PageHeader
              title="Recent contributions"
              description="Actividad reciente de developers construyendo experiencia real en la plataforma."
            />
            {recentContributions.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {recentContributions.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-white/15 bg-black/20 p-4"
                  >
                    <p className="text-sm text-gray-200">
                      <span className="text-orange-300">{item.actorName}</span>{" "}
                      {item.type === "merged_pr" ? "merged PR en" : "completó tarea en"}{" "}
                      <span className="text-white">{item.projectName}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{item.taskTitle}</p>
                    <div className="mt-3 flex gap-2">
                      {item.projectSlug ? (
                        <Link
                          href={`/projects/${item.projectSlug}`}
                          className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-300 hover:border-orange-500/30 hover:text-orange-300"
                        >
                          Ver proyecto
                        </Link>
                      ) : null}
                      {item.githubUrl ? (
                        <Link
                          href={item.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                        >
                          Ver en GitHub
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Todavía no hay contribuciones recientes"
                description="Cuando los developers completen tareas y hagan merge de PRs, aparecerán aquí."
              />
            )}
          </SectionCard>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, name, short_description")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const projectIds = (projects || []).map((project) => project.id);

  const { data: tasks, error: tasksError } =
    projectIds.length > 0
      ? await supabase
          .from("tasks")
          .select("id, project_id, title, description, status, difficulty, labels, github_issue_url")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (tasksError) {
    console.error("Error cargando tareas de proyectos:", tasksError.message);
  }

  const tasksByProject = new Map<string, typeof tasks>();
  (tasks || []).forEach((task) => {
    const currentTasks = tasksByProject.get(task.project_id) || [];
    currentTasks.push(task);
    tasksByProject.set(task.project_id, currentTasks);
  });

  const explorerProjects = (projects || []).map((project) => ({
    ...project,
    tasks: tasksByProject.get(project.id) || [],
  }));
  const recentContributions = await getRecentContributions(supabase, 6);

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <HeroSection isAuthenticated />
      <HomeMarketingSections isAuthenticated />
      <SectionCard className="p-8">
        <PageHeader
          title="Explorador de proyectos en MiPrimerIssue"
          description="Selecciona un proyecto y abre sus tareas sin salir de esta vista."
        />
        <ProjectExplorer projects={explorerProjects} />
      </SectionCard>
      <SectionCard className="p-8">
        <PageHeader
          title="Recent contributions"
          description="Últimas tareas completadas y PRs merged por la comunidad de la plataforma."
        />
        {recentContributions.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {recentContributions.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-white/15 bg-black/20 p-4"
              >
                <p className="text-sm text-gray-200">
                  <span className="text-orange-300">{item.actorName}</span>{" "}
                  {item.type === "merged_pr" ? "merged PR en" : "completó tarea en"}{" "}
                  <span className="text-white">{item.projectName}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">{item.taskTitle}</p>
                <div className="mt-3 flex gap-2">
                  {item.projectSlug ? (
                    <Link
                      href={`/projects/${item.projectSlug}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-300 hover:border-orange-500/30 hover:text-orange-300"
                    >
                      Ver proyecto
                    </Link>
                  ) : null}
                  {item.githubUrl ? (
                    <Link
                      href={item.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                    >
                      Ver en GitHub
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Todavía no hay contribuciones recientes"
            description="Cuando los developers completen tareas y hagan merge de PRs, aparecerán aquí."
          />
        )}
      </SectionCard>
    </AppLayout>
  );
}
