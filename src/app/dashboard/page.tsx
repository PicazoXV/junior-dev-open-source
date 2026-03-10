import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";
import { isReviewerRole } from "@/lib/roles";
import { getUserProgress } from "@/lib/user-progress";
import LevelBadge from "@/components/ui/level-badge";

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
                  Manage projects
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
                  Manage tasks
                </Link>
              </>
            ) : null
          }
        />

        <section className="rounded-2xl border border-white/20 bg-black/20 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar del usuario"
                className="h-20 w-20 rounded-full object-cover"
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
          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Rol</p>
            <div className="mt-2">
              <Badge accent>{profile?.role || "junior"}</Badge>
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Nivel actual</p>
            <div className="mt-2">
              <LevelBadge level={progress.level} />
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Fecha de alta</p>
            <p className="text-lg font-medium text-white">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("es-ES")
                : "No disponible"}
            </p>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Ubicación</p>
            <p className="text-lg font-medium text-white">
              {profile?.location || "No especificada"}
            </p>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Tareas completadas</p>
            <p className="text-lg font-medium text-white">{progress.completedTasks}</p>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Tareas en curso</p>
            <p className="text-lg font-medium text-white">{progress.inProgressTasks}</p>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Proyectos contribuidos</p>
            <p className="text-lg font-medium text-white">{progress.contributedProjects}</p>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/20 p-4">
            <p className="text-sm text-gray-400">Solicitudes enviadas</p>
            <p className="text-lg font-medium text-white">{progress.requestsSent}</p>
          </div>

          <div className="rounded-xl border border-white/20 bg-black/20 p-4 md:col-span-2">
            <p className="text-sm text-gray-400">Tech stack</p>
            <p className="text-lg font-medium text-white">
              {progress.techStack || "No especificado"}
            </p>
          </div>
        </div>
      </SectionCard>
    </AppLayout>
  );
}
