import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import { isReviewerRole } from "@/lib/roles";
import { getUserProgress } from "@/lib/user-progress";
import LevelBadge from "@/components/ui/level-badge";
import { getUserBadges } from "@/lib/user-badges";
import AchievementBadge from "@/components/ui/achievement-badge";
import StatCard from "@/components/ui/stat-card";
import { getRecommendedTasksForUser } from "@/lib/recommendations";
import EmptyState from "@/components/ui/empty-state";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import Badge from "@/components/ui/badge";
import { getFirstIssueChallengeProgress } from "@/lib/first-issue-challenge";
import { getUserOnboardingState } from "@/lib/onboarding";
import OnboardingChecklist from "@/components/onboarding-checklist";
import { getCurrentMessages } from "@/lib/i18n/server";
import { getUserRoadmap } from "@/lib/roadmap";
import UserRoadmapCard from "@/components/roadmap/user-roadmap-card";
import { getUserTimeline } from "@/lib/user-timeline";
import UserTimelineCard from "@/components/timeline/user-timeline-card";
import { getDashboardFavorites } from "@/lib/favorites";
import { getMaintainerStats } from "@/lib/maintainer-stats";
import { getVerifiedContributions } from "@/lib/verified-contributions";
import { getUserStreaks } from "@/lib/user-streaks";
import DashboardRoadmapGuide from "@/components/roadmap/dashboard-roadmap-guide";
import DashboardInfoPanels from "@/components/dashboard/dashboard-info-panels";
import { parseTechStack } from "@/lib/profile-options";
import StatusBadge from "@/components/ui/status-badge";
import Table from "@/components/ui/table";
import DashboardProfileEditor from "@/components/dashboard/dashboard-profile-editor";
import DashboardFlowSteps from "@/components/dashboard/dashboard-flow-steps";

type DashboardAssignedTask = {
  id: string;
  project_id: string | null;
  title: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
};

type DashboardTaskProject = {
  id: string;
  name: string | null;
  slug: string | null;
};

