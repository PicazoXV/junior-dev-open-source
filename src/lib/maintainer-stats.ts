import type { SupabaseClient } from "@supabase/supabase-js";

type MinimalSupabaseClient = SupabaseClient;

export type MaintainerStats = {
  pendingRequests: number;
  tasksWithoutIssue: number;
  tasksInReview: number;
  tasksCompleted: number;
  activeContributors: number;
  managedProjects: number;
};

export async function getMaintainerStats(params: {
  supabase: MinimalSupabaseClient;
  maintainerId: string;
}) {
  const { supabase, maintainerId } = params;

  const [projectsResult, pendingRequestsResult, inReviewResult, completedResult, noIssueResult] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("created_by", maintainerId),
      supabase
        .from("task_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_review"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .is("github_issue_url", null),
    ]);

  const { data: assignedTasks } = await supabase
    .from("tasks")
    .select("assigned_to")
    .in("status", ["assigned", "in_review", "completed"])
    .not("assigned_to", "is", null)
    .limit(2000);

  const activeContributors = new Set(
    (assignedTasks || [])
      .map((task) => task.assigned_to)
      .filter((id): id is string => typeof id === "string")
  ).size;

  return {
    pendingRequests: pendingRequestsResult.count || 0,
    tasksWithoutIssue: noIssueResult.count || 0,
    tasksInReview: inReviewResult.count || 0,
    tasksCompleted: completedResult.count || 0,
    activeContributors,
    managedProjects: projectsResult.count || 0,
  } as MaintainerStats;
}
