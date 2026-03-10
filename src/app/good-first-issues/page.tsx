import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import Badge from "@/components/ui/badge";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import EmptyState from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Good First Issues | PrimerIssue",
  description:
    "Encuentra tareas beginner-friendly para hacer tu primera contribución open source con PrimerIssue.",
};

type GoodFirstIssuesPageProps = {
  searchParams: Promise<{
    tech?: string;
    track?: string;
    difficulty?: string;
  }>;
};

type TaskRow = {
  id: string;
  title: string | null;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  labels: string[] | null;
  project:
    | {
        name: string | null;
        slug: string | null;
        tech_stack: string[] | null;
      }
    | {
        name: string | null;
        slug: string | null;
        tech_stack: string[] | null;
      }[]
    | null;
};

type NormalizedTaskRow = {
  id: string;
  title: string | null;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  labels: string[] | null;
  project: {
    name: string | null;
    slug: string | null;
    tech_stack: string[] | null;
  } | null;
};

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function hasAnyLabel(labels: string[] | null | undefined, candidates: string[]) {
  if (!labels || labels.length === 0) {
    return false;
  }

  const normalized = new Set(labels.map((label) => normalizeLabel(label)));
  return candidates.some((candidate) => normalized.has(normalizeLabel(candidate)));
}

function normalizeProject(project: TaskRow["project"]) {
  if (!project) {
    return null;
  }

  if (Array.isArray(project)) {
    return project[0] || null;
  }

  return project;
}

function isGoodFirstTask(task: NormalizedTaskRow) {
  return (
    task.difficulty === "beginner" ||
    hasAnyLabel(task.labels, ["good-first-issue", "good first issue", "first issue"])
  );
}

function getEstimatedTime(task: NormalizedTaskRow) {
  if (hasAnyLabel(task.labels, ["good-first-issue", "good first issue", "first issue"])) {
    return "30-90 min";
  }

  if (task.difficulty === "beginner") {
    return "1-3 horas";
  }

  if (task.difficulty === "intermediate") {
    return "3-6 horas";
  }

  return "6+ horas";
}

function matchesTrack(task: NormalizedTaskRow, track: string) {
  if (!track) {
    return true;
  }

  if (track === "frontend") {
    return hasAnyLabel(task.labels, ["frontend", "ui", "react", "css", "tailwind"]);
  }

  if (track === "backend") {
    return hasAnyLabel(task.labels, ["backend", "api", "server", "database"]);
  }

  if (track === "docs") {
    return hasAnyLabel(task.labels, ["docs", "documentation", "readme"]);
  }

  if (track === "testing") {
    return hasAnyLabel(task.labels, ["testing", "test", "qa", "e2e", "unit-test"]);
  }

  return true;
}

function matchesDifficulty(task: NormalizedTaskRow, difficultyFilter: string) {
  if (!difficultyFilter) {
    return true;
  }

  if (difficultyFilter === "very-easy") {
    return hasAnyLabel(task.labels, ["good-first-issue", "good first issue", "first issue"]);
  }

  if (difficultyFilter === "beginner") {
    return task.difficulty === "beginner";
  }

  if (difficultyFilter === "junior") {
    return task.difficulty === "intermediate" || task.difficulty === "beginner";
  }

  return true;
}

function matchesTechnology(task: NormalizedTaskRow, technologyFilter: string) {
  if (!technologyFilter) {
    return true;
  }

  const techStack = (task.project?.tech_stack || []).map((tech) => tech.toLowerCase());
  return techStack.includes(technologyFilter.toLowerCase());
}

export default async function GoodFirstIssuesPage({ searchParams }: GoodFirstIssuesPageProps) {
  const { tech = "", track = "", difficulty = "" } = await searchParams;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, difficulty, labels, project:projects(name, slug, tech_stack)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando Good First Issues:", error.message);
  }

  const tasks = ((data || []) as TaskRow[])
    .map((task) => ({ ...task, project: normalizeProject(task.project) }))
    .filter((task): task is NormalizedTaskRow => !!task.project && isGoodFirstTask(task));

  const filteredTasks = tasks.filter(
    (task) =>
      matchesTechnology(task, tech) &&
      matchesTrack(task, track) &&
      matchesDifficulty(task, difficulty)
  );

  const availableTech = [...new Set(tasks.flatMap((task) => task.project?.tech_stack || []))].sort();

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title="Good First Issues"
          description="Start contributing to open source today. Encuentra tareas curadas para developers que comienzan su journey."
        />

        <p className="max-w-3xl text-sm text-gray-300">
          Solo mostramos tareas aptas para empezar: dificultad beginner o etiquetas tipo good first issue.
          Explora, filtra y da tu primer paso en open source con experiencia demostrable.
        </p>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader title="Filtros" description="Ajusta tecnología, track y dificultad recomendada." />

        <form className="grid gap-3 md:grid-cols-4">
          <div>
            <label htmlFor="tech" className="mb-1 block text-xs text-gray-400">
              Technology
            </label>
            <select
              id="tech"
              name="tech"
              defaultValue={tech}
              className="w-full rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              <option value="">Todas</option>
              {availableTech.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="track" className="mb-1 block text-xs text-gray-400">
              Track
            </label>
            <select
              id="track"
              name="track"
              defaultValue={track}
              className="w-full rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              <option value="">Todos</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="docs">Docs</option>
              <option value="testing">Testing</option>
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" className="mb-1 block text-xs text-gray-400">
              Difficulty
            </label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue={difficulty}
              className="w-full rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            >
              <option value="">Todas</option>
              <option value="very-easy">Very easy</option>
              <option value="beginner">Beginner</option>
              <option value="junior">Junior</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Tareas beginner-friendly"
          description="Selecciona una tarea y empieza hoy tu primera contribución open source real."
        />

        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No hay tareas para estos filtros"
            description="Prueba otra combinación o vuelve pronto. Se publican nuevas oportunidades cada semana."
            action={
              <Link
                href="/projects"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
              >
                Ver todos los proyectos
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTasks.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border border-white/20 bg-black/20 p-5"
              >
                <h2 className="text-lg font-semibold text-white">{task.title || "Tarea sin título"}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {task.project?.name || "Proyecto"}
                </p>
                <p className="mt-3 text-sm text-gray-300">
                  {task.description || "Sin descripción disponible."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <DifficultyBadge difficulty={task.difficulty} />
                  <Badge tone="info">Estimated time: {getEstimatedTime(task)}</Badge>
                  {(task.labels || []).slice(0, 4).map((label) => (
                    <Badge key={`${task.id}-${label}`}>{label}</Badge>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(task.project?.tech_stack || []).slice(0, 4).map((tech) => (
                    <Badge key={`${task.id}-tech-${tech}`} tone="default">
                      {tech}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
                  >
                    View task
                  </Link>
                  {task.project?.slug ? (
                    <Link
                      href={`/projects/${task.project.slug}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                    >
                      Ver proyecto
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}