type DashboardPageProps = {
  searchParams?: Promise<{
    editProfile?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error cargando perfil:", error.message);
  }

  const canReviewRequests = isReviewerRole(profile?.role);
  const { locale, messages } = await getCurrentMessages();
  const progress = await getUserProgress(supabase, user.id, profile?.tech_stack || null);
  const onboarding = await getUserOnboardingState({
    supabase,
    userId: user.id,
    profile: profile
      ? {
          full_name: profile.full_name || null,
          bio: profile.bio || null,
          tech_stack: profile.tech_stack || null,
          location: profile.location || null,
        }
      : null,
    progress,
    messages,
  });
  const challenge = await getFirstIssueChallengeProgress(supabase, user.id);
  const badges = getUserBadges(progress);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const recommendedTasks = await getRecommendedTasksForUser(supabase, user.id, 6, locale);
  const roadmap = getUserRoadmap(progress, locale);
  const timeline = await getUserTimeline({ supabase, userId: user.id, locale, limit: 12 });
  const favorites = await getDashboardFavorites({ supabase, userId: user.id, locale, limit: 8 });

  const { data: assignedTasksData, error: assignedTasksError } = await supabase
    .from("tasks")
    .select("id, project_id, title, status, difficulty")
    .eq("assigned_to", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  if (assignedTasksError) {
    console.error("Error cargando tareas asignadas del dashboard:", assignedTasksError.message);
  }

  const assignedTasks = (assignedTasksData || []) as DashboardAssignedTask[];
  const assignedProjectIds = [
    ...new Set(assignedTasks.map((task) => task.project_id).filter(Boolean)),
  ] as string[];

  const { data: assignedProjectsData, error: assignedProjectsError } =
    assignedProjectIds.length > 0
      ? await supabase
          .from("projects")
          .select("id, name, slug")
          .in("id", assignedProjectIds)
      : { data: [], error: null };

  if (assignedProjectsError) {
    console.error("Error cargando proyectos de tareas asignadas:", assignedProjectsError.message);
  }

  const assignedProjectById = new Map(
    ((assignedProjectsData || []) as DashboardTaskProject[]).map((project) => [project.id, project])
  );

  const verifiedContributions = await getVerifiedContributions({
    supabase,
    userId: user.id,
    limit: 6,
  });
  const maintainerStats = canReviewRequests
    ? await getMaintainerStats({ supabase, maintainerId: user.id })
    : null;
  const streaks = await getUserStreaks(supabase, user.id);
  const githubUsername = profile?.github_username || (locale === "en" ? "your-username" : "tu-username");
  const readmeBadgeSnippet = `[![Contributing via MiPrimerIssue](https://img.shields.io/badge/Contributing%20via-MiPrimerIssue-orange)](https://miprimerissue.dev/dev/${githubUsername})`;
  const profileRoles = ((profile?.roles as string[] | null | undefined) || []).filter(Boolean);
  const techStackTags = parseTechStack(profile?.tech_stack);
  const resolvedSearchParams = await searchParams;
  const openProfileEdit = resolvedSearchParams?.editProfile === "1";
  const nextLevel =
    progress.level === "beginner"
      ? "junior"
      : progress.level === "junior"
        ? "contributor"
        : progress.level === "contributor"
          ? "maintainer"
          : locale === "en"
            ? "max level"
            : "nivel máximo";

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="surface-accent p-8 lg:p-10">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.18em] text-orange-200/90">MiPrimerIssue</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {locale === "en"
              ? "Welcome back, keep building real experience"
              : "Bienvenido de nuevo, sigue construyendo experiencia real"}
          </h1>
          <p className="mt-3 text-sm text-gray-200/90">
            {locale === "en"
              ? "Your control center focused on what to do next, your assigned tasks and your progress."
              : "Tu centro de control enfocado en qué hacer ahora, tus tareas asignadas y tu progreso."}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <LevelBadge level={progress.level} />
            <Badge tone="info">
              {locale === "en" ? `${progress.completedTasks} completed tasks` : `${progress.completedTasks} tareas completadas`}
            </Badge>
            <Badge tone="warning">
              {locale === "en" ? `${progress.inProgressTasks} active tasks` : `${progress.inProgressTasks} tareas activas`}
            </Badge>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/dashboard?editProfile=1#dashboard-profile-editor"
              className="inline-flex rounded-lg border border-orange-500/45 bg-orange-500/15 px-3 py-2 text-sm font-medium text-orange-200 transition hover:border-orange-400 hover:bg-orange-500/20 hover:text-orange-100"
            >
              {locale === "en" ? "Edit profile" : "Editar perfil"}
            </Link>
            <Link
              href="/dashboard/my-tasks"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900/80 px-3 py-2 text-sm font-medium text-gray-100 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-200"
            >
              {locale === "en" ? "Go to my tasks" : "Ir a mis tareas"}
            </Link>
            <Link
              href="/buena-primera-issue"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900/80 px-3 py-2 text-sm font-medium text-gray-100 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-200"
            >
              {locale === "en" ? "Explore First Good Issue" : "Explorar Buena Primera Issue"}
            </Link>
            {canReviewRequests ? (
              <Link
                href="/dashboard/requests"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900/80 px-3 py-2 text-sm font-medium text-gray-100 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-200"
              >
                {locale === "en" ? "Review requests" : "Ver solicitudes"}
              </Link>
            ) : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "How to advance in MiPrimerIssue" : "Cómo avanzar en MiPrimerIssue"}
          description={
            locale === "en"
              ? "A clear 4-step guide to move from finding tasks to completing real contributions."
              : "Una guía clara de 4 pasos para pasar de encontrar tareas a completar contribuciones reales."
          }
        />

        <DashboardFlowSteps />
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "1. Next recommended step" : "1. Próximo paso recomendado"}
          description={
            locale === "en"
              ? "Focus on one concrete next action and keep momentum."
              : "Concéntrate en una siguiente acción concreta y mantén el ritmo."
          }
        />

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
          <DashboardInfoPanels
            primerIssuePanel={
              <DashboardRoadmapGuide userId={user.id} onboardingCompleted={onboarding.isCompleted} />
            }
            onboardingPanel={<OnboardingChecklist onboarding={onboarding} />}
            roadmapPanel={<UserRoadmapCard roadmap={roadmap} locale={locale} />}
            priorityPanel={onboarding.isCompleted ? "roadmap" : "onboarding"}
          />

          <div className="space-y-4">
            <section className="surface-accent rounded-2xl p-5">
              <h3 className="text-base font-semibold text-white">
                {locale === "en" ? "First Issue Challenge" : "First Issue Challenge"}
              </h3>
              <p className="mt-1 text-sm text-gray-200/90">
                {locale === "en"
                  ? "Complete your first open source contribution in 7 days."
                  : "Completa tu primera contribución open source en 7 días."}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {challenge.completedInTime ? (
                  <Badge tone="success">{locale === "en" ? "Challenge completed" : "Challenge completado"}</Badge>
                ) : challenge.isExpired ? (
                  <Badge tone="danger">{locale === "en" ? "Challenge ended" : "Challenge finalizado"}</Badge>
                ) : (
                  <Badge tone="warning">{locale === "en" ? "Challenge active" : "Challenge activo"}</Badge>
                )}
                {challenge.deadlineAt ? (
                  <Badge tone="info">
                    {challenge.isExpired
                      ? locale === "en"
                        ? "Outside time window"
                        : "Fuera de ventana"
                      : locale === "en"
                        ? `${challenge.daysRemaining} day(s) left`
                        : `${challenge.daysRemaining} día(s) restantes`}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="surface-subcard rounded-xl p-4">
                  <p className="text-sm text-gray-400">{locale === "en" ? "Task requested" : "Tarea solicitada"}</p>
                  <p className="mt-1 text-sm text-white">
                    {challenge.steps.taskRequested
                      ? locale === "en"
                        ? "Completed"
                        : "Completado"
                      : locale === "en"
                        ? "Pending"
                        : "Pendiente"}
                  </p>
                </div>
                <div className="surface-subcard rounded-xl p-4">
                  <p className="text-sm text-gray-400">{locale === "en" ? "Task approved" : "Tarea aprobada"}</p>
                  <p className="mt-1 text-sm text-white">
                    {challenge.steps.taskApproved
                      ? locale === "en"
                        ? "Completed"
                        : "Completado"
                      : locale === "en"
                        ? "Pending"
                        : "Pendiente"}
                  </p>
                </div>
                <div className="surface-subcard rounded-xl p-4">
                  <p className="text-sm text-gray-400">{locale === "en" ? "PR opened" : "PR abierto"}</p>
                  <p className="mt-1 text-sm text-white">
                    {challenge.steps.prOpened
                      ? locale === "en"
                        ? "Completed"
                        : "Completado"
                      : locale === "en"
                        ? "Pending"
                        : "Pendiente"}
                  </p>
                </div>
                <div className="surface-subcard rounded-xl p-4">
                  <p className="text-sm text-gray-400">{locale === "en" ? "PR merged" : "PR mergeado"}</p>
                  <p className="mt-1 text-sm text-white">
                    {challenge.steps.prMerged
                      ? locale === "en"
                        ? "Completed"
                        : "Completado"
                      : locale === "en"
                        ? "Pending"
                        : "Pendiente"}
                  </p>
                </div>
              </div>
            </section>

            <section className="surface-subcard rounded-2xl p-5">
              <h3 className="text-base font-semibold text-white">
                {locale === "en" ? "Quick focus" : "Enfoque rápido"}
              </h3>
              <p className="mt-1 text-sm text-gray-300">
                {progress.inProgressTasks > 0
                  ? locale === "en"
                    ? `You already have ${progress.inProgressTasks} active task(s). Continue before requesting new ones.`
                    : `Ya tienes ${progress.inProgressTasks} tarea(s) activa(s). Continúa antes de pedir nuevas.`
                  : locale === "en"
                    ? "You have no active tasks. Pick one from First Good Issue and request it."
                    : "No tienes tareas activas. Elige una Buena Primera Issue y solicítala."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={progress.inProgressTasks > 0 ? "/dashboard/my-tasks" : "/buena-primera-issue"}
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                >
                  {progress.inProgressTasks > 0
                    ? locale === "en"
                      ? "Continue my tasks"
                      : "Continuar mis tareas"
                    : locale === "en"
                      ? "Find a task"
                      : "Buscar una tarea"}
                </Link>
                <Link
                  href="/dashboard/my-requests"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  {locale === "en" ? "View my requests" : "Ver mis solicitudes"}
                </Link>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Recommended tasks for right now" : "Tareas recomendadas para ahora"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {locale === "en"
              ? "Suggestions based on your profile, level and recent activity."
              : "Sugerencias según tu perfil, nivel y actividad reciente."}
          </p>

          {recommendedTasks.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {recommendedTasks.map((task) => (
                <article key={task.id} className="surface-subcard rounded-xl p-4">
                  <p className="text-sm font-semibold text-white">{task.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{task.projectName}</p>
                  <p className="mt-2 text-sm text-gray-300">
                    {task.description || (locale === "en" ? "No description available." : "Sin descripción disponible.")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DifficultyBadge difficulty={task.difficulty} />
                    {task.estimatedMinutes ? (
                      <Badge tone="info">{task.estimatedMinutes} min</Badge>
                    ) : null}
                    {(task.labels || []).slice(0, 3).map((label) => (
                      <Badge key={`${task.id}-${label}`}>{label}</Badge>
                    ))}
                  </div>
                  {task.reasons.length > 0 ? (
                    <p className="mt-2 text-xs text-gray-400">{task.reasons.join(" · ")}</p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                    >
                      {locale === "en" ? "View task" : "Ver tarea"}
                    </Link>
                    {task.projectSlug ? (
                      <Link
                        href={`/projects/${task.projectSlug}`}
                        className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                      >
                        {locale === "en" ? "View project" : "Ver proyecto"}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title={locale === "en" ? "No recommendations yet" : "No hay recomendaciones por ahora"}
                description={
                  locale === "en"
                    ? "Complete more tasks or add tech stack in your profile to improve suggestions."
                    : "Completa más tareas o añade tech stack en tu perfil para mejorar las sugerencias."
                }
              />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "2. Assigned tasks" : "2. Tareas asignadas"}
          description={
            locale === "en"
              ? "Your active work queue with direct access to each task."
              : "Tu cola de trabajo activa con acceso directo a cada tarea."
          }
          actions={
            <Link
              href="/dashboard/my-tasks"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              {locale === "en" ? "View all my tasks" : "Ver todas mis tareas"}
            </Link>
          }
        />

        {assignedTasks.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "You have no assigned tasks" : "No tienes tareas asignadas"}
            description={
              locale === "en"
                ? "Explore open tasks and request one to start building your contribution history."
                : "Explora tareas abiertas y solicita una para empezar a construir tu historial de contribuciones."
            }
            action={
              <Link
                href="/buena-primera-issue"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Explore issues" : "Explorar issues"}
              </Link>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400">
                <th className="px-4 py-3 font-medium">{locale === "en" ? "Task" : "Tarea"}</th>
                <th className="px-4 py-3 font-medium">{locale === "en" ? "Project" : "Proyecto"}</th>
                <th className="px-4 py-3 font-medium">{locale === "en" ? "Status" : "Estado"}</th>
                <th className="px-4 py-3 font-medium">{locale === "en" ? "Difficulty" : "Dificultad"}</th>
                <th className="px-4 py-3 font-medium">{locale === "en" ? "Detail" : "Detalle"}</th>
              </tr>
            </thead>
            <tbody>
              {assignedTasks.map((task) => {
                const project = task.project_id ? assignedProjectById.get(task.project_id) : null;

                return (
                  <tr key={task.id} className="border-t border-white/10">
                    <td className="px-4 py-3 align-top text-white">
                      {task.title || (locale === "en" ? "Untitled task" : "Tarea sin título")}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-300">
                      {project?.slug ? (
                        <Link href={`/projects/${project.slug}`} className="hover:text-orange-300 hover:underline">
                          {project.name || (locale === "en" ? "Unnamed project" : "Proyecto sin nombre")}
                        </Link>
                      ) : (
                        project?.name || (locale === "en" ? "Project not available" : "Proyecto no disponible")
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <DifficultyBadge difficulty={task.difficulty} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                      >
                        {locale === "en" ? "View task" : "Ver tarea"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "3. Personal progress" : "3. Progreso personal"}
          description={
            locale === "en"
              ? "Track your growth and contribution outcomes in one place."
              : "Sigue tu crecimiento y resultados de contribución en un solo lugar."
          }
        />

        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label={locale === "en" ? "Tasks completed" : "Tareas completadas"} value={progress.completedTasks} />
          <StatCard label={locale === "en" ? "Current tasks" : "Tareas actuales"} value={progress.inProgressTasks} />
          <StatCard label="PRs merged" value={progress.mergedPullRequests} />
          <StatCard label={locale === "en" ? "Next level" : "Siguiente nivel"} value={nextLevel} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <StatCard
            label={locale === "en" ? "Current streak" : "Racha actual"}
            value={`${streaks.currentStreakDays} ${locale === "en" ? "days" : "días"}`}
          />
          <StatCard
            label={locale === "en" ? "Longest streak" : "Mejor racha"}
            value={`${streaks.longestStreakDays} ${locale === "en" ? "days" : "días"}`}
          />
          <StatCard
            label={locale === "en" ? "Active days (7d)" : "Días activos (7d)"}
            value={streaks.activeDaysLast7}
          />
          <StatCard
            label={locale === "en" ? "Active days (30d)" : "Días activos (30d)"}
            value={streaks.activeDaysLast30}
          />
        </div>

        <div className="surface-subcard mt-6 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Badges & achievements" : "Badges y logros"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {locale === "en"
              ? "Your milestones in MiPrimerIssue to build real open source experience."
              : "Tus hitos dentro de MiPrimerIssue para construir experiencia open source real."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {badges.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Verified contributions" : "Contribuciones verificadas"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {locale === "en"
              ? "Validated by merged PRs and completed tasks synced with GitHub."
              : "Validadas por PRs mergeados y tareas completadas sincronizadas con GitHub."}
          </p>

          {verifiedContributions.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={locale === "en" ? "No verified contributions yet" : "Sin contribuciones verificadas todavía"}
                description={
                  locale === "en"
                    ? "When your PRs are merged, they will appear here."
                    : "Cuando tus PRs se mergeen, aparecerán aquí."
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {verifiedContributions.map((item) => (
                <article key={item.taskId} className="surface-subcard rounded-xl p-4">
                  <p className="text-sm font-semibold text-white">{item.taskTitle}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.projectName}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/tasks/${item.taskId}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
                    >
                      {locale === "en" ? "View task" : "Ver tarea"}
                    </Link>
                    {item.githubPrUrl ? (
                      <Link
                        href={item.githubPrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 transition hover:border-orange-400"
                      >
                        {locale === "en" ? "View PR" : "Ver PR"}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "4. Recent activity" : "4. Actividad reciente"}
          description={
            locale === "en"
              ? "Understand what happened most recently and where to continue."
              : "Entiende lo último que pasó y desde dónde continuar."
          }
        />

        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
            label={locale === "en" ? "Last completed task" : "Última tarea completada"}
            value={
              progress.recentActivity.lastCompletedTaskTitle ||
              (locale === "en" ? "No activity yet" : "Sin actividad todavía")
            }
          />
          <StatCard
            label={locale === "en" ? "Last contributed project" : "Último proyecto contribuido"}
            value={
              progress.recentActivity.lastContributedProjectName ||
              (locale === "en" ? "No contributions yet" : "Sin contribuciones todavía")
            }
          />
          <div className="surface-subcard rounded-xl p-4">
            <p className="text-sm text-gray-400">
              {locale === "en" ? "Latest linked PR" : "Último PR asociado"}
            </p>
            {progress.recentActivity.lastPullRequestUrl ? (
              <Link
                href={progress.recentActivity.lastPullRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-sm text-orange-300 hover:underline"
              >
                {locale === "en" ? "View Pull Request" : "Ver Pull Request"}
              </Link>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                {locale === "en" ? "No PR detected yet" : "Sin PR detectado todavía"}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <UserTimelineCard
        events={timeline}
        locale={locale}
        title={locale === "en" ? "Recent contribution timeline" : "Timeline reciente de contribuciones"}
        description={
          locale === "en"
            ? "Latest milestones and project actions in chronological order."
            : "Últimos hitos y acciones en proyectos en orden cronológico."
        }
        maxVisible={8}
      />

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "5. Secondary metrics" : "5. Métricas secundarias"}
          description={
            locale === "en"
              ? "Supporting context: profile details, favorites, maintainer signals and your public badge."
              : "Contexto de apoyo: perfil, favoritos, señales de maintainer y tu badge público."
          }
        />

        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label={locale === "en" ? "Merged PRs" : "PRs mergeados"} value={progress.mergedPullRequests} />
          <StatCard label={locale === "en" ? "Contributed projects" : "Proyectos contribuidos"} value={progress.contributedProjects} />
          <StatCard label={locale === "en" ? "Requests sent" : "Solicitudes enviadas"} value={progress.requestsSent} />
          <StatCard label={locale === "en" ? "Badges unlocked" : "Badges desbloqueados"} value={unlockedBadges.length} />
        </div>

        <section className="surface-subcard mt-6 rounded-2xl p-6">
          <PageHeader
            as="h3"
            title={locale === "en" ? "Developer profile" : "Perfil del developer"}
            description={
              locale === "en"
                ? "Your public contribution identity and positioning."
                : "Tu identidad pública de contribución y posicionamiento."
            }
            actions={
              canReviewRequests ? (
                <>
                  <Link
                    href="/dashboard/projects/new"
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                  >
                    {locale === "en" ? "New project" : "Nuevo proyecto"}
                  </Link>
                  <Link
                    href="/dashboard/projects"
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                  >
                    {locale === "en" ? "Manage projects" : "Gestionar proyectos"}
                  </Link>
                  <Link
                    href="/dashboard/tasks/new"
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                  >
                    {locale === "en" ? "New task" : "Nueva tarea"}
                  </Link>
                  <Link
                    href="/dashboard/tasks"
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                  >
                    {locale === "en" ? "Manage tasks" : "Gestionar tareas"}
                  </Link>
                </>
              ) : null
            }
          />

          <div className="surface-card mt-5 rounded-2xl p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={locale === "en" ? "User avatar" : "Avatar del usuario"}
                  className="h-20 w-20 rounded-full object-cover"
                  width={80}
                  height={80}
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-semibold text-white">
                  {(profile?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                </div>
              )}

              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {profile?.full_name || (locale === "en" ? "No name" : "Sin nombre")}
                </h2>
                <p className="text-gray-300">
                  @{profile?.github_username || (locale === "en" ? "no-username" : "sin-username")}
                </p>
                <p className="text-sm text-gray-400">{profile?.email || user.email}</p>
              </div>
            </div>

            <DashboardProfileEditor
              key={`${profile?.id || "user"}:${profile?.bio || ""}:${profile?.location || ""}:${profileRoles.join("|")}:${techStackTags.join("|")}:${openProfileEdit ? "edit" : "view"}`}
              bio={profile?.bio || null}
              location={profile?.location || null}
              roles={profileRoles}
              techStack={techStackTags}
              initialEditing={openProfileEdit}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatCard label={locale === "en" ? "Role" : "Rol"} value={profile?.role || "junior"} />
            <div className="surface-subcard rounded-xl p-4">
              <p className="text-sm text-gray-400">{locale === "en" ? "Current level" : "Nivel actual"}</p>
              <div className="mt-2">
                <LevelBadge level={progress.level} />
              </div>
            </div>
            <StatCard
              label={locale === "en" ? "Created at" : "Fecha de alta"}
              value={
                profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString(locale === "en" ? "en-US" : "es-ES")
                  : locale === "en"
                    ? "Not available"
                    : "No disponible"
              }
            />
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Your favorites" : "Tus favoritos"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {locale === "en"
              ? "Quick access to saved projects and tasks."
              : "Acceso rápido a proyectos y tareas guardadas."}
          </p>

          {favorites.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={locale === "en" ? "No favorites yet" : "Todavía no tienes favoritos"}
                description={
                  locale === "en"
                    ? "Save projects or tasks and they will appear here."
                    : "Guarda proyectos o tareas y aparecerán aquí."
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {favorites.map((favorite) => (
                <article key={favorite.id} className="surface-subcard rounded-xl p-4">
                  <p className="text-sm font-semibold text-white">{favorite.title}</p>
                  {favorite.subtitle ? <p className="mt-1 text-xs text-gray-400">{favorite.subtitle}</p> : null}
                  <div className="mt-3">
                    <Link
                      href={favorite.href}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
                    >
                      {locale === "en" ? "Open" : "Abrir"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {maintainerStats ? (
          <section className="surface-subcard mt-6 rounded-2xl p-5">
            <h3 className="text-base font-semibold text-white">
              {locale === "en" ? "Maintainer overview" : "Panel de maintainer"}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {locale === "en"
                ? "Executive view of requests, task flow, and active contributors."
                : "Vista ejecutiva de solicitudes, flujo de tareas y contributors activos."}
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <StatCard
                label={locale === "en" ? "Pending requests" : "Solicitudes pendientes"}
                value={maintainerStats.pendingRequests}
              />
              <StatCard
                label={locale === "en" ? "Tasks without issue" : "Tareas sin issue"}
                value={maintainerStats.tasksWithoutIssue}
              />
              <StatCard
                label={locale === "en" ? "Tasks in review" : "Tareas en review"}
                value={maintainerStats.tasksInReview}
              />
              <StatCard
                label={locale === "en" ? "Completed tasks" : "Tareas completadas"}
                value={maintainerStats.tasksCompleted}
              />
              <StatCard
                label={locale === "en" ? "Active contributors" : "Contributors activos"}
                value={maintainerStats.activeContributors}
              />
              <StatCard
                label={locale === "en" ? "Managed projects" : "Proyectos gestionados"}
                value={maintainerStats.managedProjects}
              />
            </div>
          </section>
        ) : null}

        <section className="surface-subcard mt-6 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Badge for your GitHub README" : "Badge para tu GitHub README"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {locale === "en"
              ? "Copy this snippet to show that you contribute through MiPrimerIssue."
              : "Copia este snippet para mostrar que contribuyes desde MiPrimerIssue."}
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-gray-200">
            {readmeBadgeSnippet}
          </pre>
        </section>
      </SectionCard>
    </AppLayout>
  );
}
