import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserProgress } from "@/lib/user-progress";

type MinimalSupabaseClient = SupabaseClient;

type TaskRow = {
  id: string;
  title: string | null;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  labels: string[] | null;
  project_id: string;
  estimated_minutes?: number | null;
};

type ProjectRow = {
  id: string;
  name: string | null;
  slug: string | null;
};

export type RecommendedTask = {
  id: string;
  title: string;
  description: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  estimatedMinutes: number | null;
  labels: string[];
  projectName: string;
  projectSlug: string | null;
  score: number;
  reasons: string[];
};

function normalizeTerms(input: string | null | undefined) {
  if (!input) {
    return [];
  }

  return input
    .toLowerCase()
    .split(/[,/\s]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function matchesDifficulty(
  difficulty: "beginner" | "intermediate" | "advanced" | null,
  level: "beginner" | "junior" | "contributor" | "maintainer"
) {
  if (!difficulty) {
    return true;
  }

  if (level === "beginner") {
    return difficulty === "beginner";
  }

  if (level === "junior") {
    return difficulty === "beginner" || difficulty === "intermediate";
  }

  if (level === "contributor") {
    return difficulty === "intermediate" || difficulty === "advanced";
  }

  return true;
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

export async function getRecommendedTasksForUser(
  supabase: MinimalSupabaseClient,
  userId: string,
  limit = 6,
  locale: "es" | "en" = "es"
): Promise<RecommendedTask[]> {
  const [{ data: profile }, progress, completedTasksResult] = await Promise.all([
    supabase.from("profiles").select("tech_stack").eq("id", userId).maybeSingle(),
    getUserProgress(supabase, userId),
    supabase
      .from("tasks")
      .select("labels")
      .eq("assigned_to", userId)
      .eq("status", "completed")
      .limit(80),
  ]);

  const userTerms = normalizeTerms(profile?.tech_stack || null);
  const historicalLabels = new Set(
    (completedTasksResult.data || []).flatMap((task) =>
      (task.labels || []).map((label) => label.toLowerCase())
    )
  );

  const withEstimate = await supabase
    .from("tasks")
    .select("id, title, description, difficulty, labels, project_id, estimated_minutes")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(60);

  let tasks = withEstimate.data;
  let tasksError = withEstimate.error;

  if (tasksError && isMissingEstimatedColumnError(tasksError)) {
    const fallback = await supabase
      .from("tasks")
      .select("id, title, description, difficulty, labels, project_id")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(60);
    tasks = (fallback.data || []).map((task) => ({ ...task, estimated_minutes: null }));
    tasksError = fallback.error;
  }

  if (tasksError) {
    console.error("Error cargando recomendaciones:", tasksError.message);
    return [];
  }

  const taskRows = (tasks || []) as TaskRow[];
  if (taskRows.length === 0) {
    return [];
  }

  const projectIds = [...new Set(taskRows.map((task) => task.project_id))];
  const { data: projects } =
    projectIds.length > 0
      ? await supabase.from("projects").select("id, name, slug").in("id", projectIds)
      : { data: [] };

  const projectMap = new Map(((projects || []) as ProjectRow[]).map((project) => [project.id, project]));

  const scored = taskRows.map((task) => {
    const labels = (task.labels || []).map((label) => label.toLowerCase());
    const haystack = `${task.title || ""} ${task.description || ""} ${labels.join(" ")}`.toLowerCase();

    let score = 0;
    const reasons: string[] = [];

    if (matchesDifficulty(task.difficulty, progress.level)) {
      score += 3;
      reasons.push(
        locale === "en" ? "Good match for your level" : "Buena para tu nivel"
      );
    }

    const matchedTerms = userTerms.filter((term) => haystack.includes(term));
    score += matchedTerms.length * 2;
    if (matchedTerms.length > 0) {
      reasons.push(
        locale === "en"
          ? `Matches your stack: ${matchedTerms.slice(0, 2).join(", ")}`
          : `Coincide con tu stack: ${matchedTerms.slice(0, 2).join(", ")}`
      );
    }

    if (labels.includes("good first issue") || labels.includes("good-first-issue")) {
      score += progress.level === "beginner" || progress.level === "junior" ? 4 : 1;
      reasons.push(
        locale === "en" ? "Good first issue candidate" : "Buena como first issue"
      );
    }

    const overlappingLabels = labels.filter((label) => historicalLabels.has(label));
    if (overlappingLabels.length > 0) {
      score += overlappingLabels.length * 2;
      reasons.push(
        locale === "en"
          ? `Similar to tasks you completed`
          : "Parecida a tareas que ya completaste"
      );
    }

    return {
      task,
      score,
      reasons,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ task, score, reasons }) => {
      const project = projectMap.get(task.project_id);
      return {
        id: task.id,
        title:
          task.title ||
          (locale === "en" ? "Untitled task" : "Tarea sin título"),
        description: task.description,
        difficulty: task.difficulty,
        estimatedMinutes: task.estimated_minutes || null,
        labels: task.labels || [],
        projectName:
          project?.name || (locale === "en" ? "Project" : "Proyecto"),
        projectSlug: project?.slug || null,
        score,
        reasons: reasons.slice(0, 2),
      };
    });
}
