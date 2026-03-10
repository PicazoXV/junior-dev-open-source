import ProjectCard from "@/components/project-card";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";

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
        <SectionCard className="border-dashed p-10 text-center">
          <h2 className="text-lg font-semibold text-white">
            Todavía no hay proyectos activos
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Vuelve más tarde para ver nuevas oportunidades de colaboración.
          </p>
        </SectionCard>
      )}
    </>
  );
}
