import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { updateProjectAction } from "@/app/dashboard/projects/[id]/edit/actions";

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

  const isAllowed = profile?.role === "admin" || profile?.role === "maintainer";

  if (!isAllowed) {
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
    <main className="min-h-screen bg-gray-50 p-8">
      <Navbar />
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar proyecto</h1>
            <p className="mt-1 text-sm text-gray-500">
              Actualiza la información del proyecto
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver al dashboard
          </Link>
        </div>

        {!currentProject ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Proyecto no encontrado</h2>
            <p className="mt-2 text-sm text-gray-500">
              No existe un proyecto con el ID proporcionado.
            </p>
          </div>
        ) : (
          <form action={updateProjectAction} className="space-y-5">
            <input type="hidden" name="id" value={currentProject.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={currentProject.name || ""}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  id="slug"
                  name="slug"
                  required
                  defaultValue={currentProject.slug || ""}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="short_description"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Descripción corta
              </label>
              <input
                id="short_description"
                name="short_description"
                defaultValue={currentProject.short_description || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={currentProject.description || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="repo_url" className="mb-1 block text-sm font-medium text-gray-700">
                URL del repositorio
              </label>
              <input
                id="repo_url"
                name="repo_url"
                type="url"
                defaultValue={currentProject.repo_url || ""}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={currentProject.status}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="difficulty"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Dificultad
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  defaultValue={currentProject.difficulty}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="tech_stack" className="mb-1 block text-sm font-medium text-gray-700">
                Tech stack (separado por comas)
              </label>
              <input
                id="tech_stack"
                name="tech_stack"
                defaultValue={(currentProject.tech_stack || []).join(", ")}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

