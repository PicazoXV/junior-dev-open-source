import type { SupabaseClient } from "@supabase/supabase-js";

export type UserLevel = "beginner" | "junior" | "contributor" | "maintainer";

export type UserProgressMetrics = {
  completedTasks: number;
  inProgressTasks: number;
  contributedProjects: number;
  requestsSent: number;
  techStack: string | null;
  level: UserLevel;
};

type MinimalSupabaseClient = SupabaseClient;

export function calculateUserLevel(metrics: Omit<UserProgressMetrics, "level">): UserLevel {
  if (metrics.completedTasks >= 10 && metrics.contributedProjects >= 5) {
    return "maintainer";
  }

  if (metrics.completedTasks >= 5 || metrics.contributedProjects >= 3) {
    return "contributor";
  }

  if (metrics.completedTasks >= 2 || metrics.requestsSent >= 3) {
    return "junior";
  }

  return "beginner";
}

export async function getUserProgress(
  supabase: MinimalSupabaseClient,
  userId: string,
  techStackFromProfile?: string | null
): Promise<UserProgressMetrics> {
  const [completedTasksResult, inProgressTasksResult, contributionTasksResult, requestsResult] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("status", "completed"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .in("status", ["assigned", "in_review"]),
      supabase
        .from("tasks")
        .select("project_id")
        .eq("assigned_to", userId)
        .in("status", ["assigned", "in_review", "completed", "closed"]),
      supabase
        .from("task_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

  if (completedTasksResult.error) {
    console.error("Error cargando métricas (completed tasks):", completedTasksResult.error.message);
  }

  if (inProgressTasksResult.error) {
    console.error("Error cargando métricas (in progress tasks):", inProgressTasksResult.error.message);
  }

  if (contributionTasksResult.error) {
    console.error("Error cargando métricas (contributed projects):", contributionTasksResult.error.message);
  }

  if (requestsResult.error) {
    console.error("Error cargando métricas (requests sent):", requestsResult.error.message);
  }

  const contributedProjectIds = new Set(
    (contributionTasksResult.data || [])
      .map((task) => task.project_id)
      .filter((projectId): projectId is string => typeof projectId === "string")
  );

  const techStack =
    typeof techStackFromProfile === "undefined" ? null : techStackFromProfile;

  const metricsWithoutLevel = {
    completedTasks: completedTasksResult.count || 0,
    inProgressTasks: inProgressTasksResult.count || 0,
    contributedProjects: contributedProjectIds.size,
    requestsSent: requestsResult.count || 0,
    techStack,
  };

  return {
    ...metricsWithoutLevel,
    level: calculateUserLevel(metricsWithoutLevel),
  };
}
