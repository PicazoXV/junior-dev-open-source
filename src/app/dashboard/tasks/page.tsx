import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";

type TaskRow = {
  id: string;
  project_id: string;
  title: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  created_at: string;
};

type ProjectRow = {
  id: string;
  name: string | null;
};

export default async function DashboardTasksPage() {
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

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, project_id, title, status, difficulty, created_at")
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("Error cargando tareas:", tasksError.message);
  }

  const taskRows = (tasks || []) as TaskRow[];
  const projectIds = [...new Set(taskRows.map((task) => task.project_id))];

  const { data: projects, error: projectsError } =
    projectIds.length > 0
      ? await supabase.from("projects").select("id, name").in("id", projectIds)
      : { data: [], error: null };

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const projectById = new Map(
    ((projects || []) as ProjectRow[]).map((project) => [project.id, project])
  );

  return (
    <main className="app-bg min-h-screen p-8 lg:pr-72">
      <Navbar />
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage tasks</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de tareas de los proyectos
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/tasks/new"
              className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Nueva tarea
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>

        {taskRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">No hay tareas registradas</h2>
            <p className="mt-2 text-sm text-gray-500">
              Crea tareas para que los juniors puedan solicitarlas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Difficulty</th>
                  <th className="px-4 py-3 font-medium">Created at</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {taskRows.map((task) => {
                  const project = projectById.get(task.project_id);

                  return (
                    <tr key={task.id} className="border-t">
                      <td className="px-4 py-3 align-top text-gray-900">
                        {task.title || "Sin título"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700">
                        {project?.name || "Proyecto no disponible"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700">{task.status}</td>
                      <td className="px-4 py-3 align-top text-gray-700">
                        {task.difficulty || "No especificada"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600">
                        {task.created_at
                          ? new Date(task.created_at).toLocaleString("es-ES")
                          : "No disponible"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/dashboard/tasks/${task.id}/edit`}
                          className="inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

