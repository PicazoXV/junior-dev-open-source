import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { updateTaskAction } from "@/app/dashboard/tasks/[id]/edit/actions";
import { isReviewerRole } from "@/lib/roles";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";

type TaskEditPageProps = {
  params: Promise<{ id: string }>;
};

type Task = {
  id: string;
  project_id: string;
  title: string | null;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  labels: string[] | null;
  github_issue_url: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
};

export default async function EditTaskPage({ params }: TaskEditPageProps) {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const { id } = await params;
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

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, project_id, title, description, status, difficulty, labels, github_issue_url")
    .eq("id", id)
    .maybeSingle();

  if (taskError) {
    console.error("Error cargando tarea:", taskError.message);
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .order("name", { ascending: true });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const currentTask = task as Task | null;
  const projectOptions = (projects || []) as ProjectOption[];

  return (
    <AppLayout containerClassName="mx-auto max-w-4xl">
      <SectionCard className="p-8">
        <PageHeader
          title="Editar tarea"
          description="Ajusta estado, descripción y metadatos de la tarea."
          actions={
            <Link
              href="/dashboard/tasks"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Volver a gestión
            </Link>
          }
        />

        {!currentTask ? (
          <EmptyState
            title="Tarea no encontrada"
            description="No existe una tarea con el ID proporcionado."
          />
        ) : (
          <form action={updateTaskAction} className="space-y-5">
            <input type="hidden" name="id" value={currentTask.id} />

            <div>
              <label htmlFor="project_id" className="mb-1 block text-sm font-medium text-gray-300">
                Proyecto
              </label>
              <select id="project_id" name="project_id" required defaultValue={currentTask.project_id} className="w-full rounded-lg border px-3 py-2 text-sm">
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-300">
                Título
              </label>
              <input id="title" name="title" required defaultValue={currentTask.title || ""} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-300">
                Descripción
              </label>
              <textarea id="description" name="description" rows={5} defaultValue={currentTask.description || ""} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-gray-300">
                  Dificultad
                </label>
                <select id="difficulty" name="difficulty" defaultValue={currentTask.difficulty || "beginner"} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-300">
                  Estado
                </label>
                <select id="status" name="status" defaultValue={currentTask.status} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="open">open</option>
                  <option value="assigned">assigned</option>
                  <option value="in_review">in_review</option>
                  <option value="completed">completed</option>
                  <option value="closed">closed</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="labels" className="mb-1 block text-sm font-medium text-gray-300">
                Labels (separadas por comas)
              </label>
              <input id="labels" name="labels" defaultValue={(currentTask.labels || []).join(", ")} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label htmlFor="github_issue_url" className="mb-1 block text-sm font-medium text-gray-300">
                URL del issue de GitHub
              </label>
              <input id="github_issue_url" name="github_issue_url" type="url" defaultValue={currentTask.github_issue_url || ""} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        )}
      </SectionCard>
    </AppLayout>
  );
}
