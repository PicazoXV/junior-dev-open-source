import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";

type ProjectRow = {
  id: string;
  name: string | null;
  slug: string | null;
  status: "active" | "archived";
  difficulty: "beginner" | "intermediate" | "advanced";
  created_at: string;
};

export default async function DashboardProjectsPage() {
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

  const isAllowed = profile?.role === "admin" || profile?.role === "maintainer";

  if (!isAllowed) {
    redirect("/dashboard");
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, slug, status, difficulty, created_at")
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const rows = (projects || []) as ProjectRow[];

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Navbar />
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manage projects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestión de proyectos de la plataforma
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/projects/new"
              className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Nuevo proyecto
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No hay proyectos registrados
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Crea un proyecto para empezar a gestionar tareas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Difficulty</th>
                  <th className="px-4 py-3 font-medium">Created at</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((project) => (
                  <tr key={project.id} className="border-t">
                    <td className="px-4 py-3 align-top text-gray-900">
                      {project.name || "Sin nombre"}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">
                      {project.slug || "Sin slug"}
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">{project.status}</td>
                    <td className="px-4 py-3 align-top text-gray-700">{project.difficulty}</td>
                    <td className="px-4 py-3 align-top text-gray-600">
                      {project.created_at
                        ? new Date(project.created_at).toLocaleString("es-ES")
                        : "No disponible"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/dashboard/projects/${project.id}/edit`}
                        className="inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

