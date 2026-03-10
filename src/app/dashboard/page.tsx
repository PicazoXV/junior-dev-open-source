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
  const badges = getUserBadges(progress);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title="Dashboard"
          description="Tu perfil dentro de la plataforma"
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
            Tus hitos dentro de la plataforma de contribución open source.
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
    </AppLayout>
  );
}
