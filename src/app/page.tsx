import GitHubLoginButton from "@/components/github-login-button";
import Navbar from "@/components/navbar";
import ProjectsListSection from "@/components/projects-list-section";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";

export default async function HomePage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    return (
      <main className="app-bg flex min-h-screen items-center justify-center p-6">
        <div className="app-shell w-full max-w-xl rounded-2xl p-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="accent-dot" />
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Open Source Hub</p>
          </div>
          <h1 className="text-3xl font-bold text-gray-100">Junior Dev Open Source</h1>
          <p className="mt-2 text-gray-500">Conecta tu GitHub y empieza a colaborar.</p>
          <div className="mt-6">
            <GitHubLoginButton />
          </div>
        </div>
      </main>
    );
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
    <main className="app-bg min-h-screen p-8 lg:pr-72">
      <Navbar />
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <ProjectsListSection projects={projects} />
      </div>
    </main>
  );
}
