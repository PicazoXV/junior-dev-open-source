import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import ProjectsListSection from "@/components/projects-list-section";

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
    redirect("/");
  }

  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, slug, name, short_description, tech_stack")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<Project[]>();

  if (error) {
    console.error("Error cargando proyectos:", error.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Navbar />
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <ProjectsListSection projects={projects} />
      </div>
    </main>
  );
}
