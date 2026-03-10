import type { SupabaseClient } from "@supabase/supabase-js";

export type UserLevel = "beginner" | "junior" | "contributor" | "maintainer";

export type UserRecentActivity = {
  lastCompletedTaskTitle: string | null;
  lastContributedProjectName: string | null;
  lastPullRequestUrl: string | null;
};

export type UserProgressMetrics = {
  completedTasks: number;
  inProgressTasks: number;
  assignedTasks: number;
  contributedProjects: number;
  requestsSent: number;
  mergedPullRequests: number;
  inReviewPullRequests: number;
  techStack: string | null;
  recentActivity: UserRecentActivity;
  level: UserLevel;
};

type MinimalSupabaseClient = SupabaseClient;

export function calculateUserLevel(metrics: Omit<UserProgressMetrics, "level">): UserLevel {
  if (
    metrics.completedTasks >= 12 ||
    metrics.mergedPullRequests >= 10 ||
    (metrics.completedTasks >= 8 && metrics.contributedProjects >= 4)
  ) {
    return "maintainer";
  }

  if (
    metrics.completedTasks >= 5 ||
    metrics.mergedPullRequests >= 4 ||
    metrics.contributedProjects >= 3
  ) {
    return "contributor";
  }

  if (
    metrics.completedTasks >= 2 ||
    metrics.requestsSent >= 3 ||
    metrics.inProgressTasks >= 1 ||
    metrics.mergedPullRequests >= 1
  ) {
    return "junior";
  }

  return "beginner";
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const code = error.code || "";
  const message = error.message?.toLowerCase() || "";

  return (
    code === "42703" ||
    message.includes("github_pr_number") ||
    message.includes("github_pr_url") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export async function getUserProgress(
  supabase: MinimalSupabaseClient,
  userId: string,
  techStackFromProfile?: string | null
): Promise<UserProgressMetrics> {
  const [
    completedTasksResult,
    inProgressTasksResult,
    assignedTasksResult,
    contributionTasksResult,
    requestsResult,
    mergedPullRequestsResult,
    inReviewPullRequestsResult,
    recentCompletedTaskResult,
    recentTaskWithPrResult,
  ] = await Promise.all([
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
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", userId)
      .in("status", ["assigned", "in_review", "completed", "closed"]),
    supabase
      .from("tasks")
      .select("project_id")
      .eq("assigned_to", userId)
      .in("status", ["assigned", "in_review", "completed", "closed"]),
    supabase
      .from("task_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", userId)
      .eq("status", "completed")
      .not("github_pr_number", "is", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("assigned_to", userId)
      .eq("status", "in_review")
      .not("github_pr_number", "is", null),
    supabase
      .from("tasks")
      .select("id, title, project_id, created_at")
      .eq("assigned_to", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, project_id, github_pr_url, created_at")
      .eq("assigned_to", userId)
      .not("github_pr_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
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

  if (mergedPullRequestsResult.error && !isMissingColumnError(mergedPullRequestsResult.error)) {
    console.error(
      "Error cargando métricas (merged pull requests):",
      mergedPullRequestsResult.error.message
    );
  }

  if (inReviewPullRequestsResult.error && !isMissingColumnError(inReviewPullRequestsResult.error)) {
    console.error(
      "Error cargando métricas (in review pull requests):",
      inReviewPullRequestsResult.error.message
    );
  }

  if (recentCompletedTaskResult.error) {
    console.error(
      "Error cargando actividad reciente (last completed task):",
      recentCompletedTaskResult.error.message
    );
  }

  if (recentTaskWithPrResult.error && !isMissingColumnError(recentTaskWithPrResult.error)) {
    console.error(
      "Error cargando actividad reciente (last PR task):",
      recentTaskWithPrResult.error.message
    );
  }

  const contributedProjectIds = new Set(
    (contributionTasksResult.data || [])
      .map((task) => task.project_id)
      .filter((projectId): projectId is string => typeof projectId === "string")
  );

  const techStack =
    typeof techStackFromProfile === "undefined" ? null : techStackFromProfile;

  const mergedPrCount = isMissingColumnError(mergedPullRequestsResult.error)
    ? 0
    : mergedPullRequestsResult.count || 0;

  const inReviewPrCount = isMissingColumnError(inReviewPullRequestsResult.error)
    ? 0
    : inReviewPullRequestsResult.count || 0;

  const recentProjectId =
    recentCompletedTaskResult.data?.project_id || recentTaskWithPrResult.data?.project_id || null;

  let lastContributedProjectName: string | null = null;
  if (recentProjectId) {
    const { data: recentProject } = await supabase
      .from("projects")
      .select("name")
      .eq("id", recentProjectId)
      .maybeSingle();

    lastContributedProjectName = recentProject?.name || null;
  }

  const metricsWithoutLevel = {
    completedTasks: completedTasksResult.count || 0,
    inProgressTasks: inProgressTasksResult.count || 0,
    assignedTasks: assignedTasksResult.count || 0,
    contributedProjects: contributedProjectIds.size,
    requestsSent: requestsResult.count || 0,
    mergedPullRequests: mergedPrCount,
    inReviewPullRequests: inReviewPrCount,
    techStack,
    recentActivity: {
      lastCompletedTaskTitle: recentCompletedTaskResult.data?.title || null,
      lastContributedProjectName,
      lastPullRequestUrl: recentTaskWithPrResult.data?.github_pr_url || null,
    },
  };

  return {
    ...metricsWithoutLevel,
    level: calculateUserLevel(metricsWithoutLevel),
  };
}
