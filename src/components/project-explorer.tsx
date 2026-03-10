"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileCode2 } from "lucide-react";
import SectionCard from "@/components/ui/section-card";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import StatusBadge from "@/components/ui/status-badge";
import Badge from "@/components/ui/badge";

type ExplorerTask = {
  id: string;
  title: string | null;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  labels: string[] | null;
  github_issue_url: string | null;
  project_id: string;
};

type ExplorerProject = {
  id: string;
  slug: string | null;
  name: string | null;
  short_description: string | null;
  tasks: ExplorerTask[];
};

type ProjectExplorerProps = {
  projects: ExplorerProject[];
};

function getPreview(text: string | null, maxLength = 120) {
  if (!text) return "Sin descripción disponible.";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export default function ProjectExplorer({ projects }: ProjectExplorerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [panelVisible, setPanelVisible] = useState<boolean>(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const openTasksPanel = (projectId: string) => {
    setSelectedProjectId(projectId);
    setPanelVisible(true);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <SectionCard className="p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Proyectos activos</h2>
        <div className="space-y-3">
          {projects.map((project) => {
            const safeName = project.name?.trim() || "Proyecto sin nombre";
            const safeDescription =
              project.short_description?.trim() || "Sin resumen disponible.";
            const safeSlug = project.slug?.trim();

            return (
              <article
                key={project.id}
                className="rounded-xl border border-white/15 bg-black/20 p-4 transition hover:border-orange-500/35 hover:bg-orange-500/5"
              >
                <h3 className="text-base font-semibold text-white">{safeName}</h3>
                <p className="mt-1 text-sm text-gray-300">{safeDescription}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {safeSlug ? (
                    <Link
                      href={`/projects/${encodeURIComponent(safeSlug)}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                    >
                      Ver proyecto
                    </Link>
                  ) : (
                    <span className="inline-flex rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-gray-500">
                      Sin slug
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => openTasksPanel(project.id)}
                    className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                  >
                    Ver tareas
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        className={`font-mono transition duration-300 ${panelVisible ? "opacity-100" : "opacity-90"}`}
      >
        <div className="mb-4 flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-orange-300" />
          <h2 className="text-sm uppercase tracking-[0.16em] text-gray-400">
            Explorador de tareas
          </h2>
        </div>

        {!selectedProject ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-sm text-gray-400">
            Selecciona un proyecto para explorar sus tareas.
          </p>
        ) : selectedProject.tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-sm text-gray-400">
            Este proyecto todavía no tiene tareas publicadas.
          </p>
        ) : (
          <div className="space-y-3">
            {selectedProject.tasks.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-white/15 bg-black/20 p-4 transition hover:border-orange-500/35 hover:bg-orange-500/5"
              >
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-sm font-semibold text-white transition hover:text-orange-300"
                >
                  {">"} {task.title || "Tarea sin título"}
                </Link>

                <div className="mt-3 flex flex-wrap gap-2">
                  <DifficultyBadge difficulty={task.difficulty} />
                  <StatusBadge status={task.status} />
                  {(task.labels || []).slice(0, 2).map((label) => (
                    <Badge key={`${task.id}-${label}`}>{label}</Badge>
                  ))}
                </div>

                <p className="mt-3 text-xs text-gray-300">{getPreview(task.description)}</p>

                {task.github_issue_url ? (
                  <Link
                    href={task.github_issue_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-300 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                  >
                    Ver issue en GitHub
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
