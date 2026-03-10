import ProjectCard from "@/components/project-card";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";

type Project = {
  id: string;
  slug: string | null;
  name: string;
  short_description: string | null;
  tech_stack: string[] | null;
};

type ProjectsListSectionProps = {
  projects: Project[] | null;
};

export default function ProjectsListSection({ projects }: ProjectsListSectionProps) {
  return (
    <>
      <PageHeader
        title="Proyectos"
        description="Descubre proyectos open source activos para colaborar"
      />

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no hay proyectos activos"
          description="Vuelve más tarde para ver nuevas oportunidades de colaboración."
        />
      )}
    </>
  );
}
