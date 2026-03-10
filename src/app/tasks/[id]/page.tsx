import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import RequestTaskForm from "@/components/request-task-form";
import Badge from "@/components/ui/badge";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import StatusBadge from "@/components/ui/status-badge";
import GitHubIssueBadge from "@/components/ui/github-issue-badge";
import { isReviewerRole } from "@/lib/roles";
import ContributionShareActions from "@/components/contribution-share-actions";

type TaskDetailPageProps = {
  params: Promise<{ id: string }>;
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const code = error.code || "";
  const message = error.message?.toLowerCase() || "";

  return (
    code === "42703" ||
    message.includes("learning_resources") ||
    message.includes("github_pr_url") ||
    message.includes("github_pr_number") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function getBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "https://www.primerissue.dev";
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id || typeof id !== "string") {
    notFound();
  }

  const supabase = await createClient();

  const taskWithResources = await supabase
    .from("tasks")
    .select(
      "id, project_id, title, description, status, difficulty, labels, github_issue_url, github_pr_url, github_pr_number, assigned_to, learning_resources"
    )
    .eq("id", id)
    .maybeSingle();

  let task = taskWithResources.data;
  let taskError = taskWithResources.error;

  if (taskError && isMissingColumnError(taskError)) {
    const fallbackTask = await supabase
      .from("tasks")
      .select(
        "id, project_id, title, description, status, difficulty, labels, github_issue_url, assigned_to"
      )
      .eq("id", id)
      .maybeSingle();
    task = fallbackTask.data
      ? ({
          ...fallbackTask.data,
          github_pr_url: null,
          github_pr_number: null,
          learning_resources: null,
        } as typeof task)
      : null;
    taskError = fallbackTask.error;
  }

  if (taskError) {
    console.error("Error cargando tarea:", taskError.message);
    notFound();
  }

  if (!task) {
    notFound();
  }

  const [
    { data: project, error: projectError },
    { data: profile },
    { data: existingRequest },
    { data: assignedDeveloper },
  ] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, slug, name")
        .eq("id", task.project_id)
        .maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("task_requests")
        .select("id, status")
        .eq("task_id", task.id)
        .eq("user_id", user.id)
        .maybeSingle(),
      task.assigned_to
        ? supabase
            .from("profiles")
            .select("id, github_username, full_name")
            .eq("id", task.assigned_to)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (projectError) {
    console.error("Error cargando proyecto de la tarea:", projectError.message);
  }

  const canEdit = isReviewerRole(profile?.role);
  const isTaskOpen = task.status === "open";
  const canShareContribution =
    task.status === "completed" && !!task.assigned_to && task.assigned_to === user.id;
  const contributionUrl = `${getBaseUrl()}/contribution/${task.id}`;

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={task.title || "Tarea sin título"}
          description="Detalle de la tarea y contexto del proyecto"
          actions={
            <>
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                Volver a proyectos
              </Link>

              {project?.slug ? (
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  Ver proyecto
                </Link>
              ) : null}

              {canEdit ? (
                <Link
                  href={`/dashboard/tasks/${task.id}/edit`}
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                >
                  Editar tarea
                </Link>
              ) : null}
            </>
          }
        />

        <section className="rounded-2xl border border-white/20 bg-black/20 p-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={task.status} />
            <DifficultyBadge difficulty={task.difficulty} />
            <GitHubIssueBadge issueUrl={task.github_issue_url} />
          </div>

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-gray-400">Descripción</p>
            <p className="whitespace-pre-line text-gray-200">
              {task.description || "Sin descripción disponible."}
            </p>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-400">Labels</p>
            {task.labels && task.labels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.labels.map((label: string) => (
                  <Badge key={`${task.id}-${label}`}>{label}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay labels para esta tarea.</p>
            )}
          </div>

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-gray-400">GitHub Issue</p>
            {task.github_issue_url ? (
              <div className="flex flex-wrap items-center gap-2">
                <GitHubIssueBadge issueUrl={task.github_issue_url} compact />
                <Link
                  href={task.github_issue_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  Ver issue en GitHub
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <GitHubIssueBadge issueUrl={null} compact />
                <p className="text-sm text-gray-500">La tarea todavía no tiene issue enlazado.</p>
              </div>
            )}
          </div>

          {canShareContribution ? (
            <div className="mt-6 rounded-xl border border-white/20 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">🎉 Contribution completed</p>
              <p className="mt-1 text-sm text-gray-300">
                Project: {project?.name || "Proyecto"} · Task: {task.title || "Tarea"}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                PR merged:{" "}
                {task.github_pr_number ? `#${task.github_pr_number}` : "detectado"} · Developer:{" "}
                {assignedDeveloper?.github_username
                  ? `@${assignedDeveloper.github_username}`
                  : assignedDeveloper?.full_name || "@developer"}
              </p>
              <ContributionShareActions
                contributionUrl={contributionUrl}
                projectName={project?.name || "Proyecto"}
                taskTitle={task.title || "Tarea"}
                prNumber={task.github_pr_number}
                developerUsername={assignedDeveloper?.github_username || null}
              />
              <div className="mt-3">
                <Link
                  href={`/contribution/${task.id}`}
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
                >
                  Ver página pública de contribución
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-400">Learning resources</p>
            {task.learning_resources && task.learning_resources.length > 0 ? (
              <div className="flex flex-col gap-2">
                {task.learning_resources.map((resource: string) => (
                  <Link
                    key={`${task.id}-${resource}`}
                    href={resource}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  >
                    {resource}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Esta tarea no incluye recursos adicionales por ahora.
              </p>
            )}
          </div>
        </section>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Solicitar esta tarea"
          description="Envía tu solicitud para que un maintainer la revise."
        />

        {existingRequest ? (
          <EmptyState
            title="Ya enviaste una solicitud para esta tarea"
            description="Puedes seguir el estado desde el panel de Mis solicitudes."
            action={
              <Link
                href="/dashboard/my-requests"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                Ver mis solicitudes
              </Link>
            }
          />
        ) : isTaskOpen ? (
          <RequestTaskForm taskId={task.id} isTaskOpen={isTaskOpen} />
        ) : (
          <EmptyState
            title="Esta tarea ya no está disponible"
            description="El estado actual de la tarea no permite nuevas solicitudes."
          />
        )}
      </SectionCard>
    </AppLayout>
  );
}
