import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import ProjectExplorer from "@/components/project-explorer";
import PageHeader from "@/components/ui/page-header";

export default async function ProjectsPage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug, name, short_description")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.error("Error cargando proyectos:", projectsError.message);
  }

  const projectIds = (projects || []).map((project) => project.id);

  const { data: tasks, error: tasksError } =
    projectIds.length > 0
      ? await supabase
          .from("tasks")
          .select("id, project_id, title, description, status, difficulty, labels, github_issue_url")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

  if (tasksError) {
    console.error("Error cargando tareas de proyectos:", tasksError.message);
  }

  const tasksByProject = new Map<string, typeof tasks>();
  (tasks || []).forEach((task) => {
    const currentTasks = tasksByProject.get(task.project_id) || [];
    currentTasks.push(task);
    tasksByProject.set(task.project_id, currentTasks);
  });

  const explorerProjects = (projects || []).map((project) => ({
    ...project,
    tasks: tasksByProject.get(project.id) || [],
  }));

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl">
      <SectionCard className="p-8">
        <PageHeader
          title="Proyectos"
          description="Explora proyectos activos y revisa sus tareas en el panel lateral."
        />
        <ProjectExplorer projects={explorerProjects} />
      </SectionCard>
    </AppLayout>
  );
}
