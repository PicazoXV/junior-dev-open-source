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
  });
  const challenge = await getFirstIssueChallengeProgress(supabase, user.id);
  const badges = getUserBadges(progress);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const recommendedTasks = await getRecommendedTasksForUser(supabase, user.id, 6);
  const githubUsername = profile?.github_username || "tu-username";
  const readmeBadgeSnippet = `[![Contributing via MiPrimerIssue](https://img.shields.io/badge/Contributing%20via-MiPrimerIssue-orange)](https://miprimerissue.dev/dev/${githubUsername})`;

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <OnboardingChecklist onboarding={onboarding} />

      <SectionCard className="p-8">
        <PageHeader
          title="Dashboard"
          description="Tu perfil de progreso en MiPrimerIssue"
          actions={
            canReviewRequests ? (
              <>
                <Link
                  href="/dashboard/requests"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  Ver solicitudes
                </Link>
                <Link
                  href="/dashboard/projects/new"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  Nuevo proyecto
                </Link>
                <Link
                  href="/dashboard/projects"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  Gestionar proyectos
                </Link>
                <Link
                  href="/dashboard/tasks/new"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  Nueva tarea
                </Link>
                <Link
                  href="/dashboard/tasks"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  Gestionar tareas
                </Link>
              </>
            ) : null
          }
        />

        <section className="rounded-2xl border border-white/20 bg-black/20 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Avatar del usuario"
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
                {profile?.full_name || "Sin nombre"}
              </h2>

              <p className="text-gray-300">
                @{profile?.github_username || "sin-username"}
              </p>

              <p className="text-sm text-gray-400">
                {profile?.email || user.email}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-gray-400">Bio</p>
            <p className="text-gray-200">
              {profile?.bio || "Todavía no has añadido una bio."}
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <StatCard label="Rol" value={profile?.role || "junior"} />
          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Nivel actual</p>
            <div className="mt-2">
              <LevelBadge level={progress.level} />
            </div>
          </div>
          <StatCard
            label="Fecha de alta"
            value={
              profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("es-ES")
                : "No disponible"
            }
          />
          <StatCard label="Ubicación" value={profile?.location || "No especificada"} />
          <StatCard label="Tareas completadas" value={progress.completedTasks} />
          <StatCard label="Tareas en curso" value={progress.inProgressTasks} />
          <StatCard label="Proyectos contribuidos" value={progress.contributedProjects} />
          <StatCard label="Solicitudes enviadas" value={progress.requestsSent} />
          <StatCard label="PRs merged" value={progress.mergedPullRequests} />
          <StatCard label="PRs en review" value={progress.inReviewPullRequests} />
          <StatCard
            label="Badges desbloqueados"
            value={`${unlockedBadges.length}/${badges.length}`}
            hint="Sigue completando tareas para desbloquear más logros."
          />
          <div className="rounded-xl border border-white/20 bg-black/20 p-4 md:col-span-2">
            <p className="text-sm text-gray-400">Tech stack</p>
            <p className="mt-1 text-lg font-medium text-white">
              {progress.techStack || "No especificado"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/20 bg-black/20 p-5">
          <h3 className="text-base font-semibold text-white">Badges y logros</h3>
          <p className="mt-1 text-sm text-gray-400">
            Tus hitos dentro de MiPrimerIssue para construir experiencia open source real.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {badges.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/20 bg-black/20 p-5">
          <h3 className="text-base font-semibold text-white">Actividad reciente</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StatCard
              label="Última tarea completada"
              value={progress.recentActivity.lastCompletedTaskTitle || "Sin actividad todavía"}
            />
            <StatCard
              label="Último proyecto contribuido"
              value={
                progress.recentActivity.lastContributedProjectName || "Sin contribuciones todavía"
              }
            />
            <div className="rounded-xl border border-white/20 bg-black/20 p-4">
              <p className="text-sm text-gray-400">Último PR asociado</p>
              {progress.recentActivity.lastPullRequestUrl ? (
                <Link
                  href={progress.recentActivity.lastPullRequestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex text-sm text-orange-300 hover:underline"
                >
                  Ver Pull Request
                </Link>
              ) : (
                <p className="mt-1 text-sm text-gray-500">Sin PR detectado todavía</p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="🎯 First Issue Challenge"
          description="Completa tu primera contribución open source en 7 días."
        />
        <div className="rounded-2xl border border-white/20 bg-black/20 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {challenge.completedInTime ? (
              <Badge tone="success">🏆 Challenge completed</Badge>
            ) : challenge.isExpired ? (
              <Badge tone="danger">Challenge finalizado</Badge>
            ) : (
              <Badge tone="warning">Challenge activo</Badge>
            )}
            {challenge.deadlineAt ? (
              <Badge tone="info">
                {challenge.isExpired
                  ? "Fuera de ventana"
                  : `${challenge.daysRemaining} día(s) restantes`}
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-400">Task requested</p>
              <p className="mt-1 text-sm text-white">
                {challenge.steps.taskRequested ? "✅ Completado" : "⏳ Pendiente"}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-400">Task approved</p>
              <p className="mt-1 text-sm text-white">
                {challenge.steps.taskApproved ? "✅ Completado" : "⏳ Pendiente"}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-400">PR opened</p>
              <p className="mt-1 text-sm text-white">
                {challenge.steps.prOpened ? "✅ Completado" : "⏳ Pendiente"}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-400">PR merged</p>
              <p className="mt-1 text-sm text-white">
                {challenge.steps.prMerged ? "✅ Completado" : "⏳ Pendiente"}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Your progress"
          description="Vista rápida de tu avance y siguientes pasos recomendados."
        />
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="Tasks completed" value={progress.completedTasks} />
          <StatCard label="Current tasks" value={progress.inProgressTasks} />
          <StatCard label="PRs merged" value={progress.mergedPullRequests} />
          <StatCard
            label="Next level"
            value={
              progress.level === "beginner"
                ? "junior"
                : progress.level === "junior"
                  ? "contributor"
                  : progress.level === "contributor"
                    ? "maintainer"
                    : "max level"
            }
          />
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Recommended for you"
          description="Tareas sugeridas según tu tech stack, nivel y actividad."
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
                  {task.description || "Sin descripción disponible."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DifficultyBadge difficulty={task.difficulty} />
                  {(task.labels || []).slice(0, 3).map((label) => (
                    <Badge key={`${task.id}-${label}`}>{label}</Badge>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  >
                    Ver tarea
                  </Link>
                  {task.projectSlug ? (
                    <Link
                      href={`/projects/${task.projectSlug}`}
                      className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                    >
                      Ver proyecto
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay recomendaciones por ahora"
            description="Completa más tareas o añade tech stack en tu perfil para mejorar las sugerencias."
          />
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Badge para tu GitHub README"
          description="Copia este snippet para mostrar que contribuyes desde MiPrimerIssue."
        />
        <div className="rounded-xl border border-white/15 bg-black/20 p-4">
          <p className="text-xs text-gray-500">Markdown snippet</p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-gray-200">
            {readmeBadgeSnippet}
          </pre>
        </div>
      </SectionCard>
    </AppLayout>
  );
}
