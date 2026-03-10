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

export default async function DashboardPage() {
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
  const readmeBadgeSnippet = `[![Contributing via PrimerIssue](https://img.shields.io/badge/Contributing%20via-PrimerIssue-orange)](https://primerissue.dev/dev/${githubUsername})`;
  const profileRoles = ((profile?.roles as string[] | null | undefined) || []).filter(Boolean);
  const techStackTags = parseTechStack(profile?.tech_stack);

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <DashboardInfoPanels
        primerIssuePanel={
          <DashboardRoadmapGuide userId={user.id} onboardingCompleted={onboarding.isCompleted} />
        }
        onboardingPanel={<OnboardingChecklist onboarding={onboarding} />}
        roadmapPanel={<UserRoadmapCard roadmap={roadmap} locale={locale} />}
      />

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Dashboard" : "Dashboard"}
          description={
            locale === "en"
              ? "Your progress profile in PrimerIssue"
              : "Tu perfil de progreso en PrimerIssue"
          }
          actions={
            canReviewRequests ? (
              <>
                <Link
                  href="/dashboard/requests"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  {locale === "en" ? "Review requests" : "Ver solicitudes"}
                </Link>
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

        <section className="surface-subcard rounded-2xl p-6">
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

              <p className="text-sm text-gray-400">
                {profile?.email || user.email}
              </p>

              <div className="mt-3">
                <Link
                  href="/profile/edit"
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                >
                  {locale === "en" ? "Edit profile" : "Editar perfil"}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-gray-400">Bio</p>
            <p className="text-gray-200">
              {profile?.bio ||
                (locale === "en"
                  ? "You have not added a bio yet."
                  : "Todavía no has añadido una bio.")}
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
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
          <StatCard
            label={locale === "en" ? "Location" : "Ubicación"}
            value={profile?.location || (locale === "en" ? "Not specified" : "No especificada")}
          />
          <StatCard label={locale === "en" ? "Completed tasks" : "Tareas completadas"} value={progress.completedTasks} />
          <StatCard label={locale === "en" ? "Tasks in progress" : "Tareas en curso"} value={progress.inProgressTasks} />
          <StatCard label={locale === "en" ? "Contributed projects" : "Proyectos contribuidos"} value={progress.contributedProjects} />
          <StatCard label={locale === "en" ? "Requests sent" : "Solicitudes enviadas"} value={progress.requestsSent} />
          <StatCard label="PRs merged" value={progress.mergedPullRequests} />
          <StatCard label={locale === "en" ? "PRs in review" : "PRs en review"} value={progress.inReviewPullRequests} />
          <StatCard
            label={locale === "en" ? "Unlocked badges" : "Badges desbloqueados"}
            value={`${unlockedBadges.length}/${badges.length}`}
            hint={
              locale === "en"
                ? "Keep completing tasks to unlock more achievements."
                : "Sigue completando tareas para desbloquear más logros."
            }
          />
          <div className="surface-subcard rounded-xl p-4 md:col-span-2">
            <p className="text-sm text-gray-400">{locale === "en" ? "Position" : "Puesto"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profileRoles.length > 0 ? (
                profileRoles.map((role) => (
                  <Badge key={role}>{role}</Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  {locale === "en" ? "No positions selected" : "Sin puestos seleccionados"}
                </span>
              )}
            </div>
          </div>
          <div className="surface-subcard rounded-xl p-4 md:col-span-2">
            <p className="text-sm text-gray-400">{locale === "en" ? "Tech stack" : "Tech stack"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {techStackTags.length > 0 ? (
                techStackTags.map((tech) => (
                  <Badge key={tech}>{tech}</Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  {locale === "en" ? "No technologies selected" : "Sin tecnologías seleccionadas"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="surface-subcard mt-6 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Badges & achievements" : "Badges y logros"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {locale === "en"
              ? "Your milestones in PrimerIssue to build real open source experience."
              : "Tus hitos dentro de PrimerIssue para construir experiencia open source real."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {badges.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </div>

        <div className="surface-subcard mt-6 rounded-2xl p-5">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Recent activity" : "Actividad reciente"}
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StatCard
              label="Última tarea completada"
              value={
                progress.recentActivity.lastCompletedTaskTitle ||
                (locale === "en" ? "No activity yet" : "Sin actividad todavía")
              }
            />
            <StatCard
              label="Último proyecto contribuido"
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
        </div>
      </SectionCard>

      <UserTimelineCard events={timeline} locale={locale} />

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Activity streaks" : "Rachas de actividad"}
          description={
            locale === "en"
              ? "Keep your contribution momentum."
              : "Mantén el ritmo de contribución."
          }
        />
        <div className="grid gap-3 md:grid-cols-4">
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
      </SectionCard>

      {maintainerStats ? (
        <SectionCard className="p-8">
          <PageHeader
            title={locale === "en" ? "Maintainer overview" : "Panel de maintainer"}
            description={
              locale === "en"
                ? "Executive view of requests, task flow, and active contributors."
                : "Vista ejecutiva de solicitudes, flujo de tareas y contributors activos."
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
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
        </SectionCard>
      ) : null}

      <SectionCard className="surface-accent p-8">
        <PageHeader
          title={locale === "en" ? "🎯 First Issue Challenge" : "🎯 First Issue Challenge"}
          description={
            locale === "en"
              ? "Complete your first open source contribution in 7 days."
              : "Completa tu primera contribución open source en 7 días."
          }
        />
        <div className="rounded-2xl border border-white/20 bg-black/20 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {challenge.completedInTime ? (
              <Badge tone="success">🏆 Challenge completed</Badge>
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

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-400">
                {locale === "en" ? "Task requested" : "Tarea solicitada"}
              </p>
              <p className="mt-1 text-sm text-white">
                {challenge.steps.taskRequested
                  ? locale === "en"
                    ? "✅ Completed"
                    : "✅ Completado"
                  : locale === "en"
                    ? "⏳ Pending"
                    : "⏳ Pendiente"}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-400">
                {locale === "en" ? "Task approved" : "Tarea aprobada"}
              </p>
              <p className="mt-1 text-sm text-white">
                {challenge.steps.taskApproved
                  ? locale === "en"
                    ? "✅ Completed"
                    : "✅ Completado"
                  : locale === "en"
                    ? "⏳ Pending"
                    : "⏳ Pendiente"}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-400">
                {locale === "en" ? "PR opened" : "PR abierto"}
              </p>
              <p className="mt-1 text-sm text-white">
                {challenge.steps.prOpened
                  ? locale === "en"
                    ? "✅ Completed"
                    : "✅ Completado"
                  : locale === "en"
                    ? "⏳ Pending"
                    : "⏳ Pendiente"}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-400">
                {locale === "en" ? "PR merged" : "PR mergeado"}
              </p>
              <p className="mt-1 text-sm text-white">
                {challenge.steps.prMerged
                  ? locale === "en"
                    ? "✅ Completed"
                    : "✅ Completado"
                  : locale === "en"
                    ? "⏳ Pending"
                    : "⏳ Pendiente"}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Your progress" : "Tu progreso"}
          description={
            locale === "en"
              ? "Quick view of your progress and next recommended steps."
              : "Vista rápida de tu avance y siguientes pasos recomendados."
          }
        />
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label={locale === "en" ? "Tasks completed" : "Tareas completadas"} value={progress.completedTasks} />
          <StatCard label={locale === "en" ? "Current tasks" : "Tareas actuales"} value={progress.inProgressTasks} />
          <StatCard label="PRs merged" value={progress.mergedPullRequests} />
          <StatCard
            label={locale === "en" ? "Next level" : "Siguiente nivel"}
            value={
              progress.level === "beginner"
                ? "junior"
                : progress.level === "junior"
                  ? "contributor"
                  : progress.level === "contributor"
                    ? "maintainer"
                    : locale === "en"
                      ? "max level"
                      : "nivel máximo"
            }
          />
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Recommended for you" : "Recomendado para ti"}
          description={
            locale === "en"
              ? "Suggested tasks based on your tech stack, level and activity."
              : "Tareas sugeridas según tu tech stack, nivel y actividad."
          }
        />

        {recommendedTasks.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {recommendedTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-white/15 bg-black/20 p-4"
              >
                <p className="text-sm font-semibold text-white">{task.title}</p>
                <p className="mt-1 text-xs text-gray-400">{task.projectName}</p>
                <p className="mt-2 text-sm text-gray-300">
                  {task.description || (locale === "en" ? "No description available." : "Sin descripción disponible.")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DifficultyBadge difficulty={task.difficulty} />
                  {task.estimatedMinutes ? (
                    <Badge tone="info">
                      {locale === "en"
                        ? `${task.estimatedMinutes} min`
                        : `${task.estimatedMinutes} min`}
                    </Badge>
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
          <EmptyState
            title={locale === "en" ? "No recommendations yet" : "No hay recomendaciones por ahora"}
            description={
              locale === "en"
                ? "Complete more tasks or add tech stack in your profile to improve suggestions."
                : "Completa más tareas o añade tech stack en tu perfil para mejorar las sugerencias."
            }
          />
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Your favorites" : "Tus favoritos"}
          description={
            locale === "en"
              ? "Quick access to saved projects and tasks."
              : "Acceso rápido a proyectos y tareas guardadas."
          }
        />

        {favorites.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No favorites yet" : "Todavía no tienes favoritos"}
            description={
              locale === "en"
                ? "Save projects or tasks and they will appear here."
                : "Guarda proyectos o tareas y aparecerán aquí."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {favorites.map((favorite) => (
              <article key={favorite.id} className="rounded-xl border border-white/15 bg-black/20 p-4">
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
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Verified contributions" : "Contribuciones verificadas"}
          description={
            locale === "en"
              ? "Validated by merged PRs and completed tasks synced with GitHub."
              : "Validadas por PRs mergeados y tareas completadas sincronizadas con GitHub."
          }
        />
        {verifiedContributions.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No verified contributions yet" : "Sin contribuciones verificadas todavía"}
            description={
              locale === "en"
                ? "When your PRs are merged, they will appear here."
                : "Cuando tus PRs se mergeen, aparecerán aquí."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {verifiedContributions.map((item) => (
              <article key={item.taskId} className="rounded-xl border border-white/15 bg-black/20 p-4">
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
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Badge for your GitHub README" : "Badge para tu GitHub README"}
          description={
            locale === "en"
              ? "Copy this snippet to show that you contribute through PrimerIssue."
              : "Copia este snippet para mostrar que contribuyes desde PrimerIssue."
          }
        />
        <div className="rounded-xl border border-white/15 bg-black/20 p-4">
          <p className="text-xs text-gray-500">
            {locale === "en" ? "Markdown snippet" : "Snippet Markdown"}
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-gray-200">
            {readmeBadgeSnippet}
          </pre>
        </div>
      </SectionCard>
    </AppLayout>
  );
}
