import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectsListSection from "@/components/projects-list-section";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";

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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando proyectos:", error.message);
  }

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl">
      <SectionCard className="p-8">
        <ProjectsListSection projects={projects} />
      </SectionCard>
    </AppLayout>
  );
}
