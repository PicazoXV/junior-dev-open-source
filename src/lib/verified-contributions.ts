import type { SupabaseClient } from "@supabase/supabase-js";

type MinimalSupabaseClient = SupabaseClient;

export type VerifiedContribution = {
  taskId: string;
  taskTitle: string;
  projectName: string;
  projectSlug: string | null;
  githubPrUrl: string | null;
  githubPrNumber: number | null;
  githubIssueUrl: string | null;
  completedAt: string;
};

function isMissingPrColumnsError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return (
    code === "42703" ||
    message.includes("github_pr_url") ||
    message.includes("github_pr_number") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export async function getVerifiedContributions(params: {
  supabase: MinimalSupabaseClient;
  userId: string;
  limit?: number;
}) {
  const { supabase, userId, limit = 20 } = params;

  const withPrColumns = await supabase
    .from("tasks")
    .select(
      "id, title, project_id, github_issue_url, github_pr_url, github_pr_number, created_at, status"
    )
    .eq("assigned_to", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  let rows = withPrColumns.data || [];
  let error = withPrColumns.error;

  if (error && isMissingPrColumnsError(error)) {
    const fallback = await supabase
      .from("tasks")
      .select("id, title, project_id, github_issue_url, created_at, status")
      .eq("assigned_to", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit);
    rows = (fallback.data || []).map((task) => ({
      ...task,
      github_pr_url: null,
      github_pr_number: null,
    }));
    error = fallback.error;
  }

  if (error) {
    console.error("Error loading verified contributions:", error.message);
    return [] as VerifiedContribution[];
  }

  const projectIds = [...new Set(rows.map((item) => item.project_id))];
  const { data: projects } =
    projectIds.length > 0
      ? await supabase.from("projects").select("id, name, slug").in("id", projectIds)
      : { data: [] };

  const projectById = new Map((projects || []).map((project) => [project.id, project]));

  return rows.map<VerifiedContribution>((task) => {
    const project = projectById.get(task.project_id);
    return {
      taskId: task.id,
      taskTitle: task.title || "Tarea",
      projectName: project?.name || "Proyecto",
      projectSlug: project?.slug || null,
      githubPrUrl: (task as { github_pr_url?: string | null }).github_pr_url || null,
      githubPrNumber: (task as { github_pr_number?: number | null }).github_pr_number || null,
      githubIssueUrl: task.github_issue_url || null,
      completedAt: task.created_at,
    };
  });
}
