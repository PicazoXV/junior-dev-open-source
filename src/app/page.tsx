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
import { getCurrentMessages } from "@/lib/i18n/server";
import GitHubLoginButton from "@/components/github-login-button";
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

export default async function HomePage() {
  const { locale, messages } = await getCurrentMessages();
  const user = await createProfileIfNeeded();

  if (!user) {
    const supabase = await createClient();
    const recentContributions = await getRecentContributions(supabase, 6);

    return (
      <main className="app-bg min-h-screen p-6">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <HeroSection isAuthenticated={false} />
          <SectionCard className="p-8">
            <PageHeader
              title={locale === "en" ? "Start here" : "Empieza aquí"}
              description={
                locale === "en"
                  ? "Follow this quick path to understand PrimerIssue and make your first real contribution."
                  : "Sigue esta ruta rápida para entender PrimerIssue y preparar tu primera contribución real."
              }
            />
            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-xl border border-white/15 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-orange-300">01</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {locale === "en" ? "Read the contribution guide" : "Lee la guía de primera contribución"}
                </p>
                <Link
                  href="/first-contribution"
                  className="mt-3 inline-flex rounded-lg border border-white/20 px-2.5 py-1 text-xs text-gray-300 hover:border-orange-500/35 hover:text-orange-300"
                >
                  {locale === "en" ? "Open guide" : "Abrir guía"}
                </Link>
              </article>
              <article className="rounded-xl border border-white/15 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-orange-300">02</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {locale === "en" ? "Explore beginner tasks" : "Explora tareas beginner"}
                </p>
                <Link
                  href="/good-first-issues"
                  className="mt-3 inline-flex rounded-lg border border-white/20 px-2.5 py-1 text-xs text-gray-300 hover:border-orange-500/35 hover:text-orange-300"
                >
                  {locale === "en" ? "View Good First Issues" : "Ver Good First Issues"}
                </Link>
              </article>
              <article className="rounded-xl border border-white/15 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-orange-300">03</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {locale === "en" ? "Join and request your first task" : "Únete y solicita tu primera tarea"}
                </p>
                <div className="mt-3">
                  <GitHubLoginButton
                    label={locale === "en" ? "Continue with GitHub" : "Continuar con GitHub"}
                    className="rounded-lg px-2.5 py-1 text-xs"
                  />
                </div>
              </article>
            </div>
          </SectionCard>
          <HomeMarketingSections isAuthenticated={false} />
          <SectionCard className="p-8">
            <PageHeader
              title={locale === "en" ? "Recent contributions" : "Contribuciones recientes"}
              description={
                locale === "en"
                  ? "Recent developer activity building real open source experience on the platform."
                  : "Actividad reciente de developers construyendo experiencia real en la plataforma."
              }
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
                      {item.type === "merged_pr"
                        ? locale === "en"
                          ? "merged PR in"
                          : "merged PR en"
                        : locale === "en"
                          ? "completed task in"
                          : "completó tarea en"}{" "}
                      <span className="text-white">{item.projectName}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{item.taskTitle}</p>
                    <div className="mt-3 flex gap-2">
                      {item.projectSlug ? (
                        <Link
                          href={`/projects/${item.projectSlug}`}
                          className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-300 hover:border-orange-500/30 hover:text-orange-300"
                        >
                          {locale === "en" ? "View project" : "Ver proyecto"}
                        </Link>
                      ) : null}
                      {item.githubUrl ? (
                        <Link
                          href={item.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                        >
                          {locale === "en" ? "View on GitHub" : "Ver en GitHub"}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title={locale === "en" ? "No recent contributions yet" : "Todavía no hay contribuciones recientes"}
                description={
                  locale === "en"
                    ? "Once developers complete tasks and merge PRs, they will appear here."
                    : "Cuando los developers completen tareas y hagan merge de PRs, aparecerán aquí."
                }
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

  const tasksResult =
    projectIds.length > 0
      ? await supabase
          .from("tasks")
          .select("id, project_id, title, description, status, difficulty, estimated_minutes, labels, github_issue_url")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  let tasks = tasksResult.data;
  let tasksError = tasksResult.error;

  if (tasksError && isMissingEstimatedColumnError(tasksError)) {
    const fallback =
      projectIds.length > 0
        ? await supabase
            .from("tasks")
            .select("id, project_id, title, description, status, difficulty, labels, github_issue_url")
            .in("project_id", projectIds)
            .order("created_at", { ascending: false })
        : { data: [], error: null };

    tasks = (fallback.data || []).map((task) => ({ ...task, estimated_minutes: null }));
    tasksError = fallback.error;
  }

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
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-8">
      <HeroSection isAuthenticated />
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Continue your journey" : "Continúa tu camino"}
          description={
            locale === "en"
              ? "Quick shortcuts to keep momentum in PrimerIssue."
              : "Accesos rápidos para mantener tu progreso en PrimerIssue."
          }
        />
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/15 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-orange-300">01</p>
            <p className="mt-2 text-sm font-medium text-white">
              {locale === "en" ? "Find your next beginner task" : "Encuentra tu siguiente tarea beginner"}
            </p>
            <Link
              href="/good-first-issues"
              className="mt-3 inline-flex rounded-lg border border-white/20 px-2.5 py-1 text-xs text-gray-300 hover:border-orange-500/35 hover:text-orange-300"
            >
              {locale === "en" ? "Open issues hub" : "Abrir hub de issues"}
            </Link>
          </article>
          <article className="rounded-xl border border-white/15 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-orange-300">02</p>
            <p className="mt-2 text-sm font-medium text-white">
              {locale === "en" ? "Review your progress dashboard" : "Revisa tu dashboard de progreso"}
            </p>
            <Link
              href="/dashboard"
              className="mt-3 inline-flex rounded-lg border border-white/20 px-2.5 py-1 text-xs text-gray-300 hover:border-orange-500/35 hover:text-orange-300"
            >
              {locale === "en" ? "Open dashboard" : "Abrir dashboard"}
            </Link>
          </article>
          <article className="rounded-xl border border-white/15 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-orange-300">03</p>
            <p className="mt-2 text-sm font-medium text-white">
              {locale === "en" ? "Explore active projects" : "Explora proyectos activos"}
            </p>
            <Link
              href="/projects"
              className="mt-3 inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
            >
              {locale === "en" ? "Browse projects" : "Ver proyectos"}
            </Link>
          </article>
        </div>
      </SectionCard>
      <HomeMarketingSections isAuthenticated />
      <SectionCard className="p-8">
        <PageHeader
          title={
            locale === "en"
              ? `Project explorer in ${messages.brand.name}`
              : `Explorador de proyectos en ${messages.brand.name}`
          }
          description={
            locale === "en"
              ? "Select a project and open tasks without leaving this view."
              : "Selecciona un proyecto y abre sus tareas sin salir de esta vista."
          }
        />
        <ProjectExplorer projects={explorerProjects} />
      </SectionCard>
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Recent contributions" : "Contribuciones recientes"}
          description={
            locale === "en"
              ? "Latest completed tasks and merged PRs from the platform community."
              : "Últimas tareas completadas y PRs merged por la comunidad de la plataforma."
          }
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
                  {item.type === "merged_pr"
                    ? locale === "en"
                      ? "merged PR in"
                      : "merged PR en"
                    : locale === "en"
                      ? "completed task in"
                      : "completó tarea en"}{" "}
                  <span className="text-white">{item.projectName}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">{item.taskTitle}</p>
                <div className="mt-3 flex gap-2">
                  {item.projectSlug ? (
                    <Link
                      href={`/projects/${item.projectSlug}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-300 hover:border-orange-500/30 hover:text-orange-300"
                    >
                      {locale === "en" ? "View project" : "Ver proyecto"}
                    </Link>
                  ) : null}
                  {item.githubUrl ? (
                    <Link
                      href={item.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                    >
                      {locale === "en" ? "View on GitHub" : "Ver en GitHub"}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={locale === "en" ? "No recent contributions yet" : "Todavía no hay contribuciones recientes"}
            description={
              locale === "en"
                ? "Once developers complete tasks and merge PRs, they will appear here."
                : "Cuando los developers completen tareas y hagan merge de PRs, aparecerán aquí."
            }
          />
        )}
      </SectionCard>
    </AppLayout>
  );
}
