import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import LevelBadge from "@/components/ui/level-badge";
import StatCard from "@/components/ui/stat-card";
import AchievementBadge from "@/components/ui/achievement-badge";
import EmptyState from "@/components/ui/empty-state";
import { getDeveloperPublicProfile } from "@/lib/developer-stats";

type DeveloperProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function DeveloperProfilePage({ params }: DeveloperProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const developer = await getDeveloperPublicProfile(supabase, username);
  if (!developer) {
    notFound();
  }

  const unlockedBadges = developer.badges.filter((badge) => badge.unlocked);

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={developer.fullName || `@${developer.githubUsername}`}
          description={`Perfil público de @${developer.githubUsername} en MiPrimerIssue`}
          actions={
            <Link
              href="/developers"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
            >
              Volver al leaderboard
            </Link>
          }
        />

        <div className="rounded-xl border border-white/15 bg-black/20 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={developer.level} />
            <span className="text-sm text-gray-400">@{developer.githubUsername}</span>
          </div>
          <p className="mt-3 text-gray-200">{developer.bio || "Sin bio por ahora."}</p>
          <p className="mt-2 text-sm text-gray-400">
            {developer.location || "Ubicación no especificada"} ·{" "}
            {developer.techStack || "Tech stack no especificado"}
          </p>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader title="Stats" description="Progreso real en contribuciones open source." />
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard label="Tareas completadas" value={developer.completedTasks} />
          <StatCard label="Tareas en curso" value={developer.inProgressTasks} />
          <StatCard label="Proyectos contribuidos" value={developer.contributedProjects} />
          <StatCard label="PRs merged" value={developer.mergedPullRequests} />
          <StatCard label="Solicitudes enviadas" value={developer.requestsSent} />
          <StatCard label="Badges desbloqueados" value={`${unlockedBadges.length}`} />
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader title="Badges desbloqueados" description="Logros visibles del developer." />
        {developer.badges.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {developer.badges.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin badges todavía"
            description="Los badges aparecerán aquí conforme avance su actividad."
          />
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Actividad reciente"
          description="Últimos hitos detectados en su progreso."
        />
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
            label="Última tarea completada"
            value={developer.recentActivity.lastCompletedTaskTitle || "Sin actividad"}
          />
          <StatCard
            label="Último proyecto contribuido"
            value={developer.recentActivity.lastContributedProjectName || "Sin actividad"}
          />
          <div className="rounded-xl border border-white/15 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Último PR asociado</p>
            {developer.recentActivity.lastPullRequestUrl ? (
              <Link
                href={developer.recentActivity.lastPullRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-sm text-orange-300 hover:underline"
              >
                Ver Pull Request
              </Link>
            ) : (
              <p className="mt-1 text-sm text-gray-500">Sin PR detectado</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Proyectos en los que ha contribuido"
          description="Portfolio público de contribuciones dentro de la plataforma."
        />
        {developer.projects.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {developer.projects.map((project) => (
              <article key={project.id} className="rounded-xl border border-white/15 bg-black/20 p-4">
                <p className="text-white">{project.name || "Proyecto"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.slug ? (
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                    >
                      Ver proyecto
                    </Link>
                  ) : null}
                  {project.repo_url ? (
                    <Link
                      href={project.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                    >
                      Repo GitHub
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin proyectos contribuidos todavía"
            description="Aparecerán aquí cuando complete o avance tareas en proyectos."
          />
        )}
      </SectionCard>
    </AppLayout>
  );
}

