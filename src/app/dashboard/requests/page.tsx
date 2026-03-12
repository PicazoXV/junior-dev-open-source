import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { approveRequest, rejectRequest } from "@/app/dashboard/requests/actions";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";
import { isReviewerRole, normalizeRole } from "@/lib/roles";
import { getCurrentLocale } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

async function loadRequestProfiles(userIds: string[], locale: "es" | "en") {
  if (userIds.length === 0) {
    return [] as RequestProfile[];
  }

  const supabase = await createClient();
  const directResult = await supabase
    .from("profiles")
    .select("id, full_name, github_username, email")
    .in("id", userIds);

  if (directResult.error) {
    console.error("Error cargando requesters con cliente de sesión:", directResult.error.message);
  }

  const directData = (directResult.data || []) as RequestProfile[];
  if (directData.length >= userIds.length) {
    return directData;
  }

  try {
    const admin = createAdminClient();
    const adminResult = await admin
      .from("profiles")
      .select("id, full_name, github_username, email")
      .in("id", userIds);

    if (adminResult.error) {
      console.error("Error cargando requesters con cliente admin:", adminResult.error.message);
      return directData;
    }

    const adminData = (adminResult.data || []) as RequestProfile[];
    if (adminData.length > directData.length) {
      return adminData;
    }
  } catch (error) {
    console.error(
      locale === "en"
        ? "Admin profile fallback unavailable while loading requesters."
        : "Fallback admin no disponible al cargar requesters.",
      error instanceof Error ? error.message : String(error)
    );
  }

  return directData;
}

export default async function DashboardRequestsPage() {
  const locale = await getCurrentLocale();
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

  const isReviewer = isReviewerRole(profile?.role);

  if (!isReviewer) {
    console.warn("Acceso denegado a /dashboard/requests", {
      userId: user.id,
      role: profile?.role,
      normalizedRole: normalizeRole(profile?.role),
    });
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

  const [profilesData, tasksResult, projectsResult] = await Promise.all([
    loadRequestProfiles(userIds, locale),
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

  const profileById = new Map(
    (profilesData || []).map((item) => [item.id, item])
  );
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
          title={locale === "en" ? "Task requests" : "Solicitudes de tareas"}
          description={
            locale === "en"
              ? "Review pending requests and assign each task to the right collaborator."
              : "Revisa las solicitudes pendientes y asigna la tarea al colaborador adecuado."
          }
          actions={
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              {locale === "en" ? "Back to dashboard" : "Volver al dashboard"}
            </Link>
          }
        />

        {pendingRequests.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No pending requests" : "No hay solicitudes pendientes"}
            description={
              locale === "en"
                ? "When a junior requests an open task, it will appear here for review."
                : "Cuando un junior solicite una tarea abierta, aparecerá aquí para revisión."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/20 bg-black/20">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "User" : "Usuario"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Task" : "Tarea"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Project" : "Proyecto"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Requested at" : "Solicitada"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Status" : "Estado"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Actions" : "Acciones"}</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => {
                  const requester = profileById.get(request.user_id);
                  const task = taskById.get(request.task_id);
                  const project = projectById.get(request.project_id);

                  return (
                    <tr key={request.id} className="border-t border-white/10">
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-white">
                          {requester?.full_name ||
                            (requester?.github_username
                              ? `@${requester.github_username}`
                              : locale === "en"
                                ? "No name"
                                : "Sin nombre")}
                        </p>
                        <p className="text-gray-300">
                          @{requester?.github_username || (locale === "en" ? "no-username" : "sin-username")}
                        </p>
                        <p className="text-gray-500">
                          {requester?.email || (locale === "en" ? "No email" : "Sin email")}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-200">
                        {task?.title || (locale === "en" ? "Task not available" : "Tarea no disponible")}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-300">
                        {project?.name || (locale === "en" ? "Project not available" : "Proyecto no disponible")}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-400">
                        {request.created_at
                          ? new Date(request.created_at).toLocaleString(
                              locale === "en" ? "en-US" : "es-ES"
                            )
                          : locale === "en"
                            ? "Not available"
                            : "No disponible"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        {request.status === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <form action={approveRequest.bind(null, request.id)}>
                              <button
                                type="submit"
                                className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/15"
                              >
                                {locale === "en" ? "Approve" : "Aprobar"}
                              </button>
                            </form>

                            <form action={rejectRequest.bind(null, request.id)}>
                              <button
                                type="submit"
                                className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:bg-orange-500/15"
                              >
                                {locale === "en" ? "Reject" : "Rechazar"}
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {locale === "en" ? "Request reviewed" : "Solicitud revisada"}
                          </span>
                        )}
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
