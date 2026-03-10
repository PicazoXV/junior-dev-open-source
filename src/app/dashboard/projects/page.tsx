import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { isReviewerRole } from "@/lib/roles";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import Badge from "@/components/ui/badge";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import { getCurrentLocale } from "@/lib/i18n/server";

type ProjectRow = {
  id: string;
  name: string | null;
  slug: string | null;
  status: "active" | "archived";
  difficulty: "beginner" | "intermediate" | "advanced";
  created_at: string;
};

export default async function DashboardProjectsPage() {
  const locale = await getCurrentLocale();
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error cargando perfil:", profileError.message);
    redirect("/dashboard");
  }

  if (!isReviewerRole(profile?.role)) {
    redirect("/dashboard");
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, slug, status, difficulty, created_at")
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const rows = (projects || []) as ProjectRow[];

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Manage projects" : "Gestionar proyectos"}
          description={
            locale === "en"
              ? "Manage projects, visibility, and recommended level."
              : "Administra proyectos, visibilidad y nivel recomendado."
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/projects/new"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "New project" : "Nuevo proyecto"}
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                {locale === "en" ? "Back to dashboard" : "Volver al dashboard"}
              </Link>
            </div>
          }
        />

        {rows.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No projects registered" : "No hay proyectos registrados"}
            description={
              locale === "en"
                ? "Create the first project to start publishing tasks for the junior community."
                : "Crea el primer proyecto para empezar a publicar tareas para la comunidad junior."
            }
            action={
              <Link
                href="/dashboard/projects/new"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Create project" : "Crear proyecto"}
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/20 bg-black/20">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Name" : "Nombre"}</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Status" : "Estado"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Difficulty" : "Dificultad"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Created" : "Creado"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Actions" : "Acciones"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((project) => (
                  <tr key={project.id} className="border-t border-white/10">
                    <td className="px-4 py-3 align-top text-white">
                      {project.name || (locale === "en" ? "No name" : "Sin nombre")}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-300">
                      {project.slug || (locale === "en" ? "No slug" : "Sin slug")}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge tone={project.status === "active" ? "success" : "default"}>
                        {project.status === "active"
                          ? locale === "en"
                            ? "Active"
                            : "Activo"
                          : locale === "en"
                            ? "Archived"
                            : "Archivado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <DifficultyBadge difficulty={project.difficulty} />
                    </td>
                    <td className="px-4 py-3 align-top text-gray-400">
                      {project.created_at
                        ? new Date(project.created_at).toLocaleString(
                            locale === "en" ? "en-US" : "es-ES"
                          )
                        : locale === "en"
                          ? "Not available"
                          : "No disponible"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/dashboard/projects/${project.id}/edit`}
                        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                      >
                        {locale === "en" ? "Edit" : "Editar"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}
