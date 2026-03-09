import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import TaskCard from "@/components/task-card";
import Navbar from "@/components/navbar";

type ProjectDetailPageProps = {
  params: { slug: string };
};

type Project = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  repo_url: string | null;
  tech_stack: string[] | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const { slug } = params;
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug, name, short_description, description, repo_url, tech_stack")
    .eq("slug", slug)
    .returns<Project[]>()
    .maybeSingle();

  if (projectError) {
    console.error("Error cargando proyecto:", projectError.message);
    notFound();
  }

  if (!project) {
    notFound();
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, status, difficulty")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (tasksError) {
    console.error("Error cargando tareas:", tasksError.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Navbar />
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver a proyectos
          </Link>
        </div>

        <section className="rounded-2xl border p-6">
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>

          <p className="mt-2 text-sm text-gray-600">
            {project.short_description || "Sin descripción corta disponible."}
          </p>

          <p className="mt-4 whitespace-pre-line text-gray-800">
            {project.description || "Sin descripción detallada disponible."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {project.tech_stack && project.tech_stack.length > 0 ? (
              project.tech_stack.map((tech) => (
                <span
                  key={`${project.id}-${tech}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {tech}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">Tech stack no especificado.</span>
            )}
          </div>

          {project.repo_url ? (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Ver repositorio
            </a>
          ) : (
            <p className="mt-5 text-sm text-gray-500">Repositorio no disponible.</p>
          )}
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Tareas del proyecto</h2>
            <p className="mt-1 text-sm text-gray-500">Explora las tareas disponibles y su dificultad.</p>
          </div>

          {tasks && tasks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Este proyecto todavía no tiene tareas
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Cuando el maintainer publique tareas, aparecerán aquí.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
