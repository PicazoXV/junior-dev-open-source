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
import { getCurrentLocale } from "@/lib/i18n/server";

type ProjectOption = {
  id: string;
  name: string;
};

export default async function NewTaskPage() {
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
          title={locale === "en" ? "New task" : "Nueva tarea"}
          description={
            locale === "en"
              ? "Publish a new task inside an active project."
              : "Publica una nueva tarea dentro de un proyecto activo."
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

        {projectOptions.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No active projects available" : "No hay proyectos activos disponibles"}
            description={
              locale === "en"
                ? "Create or activate a project before adding new tasks."
                : "Crea o activa un proyecto antes de añadir nuevas tareas."
            }
            action={
              <Link
                href="/dashboard/projects/new"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Create project" : "Crear proyecto"}
              </Link>
            }
          />
        ) : (
          <form action={createTaskAction} className="space-y-5">
            <div className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-orange-300">
                {locale === "en" ? "Suggested task template" : "Plantilla sugerida de tarea"}
              </p>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-300">
{`Contexto / Context:
- ¿Qué problema estamos resolviendo?

Objetivo / Goal:
- Resultado esperado de la tarea

Pasos sugeridos / Suggested steps:
1.
2.
3.

Recursos / Resources:
- Docs, enlaces, ejemplos

Definición de terminado / Definition of done:
- Criterios claros para considerar la tarea completada`}
              </pre>
            </div>

            <div>
              <label htmlFor="project_id" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Project" : "Proyecto"}
              </label>
              <select id="project_id" name="project_id" required className="form-control form-select">
                <option value="">{locale === "en" ? "Select a project" : "Selecciona un proyecto"}</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Title" : "Título"}
              </label>
              <input id="title" name="title" required className="form-control" />
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Description" : "Descripción"}
              </label>
              <textarea id="description" name="description" rows={5} className="form-control" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-gray-300">
                  {locale === "en" ? "Difficulty" : "Dificultad"}
                </label>
                <select id="difficulty" name="difficulty" defaultValue="beginner" className="form-control form-select">
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-300">
                  {locale === "en" ? "Status" : "Estado"}
                </label>
                <select id="status" name="status" defaultValue="open" className="form-control form-select">
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
                {locale === "en" ? "Labels (comma separated)" : "Labels (separadas por comas)"}
              </label>
              <input id="labels" name="labels" placeholder="good first issue, backend, bug" className="form-control" />
            </div>

            <div>
              <label htmlFor="estimated_minutes" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Estimated time (minutes)" : "Tiempo estimado (minutos)"}
              </label>
              <input
                id="estimated_minutes"
                name="estimated_minutes"
                type="number"
                min={5}
                step={5}
                placeholder={locale === "en" ? "e.g. 60" : "ej. 60"}
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="learning_resources" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Learning resources (comma-separated links)" : "Learning resources (links separados por comas)"}
              </label>
              <input
                id="learning_resources"
                name="learning_resources"
                placeholder="https://docs..., https://tutorial..."
                className="form-control"
              />
            </div>

            <div>
              <label htmlFor="github_issue_url" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "GitHub issue URL" : "URL del issue de GitHub"}
              </label>
              <input
                id="github_issue_url"
                name="github_issue_url"
                type="url"
                placeholder="https://github.com/org/repo/issues/123"
                className="form-control"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "Create task" : "Crear tarea"}
              </button>
            </div>
          </form>
        )}
      </SectionCard>
    </AppLayout>
  );
}
