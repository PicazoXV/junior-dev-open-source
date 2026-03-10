import type { SupabaseClient } from "@supabase/supabase-js";

type MinimalSupabaseClient = SupabaseClient;

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const code = error.code || "";
  const message = error.message?.toLowerCase() || "";

  return (
    code === "42703" ||
    message.includes("github_pr_number") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export type PlatformStats = {
  totalDevelopers: number;
  tasksCompleted: number;
  projects: number;
  pullRequestsMerged: number;
};

export async function getPlatformStats(
  supabase: MinimalSupabaseClient
): Promise<PlatformStats> {
  const [developersResult, completedTasksResult, projectsResult, mergedPrsResult] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .not("github_pr_number", "is", null),
    ]);

  const pullRequestsMerged = isMissingColumnError(mergedPrsResult.error)
    ? completedTasksResult.count || 0
    : mergedPrsResult.count || 0;

  return {
    totalDevelopers: developersResult.count || 0,
    tasksCompleted: completedTasksResult.count || 0,
    projects: projectsResult.count || 0,
    pullRequestsMerged,
  };
}

