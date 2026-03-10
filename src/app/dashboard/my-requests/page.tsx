import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";

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
    <AppLayout containerClassName="mx-auto max-w-6xl">
      <SectionCard className="p-8">
        <PageHeader
          title="Mis solicitudes"
          description="Consulta el estado de las tareas que solicitaste."
          actions={
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Volver al dashboard
            </Link>
          }
        />

        {myRequests.length === 0 ? (
          <EmptyState
            title="Todavía no has enviado solicitudes"
            description="Explora proyectos activos y solicita una tarea para empezar a colaborar."
            action={
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                Explorar proyectos
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/20 bg-black/20">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">Tarea</th>
                  <th className="px-4 py-3 font-medium">Proyecto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((request) => {
                  const task = taskById.get(request.task_id);
                  const project = projectById.get(request.project_id);

                  return (
                    <tr key={request.id} className="border-t border-white/10">
                      <td className="px-4 py-3 align-top text-white">{task?.title || "Tarea no disponible"}</td>
                      <td className="px-4 py-3 align-top text-gray-300">{project?.name || "Proyecto no disponible"}</td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 align-top text-gray-400">
                        {request.created_at
                          ? new Date(request.created_at).toLocaleString("es-ES")
                          : "No disponible"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/tasks/${request.task_id}`}
                          className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
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
      </SectionCard>
    </AppLayout>
  );
}
