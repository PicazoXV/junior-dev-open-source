import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PublicLayout from "@/components/layout/public-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import LevelBadge from "@/components/ui/level-badge";
import StatCard from "@/components/ui/stat-card";
import AchievementBadge from "@/components/ui/achievement-badge";
import EmptyState from "@/components/ui/empty-state";
import { getDeveloperPublicProfile } from "@/lib/developer-stats";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUserTimeline } from "@/lib/user-timeline";
import UserTimelineCard from "@/components/timeline/user-timeline-card";
import { getVerifiedContributions } from "@/lib/verified-contributions";
import { getUserStreaks } from "@/lib/user-streaks";
import { createAdminClient } from "@/lib/supabase/admin";

type DeveloperProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: DeveloperProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";

  if (!normalizedUsername) {
    return {
      title: "Perfil de developer | MiPrimerIssue",
      description:
        "Consulta perfiles públicos de developers junior con historial de contribuciones, tareas y progreso en open source.",
    };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, github_username, bio")
    .ilike("github_username", normalizedUsername)
    .maybeSingle();

  const githubUsername = profile?.github_username || normalizedUsername;
  const displayName = profile?.full_name?.trim() || `@${githubUsername}`;
  const description =
    profile?.bio?.trim() ||
    `Perfil público de @${githubUsername} en MiPrimerIssue con tareas completadas, PRs mergeados y evolución como contributor.`;

  return {
    title: `${displayName} | MiPrimerIssue`,
    description,
  };
}

