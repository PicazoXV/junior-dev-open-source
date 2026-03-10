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
  labels: string[];
  projectName: string;
  projectSlug: string | null;
  score: number;
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

export async function getRecommendedTasksForUser(
  supabase: MinimalSupabaseClient,
  userId: string,
  limit = 6
): Promise<RecommendedTask[]> {
  const [{ data: profile }, progress] = await Promise.all([
    supabase.from("profiles").select("tech_stack").eq("id", userId).maybeSingle(),
    getUserProgress(supabase, userId),
  ]);

  const userTerms = normalizeTerms(profile?.tech_stack || null);

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, title, description, difficulty, labels, project_id")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(60);

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

    if (matchesDifficulty(task.difficulty, progress.level)) {
      score += 3;
    }

    const matchedTerms = userTerms.filter((term) => haystack.includes(term));
    score += matchedTerms.length * 2;

    if (labels.includes("good first issue") || labels.includes("good-first-issue")) {
      score += progress.level === "beginner" || progress.level === "junior" ? 4 : 1;
    }

    return {
      task,
      score,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ task, score }) => {
      const project = projectMap.get(task.project_id);
      return {
        id: task.id,
        title: task.title || "Tarea sin título",
        description: task.description,
        difficulty: task.difficulty,
        labels: task.labels || [],
        projectName: project?.name || "Proyecto",
        projectSlug: project?.slug || null,
        score,
      };
    });
}

