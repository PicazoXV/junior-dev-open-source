import type { Metadata } from "next";
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
import { getCurrentLocale } from "@/lib/i18n/server";
import FavoriteToggle from "@/components/favorites/favorite-toggle";
import { addTaskCommentAction } from "@/app/tasks/[id]/actions";

type TaskDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
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
    message.includes("estimated_minutes") ||
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

  return "https://www.miprimerissue.dev";
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const locale = await getCurrentLocale();
  const user = await createProfileIfNeeded();
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!user) {
    const safeId = id && typeof id === "string" ? id : "";
    const nextPath = safeId ? `/tasks/${safeId}` : "/buena-primera-issue";
    redirect(`/?notice=login-required&next=${encodeURIComponent(nextPath)}`);
  }

  if (!id || typeof id !== "string") {
    notFound();
  }

  const supabase = await createClient();

  const taskWithResources = await supabase
    .from("tasks")
    .select(
      "id, project_id, title, description, status, difficulty, labels, github_issue_url, github_pr_url, github_pr_number, assigned_to, learning_resources, estimated_minutes"
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
          estimated_minutes: null,
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
    { data: favoriteTask },
    { data: comments },
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
      supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", "task")
        .eq("item_id", task.id)
        .maybeSingle(),
      supabase
        .from("task_comments")
        .select("id, body, created_at, user_id, profile:profiles(full_name, github_username)")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false }),
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
      <SectionCard variant="hero" className="p-8">
        <PageHeader
          title={task.title || (locale === "en" ? "Untitled task" : "Tarea sin título")}
          description={locale === "en" ? "Task details and project context" : "Detalle de la tarea y contexto del proyecto"}
          actions={
            <>
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                {locale === "en" ? "Back to projects" : "Volver a proyectos"}
              </Link>

              {project?.slug ? (
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  {locale === "en" ? "View project" : "Ver proyecto"}
                </Link>
              ) : null}

              {canEdit ? (
                <Link
                  href={`/dashboard/tasks/${task.id}/edit`}
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                >
                  {locale === "en" ? "Edit task" : "Editar tarea"}
                </Link>
              ) : null}
              <FavoriteToggle
                itemType="task"
                itemId={task.id}
                initiallyFavorite={!!favoriteTask}
                size="md"
              />
            </>
          }
        />

        <section className="surface-subcard rounded-2xl p-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={task.status} />
            <DifficultyBadge difficulty={task.difficulty} />
            <GitHubIssueBadge issueUrl={task.github_issue_url} />
            {task.estimated_minutes ? (
              <Badge tone="info">
                {locale === "en"
                  ? `${task.estimated_minutes} min estimate`
                  : `${task.estimated_minutes} min estimados`}
              </Badge>
            ) : null}
          </div>

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-gray-400">
              {locale === "en" ? "Description" : "Descripción"}
            </p>
            <p className="whitespace-pre-line text-gray-200">
              {task.description || (locale === "en" ? "No description available." : "Sin descripción disponible.")}
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
              <p className="text-sm text-gray-500">{locale === "en" ? "This task has no labels." : "No hay labels para esta tarea."}</p>
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
                  {locale === "en" ? "View issue on GitHub" : "Ver issue en GitHub"}
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <GitHubIssueBadge issueUrl={null} compact />
                <p className="text-sm text-gray-500">{locale === "en" ? "This task does not have a linked issue yet." : "La tarea todavía no tiene issue enlazado."}</p>
              </div>
            )}
          </div>

          {canShareContribution ? (
            <div className="surface-subcard mt-6 rounded-xl p-4">
              <p className="text-sm font-semibold text-white">
                {locale === "en" ? "🎉 Contribution completed" : "🎉 Contribución completada"}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                {locale === "en" ? "Project" : "Proyecto"}:{" "}
                {project?.name || (locale === "en" ? "Project" : "Proyecto")} ·{" "}
                {locale === "en" ? "Task" : "Tarea"}:{" "}
                {task.title || (locale === "en" ? "Task" : "Tarea")}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {locale === "en" ? "PR merged" : "PR mergeado"}:{" "}
                {task.github_pr_number
                  ? `#${task.github_pr_number}`
                  : locale === "en"
                    ? "detected"
                    : "detectado"}{" "}
                · {locale === "en" ? "Developer" : "Developer"}:{" "}
                {assignedDeveloper?.github_username
                  ? `@${assignedDeveloper.github_username}`
                  : assignedDeveloper?.full_name ||
                    (locale === "en" ? "@developer" : "@developer")}
              </p>
              <ContributionShareActions
                contributionUrl={contributionUrl}
                projectName={project?.name || "Proyecto"}
                taskTitle={task.title || (locale === "en" ? "Task" : "Tarea")}
                prNumber={task.github_pr_number}
                developerUsername={assignedDeveloper?.github_username || null}
              />
              <div className="mt-3">
                <Link
                  href={`/contribution/${task.id}`}
                  className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
                >
                  {locale === "en" ? "View public contribution page" : "Ver página pública de contribución"}
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-400">
              {locale === "en" ? "Learning resources" : "Learning resources"}
            </p>
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
                {locale === "en"
                  ? "This task does not include extra learning resources yet."
                  : "Esta tarea no incluye recursos adicionales por ahora."}
              </p>
            )}
          </div>

          <div className="surface-subcard mt-8 rounded-xl p-4">
            <h3 className="text-base font-semibold text-white">
              {locale === "en" ? "Task comments" : "Comentarios de la tarea"}
            </h3>

            <form action={addTaskCommentAction} className="mt-4 space-y-3">
              <input type="hidden" name="taskId" value={task.id} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder={
                  locale === "en"
                    ? "Write a comment to ask questions or add context..."
                    : "Escribe un comentario para resolver dudas o añadir contexto..."
                }
                className="w-full rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
              <button
                type="submit"
                className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Add comment" : "Añadir comentario"}
              </button>
            </form>

            <div className="mt-4 space-y-3">
              {(comments || []).length === 0 ? (
                <p className="text-sm text-gray-500">
                  {locale === "en"
                    ? "No comments yet."
                    : "Todavía no hay comentarios."}
                </p>
              ) : (
                (comments || []).map((comment) => {
                  const profile = Array.isArray(comment.profile)
                    ? comment.profile[0]
                    : comment.profile;
                  const author =
                    profile?.github_username
                      ? `@${profile.github_username}`
                      : profile?.full_name || (locale === "en" ? "Developer" : "Developer");

                  return (
                    <article
                      key={comment.id}
                      className="surface-subcard rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white">{author}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString(
                            locale === "en" ? "en-US" : "es-ES"
                          )}
                        </p>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-gray-300">
                        {comment.body}
                      </p>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </SectionCard>

      <SectionCard className="surface-accent p-8">
        <PageHeader
          as="h2"
          title={locale === "en" ? "Request this task" : "Solicitar esta tarea"}
          description={
            locale === "en"
              ? "Send your request so a maintainer can review it."
              : "Envía tu solicitud para que un maintainer la revise."
          }
        />

        {existingRequest ? (
          <EmptyState
            title="Ya enviaste una solicitud para esta tarea"
            description={
              locale === "en"
                ? "You can track the status from your My requests panel."
                : "Puedes seguir el estado desde el panel de Mis solicitudes."
            }
            action={
              <Link
                href="/dashboard/my-requests"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                {locale === "en" ? "View my requests" : "Ver mis solicitudes"}
              </Link>
            }
          />
        ) : isTaskOpen ? (
          <RequestTaskForm taskId={task.id} isTaskOpen={isTaskOpen} />
        ) : (
          <EmptyState
            title="Esta tarea ya no está disponible"
            description={
              locale === "en"
                ? "The current task status does not allow new requests."
                : "El estado actual de la tarea no permite nuevas solicitudes."
            }
          />
        )}
      </SectionCard>
    </AppLayout>
  );
}