export default async function DeveloperProfilePage({ params }: DeveloperProfilePageProps) {
  const locale = await getCurrentLocale();
  const { username } = await params;
  let supabase = await createClient();

  try {
    supabase = createAdminClient();
  } catch (error) {
    console.warn(
      "No se pudo usar cliente admin para perfil público de developer, usando cliente público.",
      error instanceof Error ? error.message : String(error)
    );
  }

  const developer = await getDeveloperPublicProfile(supabase, username);
  if (!developer) {
    notFound();
  }

  const unlockedBadges = developer.badges.filter((badge) => badge.unlocked);
  const timeline = await getUserTimeline({
    supabase,
    userId: developer.id,
    locale,
    limit: 10,
  });
  const verifiedContributions = await getVerifiedContributions({
    supabase,
    userId: developer.id,
    limit: 6,
  });
  const streaks = await getUserStreaks(supabase, developer.id);

  return (
    <PublicLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard variant="hero" className="p-8">
        <PageHeader
          title={developer.fullName || `@${developer.githubUsername}`}
          description={
            locale === "en"
              ? `Public profile for @${developer.githubUsername} on MiPrimerIssue`
              : `Perfil público de @${developer.githubUsername} en MiPrimerIssue`
          }
          actions={
            <Link
              href="/developers"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
            >
              {locale === "en" ? "Back to leaderboard" : "Volver al leaderboard"}
            </Link>
          }
        />

        <div className="surface-subcard rounded-xl p-5">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={developer.level} />
            <span className="text-sm text-gray-400">@{developer.githubUsername}</span>
          </div>
          <p className="mt-3 text-gray-200">
            {developer.bio || (locale === "en" ? "No bio yet." : "Sin bio por ahora.")}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            {developer.location || (locale === "en" ? "Location not specified" : "Ubicación no especificada")} ·{" "}
            {developer.techStack || (locale === "en" ? "Tech stack not specified" : "Tech stack no especificado")}
          </p>
        </div>
      </SectionCard>

      <UserTimelineCard events={timeline} locale={locale} />

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "Activity streaks" : "Rachas de actividad"}
          description={
            locale === "en"
              ? "Consistency indicators from recent activity."
              : "Indicadores de consistencia según actividad reciente."
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            label={locale === "en" ? "Current streak" : "Racha actual"}
            value={`${streaks.currentStreakDays} ${locale === "en" ? "days" : "días"}`}
          />
          <StatCard
            label={locale === "en" ? "Longest streak" : "Mejor racha"}
            value={`${streaks.longestStreakDays} ${locale === "en" ? "days" : "días"}`}
          />
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "Verified contributions" : "Contribuciones verificadas"}
          description={
            locale === "en"
              ? "Backed by merged PRs and completed tasks."
              : "Respaldadas por PRs mergeados y tareas completadas."
          }
        />
        {verifiedContributions.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No verified contributions yet" : "Sin contribuciones verificadas todavía"}
            description={
              locale === "en"
                ? "They will appear here when PRs are merged."
                : "Aparecerán aquí cuando se hagan merge de PRs."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {verifiedContributions.map((item) => (
              <article key={item.taskId} className="surface-subcard rounded-xl p-4">
                <p className="text-sm font-semibold text-white">{item.taskTitle}</p>
                <p className="mt-1 text-xs text-gray-400">{item.projectName}</p>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title="Stats"
          description={
            locale === "en"
              ? "Real progress in open source contributions."
              : "Progreso real en contribuciones open source."
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard label={locale === "en" ? "Completed tasks" : "Tareas completadas"} value={developer.completedTasks} />
          <StatCard label={locale === "en" ? "Tasks in progress" : "Tareas en curso"} value={developer.inProgressTasks} />
          <StatCard label={locale === "en" ? "Contributed projects" : "Proyectos contribuidos"} value={developer.contributedProjects} />
          <StatCard label="PRs merged" value={developer.mergedPullRequests} />
          <StatCard label={locale === "en" ? "Requests sent" : "Solicitudes enviadas"} value={developer.requestsSent} />
          <StatCard label={locale === "en" ? "Unlocked badges" : "Badges desbloqueados"} value={`${unlockedBadges.length}`} />
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "Unlocked badges" : "Badges desbloqueados"}
          description={locale === "en" ? "Visible developer achievements." : "Logros visibles del developer."}
        />
        {developer.badges.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {developer.badges.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={locale === "en" ? "No badges yet" : "Sin badges todavía"}
            description={
              locale === "en"
                ? "Badges will appear here as activity progresses."
                : "Los badges aparecerán aquí conforme avance su actividad."
            }
          />
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "Recent activity" : "Actividad reciente"}
          description={
            locale === "en"
              ? "Latest milestones detected in progress."
              : "Últimos hitos detectados en su progreso."
          }
        />
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
            label={locale === "en" ? "Last completed task" : "Última tarea completada"}
            value={developer.recentActivity.lastCompletedTaskTitle || (locale === "en" ? "No activity" : "Sin actividad")}
          />
          <StatCard
            label={locale === "en" ? "Last contributed project" : "Último proyecto contribuido"}
            value={developer.recentActivity.lastContributedProjectName || (locale === "en" ? "No activity" : "Sin actividad")}
          />
          <div className="surface-subcard rounded-xl p-4">
            <p className="text-sm text-gray-400">
              {locale === "en" ? "Latest linked PR" : "Último PR asociado"}
            </p>
            {developer.recentActivity.lastPullRequestUrl ? (
              <Link
                href={developer.recentActivity.lastPullRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-sm text-orange-300 hover:underline"
              >
                {locale === "en" ? "View Pull Request" : "Ver Pull Request"}
              </Link>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                {locale === "en" ? "No PR detected" : "Sin PR detectado"}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={
            locale === "en"
              ? "Projects contributed to"
              : "Proyectos en los que ha contribuido"
          }
          description={
            locale === "en"
              ? "Public portfolio of contributions inside the platform."
              : "Portfolio público de contribuciones dentro de la plataforma."
          }
        />
        {developer.projects.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {developer.projects.map((project) => (
              <article key={project.id} className="surface-subcard rounded-xl p-4">
                <p className="text-white">{project.name || (locale === "en" ? "Project" : "Proyecto")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.slug ? (
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                    >
                      {locale === "en" ? "View project" : "Ver proyecto"}
                    </Link>
                  ) : null}
                  {project.repo_url ? (
                    <Link
                      href={project.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                    >
                      {locale === "en" ? "GitHub repo" : "Repo GitHub"}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              locale === "en"
                ? "No contributed projects yet"
                : "Sin proyectos contribuidos todavía"
            }
            description={
              locale === "en"
                ? "They will appear here when tasks are completed or progressed."
                : "Aparecerán aquí cuando complete o avance tareas en proyectos."
            }
          />
        )}
      </SectionCard>
    </PublicLayout>
  );
}
