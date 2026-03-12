import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";
import Badge from "@/components/ui/badge";
import { getCurrentLocale } from "@/lib/i18n/server";

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
  const locale = await getCurrentLocale();
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
  const requestCounters = {
    pending: myRequests.filter((request) => request.status === "pending").length,
    approved: myRequests.filter((request) => request.status === "approved").length,
    rejected: myRequests.filter((request) => request.status === "rejected").length,
    cancelled: myRequests.filter((request) => request.status === "cancelled").length,
  };

  const getStatusAccent = (status: MyRequest["status"]) => {
    if (status === "approved") return "border-emerald-400/35 bg-emerald-500/12";
    if (status === "pending") return "border-orange-400/35 bg-orange-500/12";
    if (status === "rejected") return "border-red-400/35 bg-red-500/12";
    return "border-white/15 bg-white/[0.03]";
  };

  const getStatusIcon = (status: MyRequest["status"]) => {
    if (status === "approved") return CheckCircle2;
    if (status === "pending") return Clock3;
    if (status === "rejected") return XCircle;
    return Send;
  };

  const getStatusHint = (status: MyRequest["status"]) => {
    if (status === "approved") {
      return locale === "en"
        ? "Approved by maintainer. You can continue from your assigned tasks."
        : "Aprobada por maintainer. Ya puedes continuar desde tus tareas asignadas.";
    }
    if (status === "pending") {
      return locale === "en"
        ? "Waiting for maintainer review. Keep your profile updated to improve approval chances."
        : "Esperando revisión del maintainer. Mantén tu perfil actualizado para mejorar la aprobación.";
    }
    if (status === "rejected") {
      return locale === "en"
        ? "Not approved this time. Try another task that fits your current level."
        : "No fue aprobada esta vez. Prueba otra tarea que encaje mejor con tu nivel actual.";
    }
    return locale === "en"
      ? "This request is no longer active."
      : "Esta solicitud ya no está activa.";
  };

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="surface-accent relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.2),transparent_48%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-gray-300">
                <Send className="h-3.5 w-3.5 text-orange-300" />
                {locale === "en" ? "Request tracker" : "Seguimiento de solicitudes"}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {locale === "en" ? "My requests" : "Mis solicitudes"}
              </h1>
              <p className="mt-2 text-sm text-gray-200/90 md:text-base">
                {locale === "en"
                  ? "Track every task request and quickly understand what to do next."
                  : "Haz seguimiento de cada solicitud de tarea y entiende rápido cuál es el siguiente paso."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                {locale === "en" ? "Back to dashboard" : "Volver al dashboard"}
              </Link>
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Explore projects" : "Explorar proyectos"}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-subcard rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{locale === "en" ? "Total" : "Total"}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{myRequests.length}</p>
            </div>
            <div className="surface-subcard rounded-xl border-orange-500/30 bg-orange-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-orange-200/90">{locale === "en" ? "Pending" : "Pendientes"}</p>
              <p className="mt-2 text-2xl font-semibold text-orange-200">{requestCounters.pending}</p>
            </div>
            <div className="surface-subcard rounded-xl border-emerald-500/25 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-emerald-200">{locale === "en" ? "Approved" : "Aprobadas"}</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-200">{requestCounters.approved}</p>
            </div>
            <div className="surface-subcard rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{locale === "en" ? "Closed" : "Cerradas"}</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {requestCounters.rejected + requestCounters.cancelled}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-6 md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {locale === "en" ? "Request history" : "Historial de solicitudes"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {locale === "en"
                ? "See each request status at a glance and continue from the right place."
                : "Consulta cada estado de un vistazo y continúa desde el lugar correcto."}
            </p>
          </div>
          <Badge tone={requestCounters.pending > 0 ? "warning" : "default"}>
            {requestCounters.pending > 0
              ? locale === "en"
                ? `${requestCounters.pending} waiting review`
                : `${requestCounters.pending} esperando revisión`
              : locale === "en"
                ? "No pending requests"
                : "Sin pendientes"}
          </Badge>
        </div>

        {myRequests.length === 0 ? (
          <EmptyState
            title={
              locale === "en"
                ? "You have not sent requests yet"
                : "Todavía no has enviado solicitudes"
            }
            description={
              locale === "en"
                ? "Explore active projects and request a task to start collaborating."
                : "Explora proyectos activos y solicita una tarea para empezar a colaborar."
            }
            action={
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Explore projects" : "Explorar proyectos"}
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {myRequests.map((request) => {
              const task = taskById.get(request.task_id);
              const project = projectById.get(request.project_id);
              const Icon = getStatusIcon(request.status);

              return (
                <article
                  key={request.id}
                  className={`surface-subcard rounded-2xl border p-5 transition hover:border-orange-500/30 ${getStatusAccent(request.status)}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-orange-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {task?.title || (locale === "en" ? "Task not available" : "Tarea no disponible")}
                        </p>
                        <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
                          <FolderKanban className="h-3.5 w-3.5 text-orange-300" />
                          {project?.name || (locale === "en" ? "Project not available" : "Proyecto no disponible")}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {request.created_at
                            ? new Date(request.created_at).toLocaleString(
                                locale === "en" ? "en-US" : "es-ES"
                              )
                            : locale === "en"
                              ? "Not available"
                              : "No disponible"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <p className="mt-3 text-sm text-gray-300">{getStatusHint(request.status)}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/tasks/${request.task_id}`}
                      className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                    >
                      {locale === "en" ? "Open task" : "Abrir tarea"}
                    </Link>
                    {request.status === "approved" ? (
                      <Link
                        href="/dashboard/my-tasks"
                        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
                      >
                        {locale === "en" ? "Go to my tasks" : "Ir a mis tareas"}
                      </Link>
                    ) : null}
                    {request.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-[11px] text-orange-200">
                        <Sparkles className="h-3 w-3" />
                        {locale === "en" ? "Waiting review" : "Esperando revisión"}
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}
