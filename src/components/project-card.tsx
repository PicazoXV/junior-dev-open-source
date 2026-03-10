import Link from "next/link";
import Badge from "@/components/ui/badge";
import SectionCard from "@/components/ui/section-card";

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
  const safeName = project.name?.trim() || "Proyecto sin nombre";
  const safeDescription =
    project.short_description?.trim() || "Sin descripción corta disponible.";
  const techStack = project.tech_stack?.filter((tech) => tech.trim().length > 0) || [];
  const safeSlug = project.slug?.trim();

  return (
    <SectionCard className="h-full p-5">
      <h2 className="text-xl font-semibold text-white">{safeName}</h2>

      <p className="mt-2 text-sm text-gray-300">{safeDescription}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {techStack.length > 0 ? (
          techStack.map((tech) => (
            <Badge key={`${project.id}-${tech}`}>{tech}</Badge>
          ))
        ) : (
          <span className="text-xs text-gray-500">Tech stack no especificado.</span>
        )}
      </div>

      {safeSlug ? (
        <Link
          href={`/projects/${encodeURIComponent(safeSlug)}`}
          className="mt-5 inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
        >
          Ver proyecto
        </Link>
      ) : (
        <p className="mt-5 text-sm text-gray-500">Proyecto sin slug disponible.</p>
      )}
    </SectionCard>
  );
}
