import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createTaskAction } from "@/app/dashboard/tasks/new/actions";
import { isReviewerRole } from "@/lib/roles";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";

type ProjectOption = {
  id: string;
  name: string;
};

export default async function NewTaskPage() {
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

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const projectOptions = (projects || []) as ProjectOption[];

  return (
    <AppLayout containerClassName="mx-auto max-w-4xl">
      <SectionCard className="p-8">
        <PageHeader
          title="Nueva tarea"
          description="Publica una nueva tarea dentro de un proyecto activo."
          actions={
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Volver al dashboard
            </Link>
          }
        />

        {projectOptions.length === 0 ? (
          <EmptyState
            title="No hay proyectos activos disponibles"
            description="Crea o activa un proyecto antes de añadir nuevas tareas."
            action={
              <Link
                href="/dashboard/projects/new"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                Crear proyecto
              </Link>
            }
          />
        ) : (
          <form action={createTaskAction} className="space-y-5">
            <div>
              <label htmlFor="project_id" className="mb-1 block text-sm font-medium text-gray-300">
                Proyecto
              </label>
              <select id="project_id" name="project_id" required className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">Selecciona un proyecto</option>
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
              <input id="title" name="title" required className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-300">
                Descripción
              </label>
              <textarea id="description" name="description" rows={5} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-gray-300">
                  Dificultad
                </label>
                <select id="difficulty" name="difficulty" defaultValue="beginner" className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-300">
                  Estado
                </label>
                <select id="status" name="status" defaultValue="open" className="w-full rounded-lg border px-3 py-2 text-sm">
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
              <input id="labels" name="labels" placeholder="good first issue, backend, bug" className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label htmlFor="github_issue_url" className="mb-1 block text-sm font-medium text-gray-300">
                URL del issue de GitHub
              </label>
              <input
                id="github_issue_url"
                name="github_issue_url"
                type="url"
                placeholder="https://github.com/org/repo/issues/123"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                Crear tarea
              </button>
            </div>
          </form>
        )}
      </SectionCard>
    </AppLayout>
  );
}
