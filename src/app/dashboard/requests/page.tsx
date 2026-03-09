import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { approveRequest, rejectRequest } from "@/app/dashboard/requests/actions";

type PendingRequest = {
  id: string;
  user_id: string;
  task_id: string;
  project_id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  created_at: string;
};

type RequestProfile = {
  id: string;
  full_name: string | null;
  github_username: string | null;
  email: string | null;
};

type RequestTask = {
  id: string;
  title: string | null;
};

type RequestProject = {
  id: string;
  name: string | null;
};

export default async function DashboardRequestsPage() {
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

  const isReviewer = profile?.role === "admin" || profile?.role === "maintainer";

  if (!isReviewer) {
    redirect("/dashboard");
  }

  const { data: requests, error: requestsError } = await supabase
    .from("task_requests")
    .select("id, user_id, task_id, project_id, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (requestsError) {
    console.error("Error cargando solicitudes:", requestsError.message);
  }

  const pendingRequests = (requests || []) as PendingRequest[];

  const userIds = [...new Set(pendingRequests.map((item) => item.user_id))];
  const taskIds = [...new Set(pendingRequests.map((item) => item.task_id))];
  const projectIds = [...new Set(pendingRequests.map((item) => item.project_id))];

  const [profilesResult, tasksResult, projectsResult] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, github_username, email")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    taskIds.length > 0
      ? supabase.from("tasks").select("id, title").in("id", taskIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length > 0
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) {
    console.error("Error cargando requesters:", profilesResult.error.message);
  }

  if (tasksResult.error) {
    console.error("Error cargando tareas:", tasksResult.error.message);
  }

  if (projectsResult.error) {
    console.error("Error cargando proyectos:", projectsResult.error.message);
  }

  const profileById = new Map(
    ((profilesResult.data || []) as RequestProfile[]).map((item) => [item.id, item])
  );
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
            <h1 className="text-3xl font-bold">Solicitudes de tareas</h1>
            <p className="mt-1 text-sm text-gray-500">
              Revisa las solicitudes pendientes de los desarrolladores
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver al dashboard
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No hay solicitudes pendientes
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Cuando lleguen nuevas solicitudes aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Requested at</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => {
                  const requester = profileById.get(request.user_id);
                  const task = taskById.get(request.task_id);
                  const project = projectById.get(request.project_id);

                  return (
                    <tr key={request.id} className="border-t">
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-gray-900">
                          {requester?.full_name || "Sin nombre"}
                        </p>
                        <p className="text-gray-600">
                          @{requester?.github_username || "sin-username"}
                        </p>
                        <p className="text-gray-500">{requester?.email || "Sin email"}</p>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-800">
                        {task?.title || "Tarea no disponible"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-800">
                        {project?.name || "Proyecto no disponible"}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-600">
                        {request.created_at
                          ? new Date(request.created_at).toLocaleString("es-ES")
                          : "No disponible"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          <form action={approveRequest.bind(null, request.id)}>
                            <button
                              type="submit"
                              className="rounded-lg border border-green-600 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
                            >
                              Approve
                            </button>
                          </form>

                          <form action={rejectRequest.bind(null, request.id)}>
                            <button
                              type="submit"
                              className="rounded-lg border border-red-600 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
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
