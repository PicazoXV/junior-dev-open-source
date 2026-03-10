import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProfileForm from "@/components/edit-profile-form";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import { getUserProgress } from "@/lib/user-progress";
import LevelBadge from "@/components/ui/level-badge";
import StatCard from "@/components/ui/stat-card";
import { getUserBadges } from "@/lib/user-badges";
import AchievementBadge from "@/components/ui/achievement-badge";

export default async function EditProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error cargando perfil:", error.message);
  }

  const progress = await getUserProgress(supabase, user.id, profile?.tech_stack || null);
  const badges = getUserBadges(progress);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);

  return (
    <AppLayout containerClassName="mx-auto max-w-2xl">
      <SectionCard className="p-8">
        <PageHeader
          title="Editar perfil"
          description="Actualiza tu información pública dentro de la plataforma."
          actions={
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Volver al dashboard
            </Link>
          }
        />

        <div className="mb-6 rounded-2xl border border-white/20 bg-black/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Nivel</p>
            <LevelBadge level={progress.level} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="Tareas completadas" value={progress.completedTasks} />
            <StatCard label="Tareas en curso" value={progress.inProgressTasks} />
            <StatCard label="Proyectos contribuidos" value={progress.contributedProjects} />
            <StatCard label="Solicitudes enviadas" value={progress.requestsSent} />
            <StatCard label="PRs merged" value={progress.mergedPullRequests} />
            <StatCard
              label="Badges desbloqueados"
              value={`${unlockedBadges.length}/${badges.length}`}
            />
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-white/20 bg-black/20 p-4">
          <h3 className="text-base font-semibold text-white">Logros del developer</h3>
          <p className="mt-1 text-sm text-gray-400">
            Estos badges se calculan automáticamente según tu actividad.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </div>

        <EditProfileForm profile={profile} />
      </SectionCard>
    </AppLayout>
  );
}
