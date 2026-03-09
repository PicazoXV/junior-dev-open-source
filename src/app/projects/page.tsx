import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectCard from "@/components/project-card";

type Project = {
  id: string;
  slug: string | null;
  name: string;
  short_description: string | null;
  tech_stack: string[] | null;
};

export default async function ProjectsPage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, slug, name, short_description, tech_stack")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando proyectos:", error.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Proyectos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Descubre proyectos open source activos para colaborar
          </p>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project as Project} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Todavía no hay proyectos activos
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Vuelve más tarde para ver nuevas oportunidades de colaboración.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
