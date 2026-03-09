import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createProjectAction } from "@/app/dashboard/projects/new/actions";

export default async function NewProjectPage() {
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

  const isAllowed = profile?.role === "admin" || profile?.role === "maintainer";

  if (!isAllowed) {
    redirect("/dashboard");
  }

  return (
    <main className="app-bg min-h-screen p-8 lg:pr-72">
      <Navbar />
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nuevo proyecto</h1>
            <p className="mt-1 text-sm text-gray-500">
              Crea un nuevo proyecto para la comunidad
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver al dashboard
          </Link>
        </div>

        <form action={createProjectAction} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                required
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
                placeholder="mi-proyecto-open-source"
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
              placeholder="https://github.com/org/repo"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select id="status" name="status" defaultValue="active" className="w-full rounded-lg border px-3 py-2 text-sm">
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
                defaultValue="beginner"
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
              placeholder="nextjs, supabase, tailwindcss"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Crear proyecto
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

