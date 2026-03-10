import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProfileForm from "@/components/edit-profile-form";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import { getUserProgress } from "@/lib/user-progress";
import LevelBadge from "@/components/ui/level-badge";

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

        <div className="mb-6 grid gap-3 rounded-2xl border border-white/20 bg-black/20 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Nivel</p>
            <div className="mt-2">
              <LevelBadge level={progress.level} />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Progreso</p>
            <p className="mt-2 text-sm text-gray-300">
              {progress.completedTasks} completadas · {progress.inProgressTasks} en curso ·{" "}
              {progress.contributedProjects} proyectos
            </p>
          </div>
        </div>

        <EditProfileForm profile={profile} />
      </SectionCard>
    </AppLayout>
  );
}
