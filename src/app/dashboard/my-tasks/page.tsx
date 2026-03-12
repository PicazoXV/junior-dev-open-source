import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, FolderKanban, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import Badge from "@/components/ui/badge";
import { getCurrentLocale } from "@/lib/i18n/server";

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
  const locale = await getCurrentLocale();
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
  const activeTaskCount = myTasks.filter((task) =>
    ["open", "assigned", "in_review"].includes(task.status)
  ).length;
  const completedTaskCount = myTasks.filter((task) => task.status === "completed").length;
  const reviewTaskCount = myTasks.filter((task) => task.status === "in_review").length;

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="surface-accent relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.22),transparent_46%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-gray-300">
                <BriefcaseBusiness className="h-3.5 w-3.5 text-orange-300" />
                {locale === "en" ? "Personal workspace" : "Espacio personal"}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {locale === "en" ? "My tasks" : "Mis tareas"}
              </h1>
              <p className="mt-2 text-sm text-gray-200/90 md:text-base">
                {locale === "en"
                  ? "Your assigned tasks, current status, and direct access to keep contributing."
                  : "Tus tareas asignadas, su estado actual y acceso directo para seguir contribuyendo."}
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
                href="/buena-primera-issue"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Explore more issues" : "Explorar más issues"}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="surface-subcard rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                {locale === "en" ? "Total tasks" : "Tareas totales"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{myTasks.length}</p>
            </div>
            <div className="surface-subcard rounded-xl border-orange-500/30 bg-orange-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-orange-200/90">
                {locale === "en" ? "Active now" : "Activas ahora"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-orange-200">{activeTaskCount}</p>
            </div>
            <div className="surface-subcard rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                {locale === "en" ? "Completed" : "Completadas"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{completedTaskCount}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-6 md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {locale === "en" ? "Assigned queue" : "Cola de tareas asignadas"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {locale === "en"
                ? "A clear snapshot of what is in progress and what needs your next push."
                : "Una vista clara de lo que está en marcha y lo que necesita tu siguiente avance."}
            </p>
          </div>
          <Badge tone={reviewTaskCount > 0 ? "warning" : "default"}>
            {locale === "en"
              ? `${reviewTaskCount} in review`
              : `${reviewTaskCount} en review`}
          </Badge>
        </div>

        {myTasks.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "You have no assigned tasks" : "No tienes tareas asignadas"}
            description={
              locale === "en"
                ? "When a maintainer approves one of your requests, your task will appear here with status and next actions."
                : "Cuando un maintainer apruebe una solicitud, tu tarea aparecerá aquí con su estado y acciones recomendadas."
            }
            action={
              <Link
                href="/buena-primera-issue"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Find a first issue" : "Buscar una primera issue"}
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {myTasks.map((task) => {
              const project = projectById.get(task.project_id);
              const projectLabel = project?.name || (locale === "en" ? "Project not available" : "Proyecto no disponible");

              return (
                <article
                  key={task.id}
                  className="surface-subcard group rounded-2xl p-5 transition hover:border-orange-500/35 hover:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {task.title || (locale === "en" ? "Untitled task" : "Tarea sin título")}
                      </p>
                      <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
                        <FolderKanban className="h-3.5 w-3.5 text-orange-300" />
                        {projectLabel}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <DifficultyBadge difficulty={task.difficulty} />
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300">
                      <Target className="h-3 w-3 text-orange-300" />
                      {locale === "en" ? "Assigned to you" : "Asignada para ti"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                    >
                      {locale === "en" ? "Open task" : "Abrir tarea"}
                    </Link>
                    {project?.slug ? (
                      <Link
                        href={`/projects/${project.slug}`}
                        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
                      >
                        {locale === "en" ? "View project" : "Ver proyecto"}
                      </Link>
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
