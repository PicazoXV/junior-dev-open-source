import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/navbar";
import RequestTaskForm from "@/components/request-task-form";

type TaskDetailPageProps = {
  params: { id: string };
};

type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  labels: string[] | null;
  github_issue_url: string | null;
};

type Project = {
  id: string;
  slug: string;
  name: string;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const { id } = params;
  const supabase = await createClient();

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, project_id, title, description, status, difficulty, labels, github_issue_url")
    .eq("id", id)
    .returns<Task[]>()
    .maybeSingle();

  if (taskError) {
    console.error("Error cargando tarea:", taskError.message);
    notFound();
  }

  if (!task) {
    notFound();
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug, name")
    .eq("id", task.project_id)
    .returns<Project[]>()
    .maybeSingle();

  if (projectError) {
    console.error("Error cargando proyecto de la tarea:", projectError.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Navbar />
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver a proyectos
          </Link>

          {project?.slug ? (
            <Link
              href={`/projects/${project.slug}`}
              className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Volver a {project.name}
            </Link>
          ) : null}
        </div>

        <section className="rounded-2xl border p-6">
          <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Estado: {task.status}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Dificultad: {task.difficulty || "No especificada"}
            </span>
          </div>

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-gray-500">Descripción</p>
            <p className="whitespace-pre-line text-gray-800">
              {task.description || "Sin descripción disponible."}
            </p>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-500">Labels</p>
            {task.labels && task.labels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.labels.map((label) => (
                  <span
                    key={`${task.id}-${label}`}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay labels para esta tarea.</p>
            )}
          </div>

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-gray-500">GitHub Issue</p>
            {task.github_issue_url ? (
              <a
                href={task.github_issue_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Ver issue en GitHub
              </a>
            ) : (
              <p className="text-sm text-gray-500">No hay issue de GitHub enlazado.</p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-dashed p-6">
          <h2 className="text-xl font-semibold text-gray-900">Solicitar esta tarea</h2>
          <p className="mt-2 text-sm text-gray-500">
            Envía tu solicitud para que un maintainer pueda revisarla.
          </p>
          <div className="mt-4">
            <RequestTaskForm taskId={task.id} isTaskOpen={task.status === "open"} />
          </div>
        </section>
      </div>
    </main>
  );
}
