import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";
import DifficultyBadge from "@/components/ui/difficulty-badge";

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
    <AppLayout containerClassName="mx-auto max-w-6xl">
      <SectionCard className="p-8">
        <PageHeader
          title="Mis tareas"
          description="Tareas asignadas para avanzar en tus contribuciones."
          actions={
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Volver al dashboard
            </Link>
          }
        />

        {myTasks.length === 0 ? (
          <EmptyState
            title="No tienes tareas asignadas"
            description="Cuando un maintainer apruebe tu solicitud, la tarea aparecerá en este panel."
            action={
              <Link
                href="/dashboard/my-requests"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                Ver mis solicitudes
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
                  <th className="px-4 py-3 font-medium">Dificultad</th>
                  <th className="px-4 py-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.map((task) => {
                  const project = projectById.get(task.project_id);

                  return (
                    <tr key={task.id} className="border-t border-white/10">
                      <td className="px-4 py-3 align-top text-white">{task.title || "Tarea sin título"}</td>
                      <td className="px-4 py-3 align-top text-gray-300">{project?.name || "Proyecto no disponible"}</td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <DifficultyBadge difficulty={task.difficulty} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/tasks/${task.id}`}
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
