import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  CircleHelp,
  Compass,
  FileSearch,
  GitPullRequest,
  Rocket,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import PublicLayout from "@/components/layout/public-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import Badge from "@/components/ui/badge";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import StatusBadge from "@/components/ui/status-badge";
import EmptyState from "@/components/ui/empty-state";
import Button from "@/components/ui/button";
import { FilterField, FiltersForm, FilterSelect } from "@/components/ui/filters";
import { getCurrentLocale } from "@/lib/i18n/server";
import FavoriteToggle from "@/components/favorites/favorite-toggle";
import { getFavoriteIdsByType } from "@/lib/favorites";
import { getSiteUrl } from "@/lib/site-url";
import GitHubLoginButton from "@/components/github-login-button";

export const metadata: Metadata = {
  title: "Buena Primera Issue | MiPrimerIssue",
  description:
    "Encuentra tareas pensadas para empezar en open source y aprende cómo hacer tu primera contribución paso a paso en MiPrimerIssue.",
  alternates: {
    canonical: `${getSiteUrl()}/buena-primera-issue`,
  },
};

type BuenaPrimeraIssuePageProps = {
  searchParams: Promise<{
    tech?: string;
    track?: string;
    difficulty?: string;
    estimate?: string;
    status?: string;
    favorites?: string;
    page?: string;
  }>;
};

type TaskRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  estimated_minutes: number | null;
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

type TaskWithoutEstimateRow = Omit<TaskRow, "estimated_minutes">;

type NormalizedTaskRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  estimated_minutes: number | null;
  labels: string[] | null;
  project: {
    name: string | null;
    slug: string | null;
    tech_stack: string[] | null;
  } | null;
};

type TaskIdRow = {
  id: string;
};

type ProjectIdRow = {
  id: string;
};

type TechStackRow = {
  tech_stack: string[] | null;
};

const TASKS_PER_PAGE = 12;
const GOOD_FIRST_LABELS = ["good-first-issue", "good first issue", "first issue"];
const DISCOVERY_STATUS_VALUES = ["open", "assigned", "in_review"] as const;

const TRACK_LABELS: Record<string, string[]> = {
  frontend: ["frontend", "ui", "react", "css", "tailwind"],
  backend: ["backend", "api", "server", "database"],
  docs: ["docs", "documentation", "readme"],
  testing: ["testing", "test", "qa", "e2e", "unit-test"],
};

function toTaskRows(data: unknown): TaskRow[] {
  return Array.isArray(data) ? (data as TaskRow[]) : [];
}

function toTaskWithoutEstimateRows(data: unknown): TaskWithoutEstimateRow[] {
  return Array.isArray(data) ? (data as TaskWithoutEstimateRow[]) : [];
}

function isMissingEstimatedColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return (
    code === "42703" ||
    message.includes("estimated_minutes") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

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

function getEstimatedTime(task: NormalizedTaskRow) {
  if (task.estimated_minutes) {
    return `${task.estimated_minutes} min`;
  }

  if (hasAnyLabel(task.labels, GOOD_FIRST_LABELS)) {
    return "30-90 min";
  }

  if (task.difficulty === "beginner") {
    return "1-3h";
  }

  if (task.difficulty === "intermediate") {
    return "3-6h";
  }

  return "6+h";
}

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildBuenaPrimeraIssueHref(
  filters: {
    tech: string;
    track: string;
    difficulty: string;
    estimate: string;
    status: string;
    favorites: string;
  },
  page: number
) {
  const params = new URLSearchParams();

  if (filters.tech) params.set("tech", filters.tech);
  if (filters.track) params.set("track", filters.track);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.estimate) params.set("estimate", filters.estimate);
  if (filters.status && filters.status !== "open") params.set("status", filters.status);
  if (filters.favorites === "1") params.set("favorites", "1");
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/buena-primera-issue?${query}` : "/buena-primera-issue";
}

function getStatusFilterValues(statusFilter: "open" | "assigned" | "in_review" | "all") {
  if (statusFilter === "all") {
    return [...DISCOVERY_STATUS_VALUES] as string[];
  }

  return [statusFilter] as string[];
}

export default async function BuenaPrimeraIssuePage({ searchParams }: BuenaPrimeraIssuePageProps) {
  const locale = await getCurrentLocale();
  const isEn = locale === "en";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedParams = await searchParams;
  const tech = (resolvedParams.tech || "").trim();
  const track = Object.keys(TRACK_LABELS).includes(resolvedParams.track || "")
    ? (resolvedParams.track as keyof typeof TRACK_LABELS)
    : "";
  const difficulty = ["very-easy", "beginner", "junior"].includes(resolvedParams.difficulty || "")
    ? (resolvedParams.difficulty as "very-easy" | "beginner" | "junior")
    : "";
  const estimate = ["short", "medium", "long"].includes(resolvedParams.estimate || "")
    ? (resolvedParams.estimate as "short" | "medium" | "long")
    : "";
  const status = ["open", "assigned", "in_review", "all"].includes(resolvedParams.status || "")
    ? (resolvedParams.status as "open" | "assigned" | "in_review" | "all")
    : "open";
  const favorites = user && resolvedParams.favorites === "1" ? "1" : "";

  const statusFilterValues = getStatusFilterValues(status);

  const requestedPage = parsePage(resolvedParams.page);
  let currentPage = requestedPage;

  const favoriteTaskIds = await getFavoriteIdsByType({
    supabase,
    userId: user?.id || null,
    itemType: "task",
  });

  const getIdsFromResult = (rows: TaskIdRow[] | null) =>
    new Set((rows || []).map((row) => row.id).filter((id) => typeof id === "string" && id.length > 0));

  let goodFirstTaskIds = new Set<string>();

  if (difficulty === "beginner") {
    const { data, error } = await supabase
      .from("tasks")
      .select("id")
      .in("status", statusFilterValues)
      .eq("difficulty", "beginner");

    if (error) {
      console.error("Error cargando tareas beginner:", error.message);
    } else {
      goodFirstTaskIds = getIdsFromResult(data as TaskIdRow[]);
    }
  } else if (difficulty === "very-easy") {
    const { data, error } = await supabase
      .from("tasks")
      .select("id")
      .in("status", statusFilterValues)
      .overlaps("labels", GOOD_FIRST_LABELS);

    if (error) {
      console.error("Error cargando tareas good first issue:", error.message);
    } else {
      goodFirstTaskIds = getIdsFromResult(data as TaskIdRow[]);
    }
  } else {
    const [beginnerResult, labeledResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id")
        .in("status", statusFilterValues)
        .eq("difficulty", "beginner"),
      supabase
        .from("tasks")
        .select("id")
        .in("status", statusFilterValues)
        .overlaps("labels", GOOD_FIRST_LABELS),
    ]);

    if (beginnerResult.error) {
      console.error("Error cargando tareas beginner:", beginnerResult.error.message);
    }

    if (labeledResult.error) {
      console.error("Error cargando tareas con etiqueta good first issue:", labeledResult.error.message);
    }

    const beginnerIds = getIdsFromResult((beginnerResult.data || []) as TaskIdRow[]);
    const labeledIds = getIdsFromResult((labeledResult.data || []) as TaskIdRow[]);
    goodFirstTaskIds = new Set([...beginnerIds, ...labeledIds]);
  }

  if (favorites === "1") {
    const filteredByFavorites = new Set<string>();
    goodFirstTaskIds.forEach((taskId) => {
      if (favoriteTaskIds.has(taskId)) {
        filteredByFavorites.add(taskId);
      }
    });
    goodFirstTaskIds = filteredByFavorites;
  }

  let techProjectIds: string[] | null = null;
  if (tech) {
    const { data: projectsByTech, error: projectsByTechError } = await supabase
      .from("projects")
      .select("id")
      .contains("tech_stack", [tech]);

    if (projectsByTechError) {
      console.error("Error cargando proyectos por tecnología:", projectsByTechError.message);
      techProjectIds = [];
    } else {
      techProjectIds = ((projectsByTech || []) as ProjectIdRow[])
        .map((project) => project.id)
        .filter((id) => typeof id === "string" && id.length > 0);
    }
  }

  let forceEmpty = false;

  if (goodFirstTaskIds.size === 0) {
    forceEmpty = true;
  }

  if (techProjectIds && techProjectIds.length === 0) {
    forceEmpty = true;
  }

  const goodFirstTaskIdsArray = [...goodFirstTaskIds];

  const buildTasksQuery = (withEstimate: boolean) => {
    let query = supabase
      .from("tasks")
      .select(
        withEstimate
          ? "id, title, description, status, difficulty, estimated_minutes, labels, project:projects(name, slug, tech_stack)"
          : "id, title, description, status, difficulty, labels, project:projects(name, slug, tech_stack)",
        { count: "exact" }
      )
      .in("id", goodFirstTaskIdsArray)
      .in("status", statusFilterValues)
      .order("created_at", { ascending: false });

    if (track) {
      query = query.overlaps("labels", TRACK_LABELS[track]);
    }

    if (techProjectIds) {
      query = query.in("project_id", techProjectIds);
    }

    if (withEstimate) {
      if (estimate === "short") {
        query = query.lte("estimated_minutes", 30);
      } else if (estimate === "medium") {
        query = query.gt("estimated_minutes", 30).lte("estimated_minutes", 90);
      } else if (estimate === "long") {
        query = query.gt("estimated_minutes", 90);
      }
    }

    return query;
  };

  let tasks: NormalizedTaskRow[] = [];
  let totalTasks = 0;

  if (!forceEmpty) {
    const start = (currentPage - 1) * TASKS_PER_PAGE;
    const end = start + TASKS_PER_PAGE - 1;

    const withEstimateResult = await buildTasksQuery(true).range(start, end);
    let taskQueryError = withEstimateResult.error;
    let taskQueryCount = withEstimateResult.count || 0;
    let taskQueryRows = toTaskRows(withEstimateResult.data);

    if (taskQueryError && isMissingEstimatedColumnError(taskQueryError)) {
      if (estimate) {
        taskQueryError = null;
        taskQueryCount = 0;
        taskQueryRows = [];
      } else {
        const fallbackResult = await buildTasksQuery(false).range(start, end);
        taskQueryError = fallbackResult.error;
        taskQueryCount = fallbackResult.count || 0;
        taskQueryRows = toTaskWithoutEstimateRows(fallbackResult.data).map((task) => ({
          ...task,
          estimated_minutes: null,
        }));
      }
    }

    if (taskQueryError) {
      console.error("Error cargando Buena Primera Issue:", taskQueryError.message);
    }

    totalTasks = taskQueryCount;
    const totalPages = Math.max(1, Math.ceil(totalTasks / TASKS_PER_PAGE));

    if (totalTasks > 0 && currentPage > totalPages) {
      currentPage = totalPages;
      const correctedStart = (currentPage - 1) * TASKS_PER_PAGE;
      const correctedEnd = correctedStart + TASKS_PER_PAGE - 1;

      const correctedResult = await buildTasksQuery(true).range(correctedStart, correctedEnd);
      let correctedError = correctedResult.error;
      let correctedCount = correctedResult.count || totalTasks;
      let correctedRows = toTaskRows(correctedResult.data);

      if (correctedError && isMissingEstimatedColumnError(correctedError)) {
        if (estimate) {
          correctedError = null;
          correctedCount = 0;
          correctedRows = [];
        } else {
          const fallbackResult = await buildTasksQuery(false).range(correctedStart, correctedEnd);
          correctedError = fallbackResult.error;
          correctedCount = fallbackResult.count || totalTasks;
          correctedRows = toTaskWithoutEstimateRows(fallbackResult.data).map((task) => ({
            ...task,
            estimated_minutes: null,
          }));
        }
      }

      if (correctedError) {
        console.error("Error recargando Buena Primera Issue paginada:", correctedError.message);
      } else {
        taskQueryError = correctedError;
        taskQueryRows = correctedRows;
      }

      totalTasks = correctedCount;
    }

    tasks = taskQueryRows
      .map((task) => ({ ...task, project: normalizeProject(task.project) }))
      .filter((task): task is NormalizedTaskRow => !!task.project);
  }

  const { data: techRows } = await supabase.from("projects").select("tech_stack");

  const availableTech = [
    ...new Set(((techRows || []) as TechStackRow[]).flatMap((project) => project.tech_stack || [])),
  ].sort();

  const totalPages = Math.max(1, Math.ceil(totalTasks / TASKS_PER_PAGE));

  const filterState = {
    tech,
    track,
    difficulty,
    estimate,
    status,
    favorites,
  };

  const showingFrom = totalTasks === 0 ? 0 : (currentPage - 1) * TASKS_PER_PAGE + 1;
  const showingTo = totalTasks === 0 ? 0 : Math.min(currentPage * TASKS_PER_PAGE, totalTasks);

  const processSteps = [
    {
      icon: Compass,
      title: isEn ? "Step 1 - Find a suitable task" : "Paso 1 - Encuentra una tarea adecuada",
      description: isEn
        ? "Explore beginner-friendly tasks that match your current level."
        : "Explora tareas beginner-friendly que encajen con tu nivel actual.",
    },
    {
      icon: FileSearch,
      title: isEn ? "Step 2 - Read the task carefully" : "Paso 2 - Lee bien la tarea",
      description: isEn
        ? "Review context, difficulty, estimated time, and available resources."
        : "Revisa contexto, dificultad, tiempo estimado y recursos disponibles.",
    },
    {
      icon: Send,
      title: isEn ? "Step 3 - Request the task" : "Paso 3 - Solicita trabajar en ella",
      description: isEn
        ? "Send your request so the maintainer can review your interest."
        : "Envía tu solicitud para que el maintainer revise tu interés.",
    },
    {
      icon: GitPullRequest,
      title: isEn
        ? "Step 4 - Work on GitHub"
        : "Paso 4 - Si te asignan la tarea, empieza en GitHub",
      description: isEn
        ? "If approved, start in the repository and open your Pull Request."
        : "Si te aprueban, empieza en el repositorio y abre tu Pull Request.",
    },
    {
      icon: BadgeCheck,
      title: isEn
        ? "Step 5 - Complete your first contribution"
        : "Paso 5 - Completa tu primera contribución",
      description: isEn
        ? "When your PR is merged, your progress grows inside MiPrimerIssue."
        : "Cuando tu PR se mergea, tu progreso crece dentro de MiPrimerIssue.",
    },
  ];

  const tips = [
    {
      icon: Sparkles,
      title: isEn ? "You don't need to be an expert" : "No hace falta ser experto",
      description: isEn
        ? "Start with beginner tasks. The goal is to learn by contributing, not to know everything beforehand."
        : "Empieza por tareas beginner. El objetivo es aprender contribuyendo, no saberlo todo desde el inicio.",
    },
    {
      icon: TriangleAlert,
      title: isEn ? "Read before requesting" : "Lee bien antes de solicitar",
      description: isEn
        ? "Check the task details and expected outcome before sending your request."
        : "Revisa bien la descripción y el resultado esperado antes de enviar tu solicitud.",
    },
    {
      icon: CircleHelp,
      title: isEn ? "Use available resources" : "Usa los recursos disponibles",
      description: isEn
        ? "If you get stuck, use links, docs, and comments in the issue."
        : "Si te atascas, usa enlaces, docs y comentarios incluidos en la tarea.",
    },
    {
      icon: Rocket,
      title: isEn ? "Focus on progress" : "Enfócate en avanzar",
      description: isEn
        ? "Small contributions count. Your first PR is a milestone, not a final exam."
        : "Las contribuciones pequeñas cuentan. Tu primer PR es un hito, no un examen final.",
    },
  ];

  const resources = [
    {
      title: isEn ? "GitHub Pull Request guide" : "Guía de Pull Request en GitHub",
      href: "https://docs.github.com/en/pull-requests",
      external: true,
    },
    {
      title: isEn ? "How to fork a repository" : "Cómo hacer fork de un repositorio",
      href: "https://docs.github.com/en/get-started/quickstart/fork-a-repo",
      external: true,
    },
    {
      title: isEn ? "First contribution guide" : "Guía rápida de primera contribución",
      href: "/dashboard",
      external: false,
    },
    {
      title: isEn ? "Free certifications to level up" : "Certificaciones gratuitas para mejorar",
      href: "/certificaciones",
      external: false,
    },
  ];

  return (
    <PublicLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="surface-accent relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.2),transparent_48%)]" />
        <div className="relative z-10">
          <PageHeader
            title="Buena Primera Issue"
            description={
              isEn
                ? "Find beginner-friendly tasks and learn how to complete your first open source contribution step by step."
                : "Encuentra tareas pensadas para empezar en open source y aprende cómo hacer tu primera contribución paso a paso."
            }
          />

          <p className="mt-2 max-w-3xl text-sm text-gray-200/90 md:text-base">
            {isEn
              ? "Built for junior developers: you don't need massive prior experience. MiPrimerIssue guides you from your first task to your first merged PR."
              : "Pensada para developers junior: no necesitas una experiencia previa enorme. MiPrimerIssue te guía desde tu primera tarea hasta tu primer PR mergeado."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="info">{isEn ? "Beginner-friendly" : "Beginner-friendly"}</Badge>
            <Badge tone="warning">{isEn ? "Guided process" : "Proceso guiado"}</Badge>
            <Badge tone="success">{isEn ? "Real GitHub contributions" : "Contribuciones reales en GitHub"}</Badge>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="#tareas"
              className="inline-flex min-h-10 items-center rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              {isEn ? "View tasks" : "Ver tareas"}
            </Link>
            <Link
              href="#como-empezar"
              className="inline-flex min-h-10 items-center rounded-lg border border-white/20 bg-neutral-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
            >
              {isEn ? "How to start" : "Cómo empezar"}
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex min-h-10 items-center rounded-lg border border-white/20 bg-neutral-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
              >
                {isEn ? "Go to dashboard" : "Ir al dashboard"}
              </Link>
            ) : (
              <GitHubLoginButton
                label={isEn ? "Sign in with GitHub" : "Entrar con GitHub"}
                className="rounded-lg px-4 py-2 text-sm font-medium"
              />
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard id="como-empezar" className="p-8">
        <PageHeader
          as="h2"
          title={isEn ? "How your first contribution works" : "Cómo funciona tu primera contribución"}
          description={
            isEn
              ? "A clear visual flow so you know exactly what to do next."
              : "Un flujo visual y claro para saber exactamente qué hacer después."
          }
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {processSteps.map((step) => (
            <article key={step.title} className="surface-subcard rounded-xl p-4">
              <step.icon className="h-6 w-6 text-orange-300" />
              <h3 className="mt-3 text-sm font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-300">{step.description}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={isEn ? "Tips to start without fear" : "Ayudas y consejos para empezar"}
          description={
            isEn
              ? "Practical reminders to reduce friction and gain confidence."
              : "Recordatorios prácticos para reducir fricción y ganar confianza desde el inicio."
          }
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {tips.map((tip) => (
            <article key={tip.title} className="surface-subcard rounded-xl p-4">
              <tip.icon className="h-5 w-5 text-orange-300" />
              <h3 className="mt-2 text-sm font-semibold text-white">{tip.title}</h3>
              <p className="mt-1 text-sm text-gray-300">{tip.description}</p>
            </article>
          ))}
        </div>

        <div className="surface-subcard mt-5 rounded-xl p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-gray-500">{isEn ? "Mini FAQ" : "Mini FAQ"}</p>
          <div className="mt-3 grid gap-2 text-sm text-gray-300">
            <p>
              <span className="font-semibold text-white">{isEn ? "Do I need a lot of experience?" : "¿Necesito mucha experiencia?"}</span>{" "}
              {isEn
                ? "No. Start with small tasks and focus on learning by doing."
                : "No. Empieza con tareas pequeñas y enfócate en aprender haciendo."}
            </p>
            <p>
              <span className="font-semibold text-white">{isEn ? "What if I get stuck?" : "¿Qué pasa si me atasco?"}</span>{" "}
              {isEn
                ? "Use task resources and ask clear questions in the issue or PR."
                : "Usa los recursos de la tarea y haz preguntas claras en la issue o en el PR."}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard id="tareas" className="p-8">
        <PageHeader
          as="h2"
          title={isEn ? "Beginner-friendly tasks" : "Listado de tareas beginner-friendly"}
          description={
            isEn
              ? "Explore real tasks adapted to your first contribution journey."
              : "Explora tareas reales adaptadas a tu camino de primera contribución."
          }
        />

        <FiltersForm className="mt-4 md:grid-cols-6">
          <FilterField htmlFor="tech" label={isEn ? "Technology" : "Tecnología"}>
            <FilterSelect
              id="tech"
              name="tech"
              defaultValue={tech}
              options={[
                { value: "", label: isEn ? "All" : "Todas" },
                ...availableTech.map((item) => ({ value: item, label: item })),
              ]}
            />
          </FilterField>

          <FilterField htmlFor="track" label={isEn ? "Task type" : "Tipo de tarea"}>
            <FilterSelect
              id="track"
              name="track"
              defaultValue={track}
              options={[
                { value: "", label: isEn ? "All" : "Todos" },
                { value: "frontend", label: "Frontend" },
                { value: "backend", label: "Backend" },
                { value: "docs", label: "Docs" },
                { value: "testing", label: "Testing" },
              ]}
            />
          </FilterField>

          <FilterField htmlFor="difficulty" label={isEn ? "Difficulty focus" : "Enfoque de dificultad"}>
            <FilterSelect
              id="difficulty"
              name="difficulty"
              defaultValue={difficulty}
              options={[
                { value: "", label: isEn ? "All" : "Todas" },
                { value: "very-easy", label: isEn ? "Very easy" : "Muy fácil" },
                { value: "beginner", label: isEn ? "Beginner" : "Principiante" },
                { value: "junior", label: isEn ? "Junior path" : "Camino junior" },
              ]}
            />
          </FilterField>

          <FilterField htmlFor="estimate" label={isEn ? "Estimated time" : "Tiempo estimado"}>
            <FilterSelect
              id="estimate"
              name="estimate"
              defaultValue={estimate}
              options={[
                { value: "", label: isEn ? "All" : "Todos" },
                { value: "short", label: isEn ? "Up to 30 min" : "Hasta 30 min" },
                { value: "medium", label: isEn ? "30-90 min" : "30-90 min" },
                { value: "long", label: isEn ? "90+ min" : "90+ min" },
              ]}
            />
          </FilterField>

          <FilterField htmlFor="status" label={isEn ? "Status" : "Estado"}>
            <FilterSelect
              id="status"
              name="status"
              defaultValue={status}
              options={[
                { value: "open", label: isEn ? "Open" : "Abiertas" },
                { value: "assigned", label: isEn ? "Assigned" : "Asignadas" },
                { value: "in_review", label: isEn ? "In review" : "En review" },
                { value: "all", label: isEn ? "All active" : "Todas activas" },
              ]}
            />
          </FilterField>

          <div className="flex items-end gap-2">
            {user ? (
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" name="favorites" value="1" defaultChecked={favorites === "1"} />
                {isEn ? "Only favorites" : "Solo favoritos"}
              </label>
            ) : null}
            <Button type="submit" variant="accent">
              {isEn ? "Apply" : "Aplicar"}
            </Button>
          </div>
        </FiltersForm>

        <p className="mt-4 text-xs text-gray-400">
          {isEn
            ? `Showing ${showingFrom}-${showingTo} of ${totalTasks} tasks`
            : `Mostrando ${showingFrom}-${showingTo} de ${totalTasks} tareas`}
        </p>

        {tasks.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={isEn ? "No tasks for these filters" : "No hay tareas para estos filtros"}
              description={
                isEn
                  ? "Try another combination and come back soon, new opportunities are published continuously."
                  : "Prueba otra combinación y vuelve pronto, se publican nuevas oportunidades continuamente."
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className="surface-subcard rounded-2xl p-5"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {task.title || (isEn ? "Untitled task" : "Tarea sin título")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {task.project?.name || (isEn ? "Project" : "Proyecto")}
                  </p>
                  <p className="mt-3 text-sm text-gray-300">
                    {task.description || (isEn ? "No description available." : "Sin descripción disponible.")}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <DifficultyBadge difficulty={task.difficulty} />
                    <StatusBadge status={task.status} />
                    <Badge tone="info">
                      {isEn ? "Estimated" : "Estimado"}: {getEstimatedTime(task)}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(task.project?.tech_stack || []).slice(0, 4).map((taskTech) => (
                      <Badge key={`${task.id}-tech-${taskTech}`} tone="default">
                        {taskTech}
                      </Badge>
                    ))}
                    {(task.labels || []).slice(0, 4).map((label) => (
                      <Badge key={`${task.id}-label-${label}`}>{label}</Badge>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {user ? (
                      <FavoriteToggle
                        itemType="task"
                        itemId={task.id}
                        initiallyFavorite={favoriteTaskIds.has(task.id)}
                      />
                    ) : null}

                    <Link
                      href={`/tasks/${task.id}`}
                      className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
                    >
                      {isEn ? "View task" : "Ver tarea"}
                    </Link>

                    {task.project?.slug ? (
                      <Link
                        href={`/projects/${task.project.slug}`}
                        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                      >
                        {isEn ? "View project" : "Ver proyecto"}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Link
                  href={buildBuenaPrimeraIssueHref(filterState, Math.max(1, currentPage - 1))}
                  aria-disabled={currentPage <= 1}
                  className={`inline-flex rounded-lg border px-3 py-2 text-sm transition ${
                    currentPage <= 1
                      ? "pointer-events-none border-white/10 text-gray-600"
                      : "border-white/20 bg-neutral-900 text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  }`}
                >
                  {isEn ? "Previous" : "Anterior"}
                </Link>

                <p className="text-sm text-gray-400">
                  {isEn
                    ? `Page ${currentPage} of ${totalPages}`
                    : `Página ${currentPage} de ${totalPages}`}
                </p>

                <Link
                  href={buildBuenaPrimeraIssueHref(filterState, Math.min(totalPages, currentPage + 1))}
                  aria-disabled={currentPage >= totalPages}
                  className={`inline-flex rounded-lg border px-3 py-2 text-sm transition ${
                    currentPage >= totalPages
                      ? "pointer-events-none border-white/10 text-gray-600"
                      : "border-white/20 bg-neutral-900 text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  }`}
                >
                  {isEn ? "Next" : "Siguiente"}
                </Link>
              </div>
            ) : null}
          </>
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          as="h2"
          title={isEn ? "Useful resources" : "Recursos útiles"}
          description={
            isEn
              ? "Short links to unblock your first contribution quickly."
              : "Enlaces cortos para desbloquear tu primera contribución rápidamente."
          }
        />

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {resources.map((resource) => (
            <Link
              key={resource.title}
              href={resource.href}
              target={resource.external ? "_blank" : undefined}
              rel={resource.external ? "noreferrer" : undefined}
              className="surface-subcard flex items-center gap-3 rounded-xl p-4 transition hover:border-orange-500/35"
            >
              <BookOpen className="h-5 w-5 text-orange-300" />
              <span className="text-sm text-gray-200">{resource.title}</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="surface-accent p-8 text-center md:p-10">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {isEn
            ? "Start your first open source contribution today"
            : "Empieza hoy tu primera contribución open source"}
        </h2>
        <p className="mx-auto mt-2 max-w-3xl text-sm text-gray-200/90">
          {isEn
            ? "Pick a beginner-friendly task, request it, and build demonstrable experience in MiPrimerIssue."
            : "Elige una tarea beginner-friendly, solicítala y construye experiencia demostrable en MiPrimerIssue."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {user ? (
            <>
              <Link
                href="#tareas"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {isEn ? "View more tasks" : "Ver más tareas"}
              </Link>
              <Link
                href="/dashboard?editProfile=1"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
              >
                {isEn ? "Complete my profile" : "Completar mi perfil"}
              </Link>
            </>
          ) : (
            <GitHubLoginButton
              label={isEn ? "Sign in with GitHub" : "Entrar con GitHub"}
              className="rounded-lg px-4 py-2 text-sm font-medium"
            />
          )}
        </div>
      </SectionCard>
    </PublicLayout>
  );
}
