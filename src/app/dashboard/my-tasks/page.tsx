import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";

type MyTask = {
  id: string;
  project_id: string;
  title: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
};

type TaskProject = {
  id: string;
  name: string | null;
  slug: string | null;
};

export default async function MyTasksPage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, project_id, title, status, difficulty")
    .eq("assigned_to", user.id)
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("Error cargando tareas asignadas:", tasksError.message);
  }

  const myTasks = (tasks || []) as MyTask[];
  const projectIds = [...new Set(myTasks.map((item) => item.project_id))];

  const { data: projects, error: projectsError } =
    projectIds.length > 0
      ? await supabase
          .from("projects")
          .select("id, name, slug")
          .in("id", projectIds)
      : { data: [], error: null };

  if (projectsError) {
    console.error("Error cargando proyectos de tareas:", projectsError.message);
  }

  const projectById = new Map(
    ((projects || []) as TaskProject[]).map((project) => [project.id, project])
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Navbar />
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis tareas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Tareas que tienes asignadas actualmente
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver al dashboard
          </Link>
        </div>

        {myTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No tienes tareas asignadas
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Cuando te asignen una tarea, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Difficulty</th>
                  <th className="px-4 py-3 font-medium">Link</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.map((task) => {
                  const project = projectById.get(task.project_id);

                  return (
                    <tr key={task.id} className="border-t">
                      <td className="px-4 py-3 align-top text-gray-900">
                        {task.title || "Tarea sin título"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-800">
                        {project?.name || "Proyecto no disponible"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-700">
                        {task.difficulty || "No especificada"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                        >
                          Ver tarea
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

