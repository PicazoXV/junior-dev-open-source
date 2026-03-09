import Link from "next/link";

type ProjectCardProps = {
  project: {
    id: string;
    slug: string | null;
    name: string;
    short_description: string | null;
    tech_stack: string[] | null;
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-xl border p-5">
      <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>

      <p className="mt-2 text-sm text-gray-600">
        {project.short_description || "Sin descripción corta disponible."}
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

      {project.slug ? (
        <Link
          href={`/projects/${project.slug}`}
          className="mt-5 inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Ver proyecto
        </Link>
      ) : (
        <p className="mt-5 text-sm text-gray-500">Proyecto sin slug disponible.</p>
      )}
    </article>
  );
}
