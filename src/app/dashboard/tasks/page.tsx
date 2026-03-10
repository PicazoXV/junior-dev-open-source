import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { isReviewerRole } from "@/lib/roles";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import StatusBadge from "@/components/ui/status-badge";
import GitHubIssueBadge from "@/components/ui/github-issue-badge";
import { getCurrentLocale } from "@/lib/i18n/server";

type TaskRow = {
  id: string;
  project_id: string;
  title: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  estimated_minutes: number | null;
  created_at: string;
  github_issue_url: string | null;
};

type ProjectRow = {
  id: string;
  name: string | null;
};

function isMissingEstimatedColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return (
    code === "42703" ||
    message.includes("estimated_minutes") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export default async function DashboardTasksPage() {
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

  if (!isReviewerRole(profile?.role)) {
    redirect("/dashboard");
  }

  const withEstimate = await supabase
    .from("tasks")
    .select("id, project_id, title, status, difficulty, estimated_minutes, created_at, github_issue_url")
    .order("created_at", { ascending: false });

  let tasks = withEstimate.data;
  let tasksError = withEstimate.error;

  if (tasksError && isMissingEstimatedColumnError(tasksError)) {
    const fallback = await supabase
      .from("tasks")
      .select("id, project_id, title, status, difficulty, created_at, github_issue_url")
      .order("created_at", { ascending: false });
    tasks = (fallback.data || []).map((task) => ({ ...task, estimated_minutes: null }));
    tasksError = fallback.error;
  }

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
    <AppLayout containerClassName="mx-auto max-w-6xl">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Manage tasks" : "Gestionar tareas"}
          description={
            locale === "en"
              ? "Manage status, difficulty, and related project for each task."
              : "Administra estado, dificultad y proyecto asociado de cada tarea."
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/tasks/new"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "New task" : "Nueva tarea"}
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                {locale === "en" ? "Back to dashboard" : "Volver al dashboard"}
              </Link>
            </div>
          }
        />

        {taskRows.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No tasks registered" : "No hay tareas registradas"}
            description={
              locale === "en"
                ? "Create tasks so junior developers can request and collaborate."
                : "Crea tareas para que la comunidad junior pueda solicitarlas y colaborar."
            }
            action={
              <Link
                href="/dashboard/tasks/new"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Create task" : "Crear tarea"}
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/20 bg-black/20">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Title" : "Título"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Project" : "Proyecto"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Status" : "Estado"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Difficulty" : "Dificultad"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Estimate" : "Estimación"}</th>
                  <th className="px-4 py-3 font-medium">GitHub</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Created" : "Creada"}</th>
                  <th className="px-4 py-3 font-medium">{locale === "en" ? "Actions" : "Acciones"}</th>
                </tr>
              </thead>
              <tbody>
                {taskRows.map((task) => {
                  const project = projectById.get(task.project_id);

                  return (
                    <tr key={task.id} className="border-t border-white/10">
                      <td className="px-4 py-3 align-top text-white">
                        {task.title || (locale === "en" ? "Untitled" : "Sin título")}
                      </td>
                      <td className="px-4 py-3 align-top text-gray-300">
                        {project?.name || (locale === "en" ? "Project not available" : "Proyecto no disponible")}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <DifficultyBadge difficulty={task.difficulty} />
                      </td>
                      <td className="px-4 py-3 align-top text-gray-300">
                        {task.estimated_minutes
                          ? `${task.estimated_minutes} min`
                          : locale === "en"
                            ? "N/A"
                            : "N/D"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <GitHubIssueBadge issueUrl={task.github_issue_url} compact />
                          {task.github_issue_url ? (
                            <Link
                              href={task.github_issue_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-orange-300 hover:underline"
                            >
                              {locale === "en" ? "View issue" : "Ver issue"}
                            </Link>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-400">
                        {task.created_at
                          ? new Date(task.created_at).toLocaleString(
                              locale === "en" ? "en-US" : "es-ES"
                            )
                          : locale === "en"
                            ? "Not available"
                            : "No disponible"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/dashboard/tasks/${task.id}/edit`}
                          className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                        >
                          {locale === "en" ? "Edit" : "Editar"}
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
