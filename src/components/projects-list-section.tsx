import ProjectCard from "@/components/project-card";

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Proyectos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Descubre proyectos open source activos para colaborar
        </p>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
    </>
  );
}
