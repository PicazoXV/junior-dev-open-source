import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";

type MyRequest = {
  id: string;
  task_id: string;
  project_id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
};

type RequestTask = {
  id: string;
  title: string | null;
};

type RequestProject = {
  id: string;
  name: string | null;
};

export default async function MyRequestsPage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: requests, error: requestsError } = await supabase
    .from("task_requests")
    .select("id, task_id, project_id, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (requestsError) {
    console.error("Error cargando solicitudes del usuario:", requestsError.message);
  }

  const myRequests = (requests || []) as MyRequest[];
  const taskIds = [...new Set(myRequests.map((item) => item.task_id))];
  const projectIds = [...new Set(myRequests.map((item) => item.project_id))];

  const [tasksResult, projectsResult] = await Promise.all([
    taskIds.length > 0
      ? supabase.from("tasks").select("id, title").in("id", taskIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length > 0
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (tasksResult.error) {
    console.error("Error cargando tareas:", tasksResult.error.message);
  }

  if (projectsResult.error) {
    console.error("Error cargando proyectos:", projectsResult.error.message);
  }

  const taskById = new Map(
    ((tasksResult.data || []) as RequestTask[]).map((item) => [item.id, item])
  );
  const projectById = new Map(
    ((projectsResult.data || []) as RequestProject[]).map((item) => [item.id, item])
  );

  return (
    <main className="app-bg min-h-screen p-8 lg:pr-72">
      <Navbar />
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mis solicitudes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Estado de tus solicitudes de tareas
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver al dashboard
          </Link>
        </div>

        {myRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Todavía no has enviado solicitudes
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Explora proyectos y solicita una tarea para empezar a colaborar.
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
                  <th className="px-4 py-3 font-medium">Created at</th>
                  <th className="px-4 py-3 font-medium">Link</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((request) => {
                  const task = taskById.get(request.task_id);
                  const project = projectById.get(request.project_id);

                  return (
                    <tr key={request.id} className="border-t">
                      <td className="px-4 py-3 align-top text-gray-900">
                        {task?.title || "Tarea no disponible"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-800">
                        {project?.name || "Proyecto no disponible"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600">
                        {request.created_at
                          ? new Date(request.created_at).toLocaleString("es-ES")
                          : "No disponible"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/tasks/${request.task_id}`}
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

