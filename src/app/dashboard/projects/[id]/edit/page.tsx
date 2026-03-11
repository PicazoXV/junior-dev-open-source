import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { updateProjectAction } from "@/app/dashboard/projects/[id]/edit/actions";
import { isReviewerRole } from "@/lib/roles";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import { getCurrentLocale } from "@/lib/i18n/server";

type ProjectEditPageProps = {
  params: Promise<{ id: string }>;
};

type Project = {
  id: string;
  name: string | null;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  repo_url: string | null;
  status: "active" | "archived";
  difficulty: "beginner" | "intermediate" | "advanced";
  tech_stack: string[] | null;
};

export default async function EditProjectPage({ params }: ProjectEditPageProps) {
  const locale = await getCurrentLocale();
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const { id } = await params;
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

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, slug, short_description, description, repo_url, status, difficulty, tech_stack")
    .eq("id", id)
    .maybeSingle();

  if (projectError) {
    console.error("Error cargando proyecto:", projectError.message);
  }

  const currentProject = project as Project | null;

  return (
    <AppLayout containerClassName="mx-auto max-w-4xl">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Edit project" : "Editar proyecto"}
          description={
            locale === "en"
              ? "Update visible information for contributors."
              : "Actualiza la información visible para los colaboradores."
          }
          actions={
            <Link
              href="/dashboard/projects"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              {locale === "en" ? "Back to management" : "Volver a gestión"}
            </Link>
          }
        />

        {!currentProject ? (
          <EmptyState
            title={locale === "en" ? "Project not found" : "Proyecto no encontrado"}
            description={
              locale === "en"
                ? "No project exists with the provided ID."
                : "No existe un proyecto con el ID proporcionado."
            }
          />
        ) : (
          <form action={updateProjectAction} className="space-y-5">
            <input type="hidden" name="id" value={currentProject.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-300">
                  {locale === "en" ? "Name" : "Nombre"}
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={currentProject.name || ""}
                  className="form-control"
                />
              </div>

              <div>
                <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-300">
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  required
                  defaultValue={currentProject.slug || ""}
                  className="form-control"
                />
              </div>
            </div>

            <div>
              <label htmlFor="short_description" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Short description" : "Descripción corta"}
              </label>
              <input
                id="short_description"
                name="short_description"
                defaultValue={currentProject.short_description || ""}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Description" : "Descripción"}
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={currentProject.description || ""}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="repo_url" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Repository URL" : "URL del repositorio"}
              </label>
              <input
                id="repo_url"
                name="repo_url"
                type="url"
                defaultValue={currentProject.repo_url || ""}
                className="form-control"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-300">
                  {locale === "en" ? "Status" : "Estado"}
                </label>
                <select id="status" name="status" defaultValue={currentProject.status} className="form-control form-select">
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </div>

              <div>
                <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-gray-300">
                  {locale === "en" ? "Difficulty" : "Dificultad"}
                </label>
                <select id="difficulty" name="difficulty" defaultValue={currentProject.difficulty} className="form-control form-select">
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="tech_stack" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Tech stack (comma separated)" : "Tech stack (separado por comas)"}
              </label>
              <input
                id="tech_stack"
                name="tech_stack"
                defaultValue={(currentProject.tech_stack || []).join(", ")}
                className="form-control"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Save changes" : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </SectionCard>
    </AppLayout>
  );
}
