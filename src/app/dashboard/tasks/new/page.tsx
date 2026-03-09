import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createTaskAction } from "@/app/dashboard/tasks/new/actions";

type ProjectOption = {
  id: string;
  name: string;
};

export default async function NewTaskPage() {
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

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const projectOptions = (projects || []) as ProjectOption[];

  return (
    <main className="app-bg min-h-screen p-8 lg:pr-72">
      <Navbar />
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Nueva tarea</h1>
            <p className="mt-1 text-sm text-gray-500">
              Crea una tarea para un proyecto existente
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver al dashboard
          </Link>
        </div>

        {projectOptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No hay proyectos activos disponibles
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Crea un proyecto antes de añadir tareas.
            </p>
            <Link
              href="/dashboard/projects/new"
              className="mt-4 inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Crear proyecto
            </Link>
          </div>
        ) : (
          <form action={createTaskAction} className="space-y-5">
            <div>
              <label
                htmlFor="project_id"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Proyecto
              </label>
              <select
                id="project_id"
                name="project_id"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Selecciona un proyecto</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                Título
              </label>
              <input
                id="title"
                name="title"
                required
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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

              <div>
                <label
                  htmlFor="status"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="open"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="open">open</option>
                  <option value="assigned">assigned</option>
                  <option value="in_review">in_review</option>
                  <option value="completed">completed</option>
                  <option value="closed">closed</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="labels" className="mb-1 block text-sm font-medium text-gray-700">
                Labels (separadas por comas)
              </label>
              <input
                id="labels"
                name="labels"
                placeholder="good first issue, backend, bug"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="github_issue_url"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                URL del issue de GitHub
              </label>
              <input
                id="github_issue_url"
                name="github_issue_url"
                type="url"
                placeholder="https://github.com/org/repo/issues/123"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Crear tarea
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

