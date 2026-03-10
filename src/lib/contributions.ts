import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserBadges, type UserBadge } from "@/lib/user-badges";
import { getUserProgress } from "@/lib/user-progress";

type MinimalSupabaseClient = SupabaseClient;

type ContributionTaskRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  project_id: string;
  assigned_to: string | null;
  github_issue_url: string | null;
  github_pr_url: string | null;
  github_pr_number: number | null;
};

type ContributionProjectRow = {
  id: string;
  slug: string | null;
  name: string | null;
  repo_url: string | null;
};

type ContributionProfileRow = {
  id: string;
  github_username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  tech_stack: string | null;
};

export type ContributionDetails = {
  id: string;
  taskTitle: string;
  taskDescription: string | null;
  taskStatus: ContributionTaskRow["status"];
  projectName: string;
  projectSlug: string | null;
  projectRepoUrl: string | null;
  developerId: string | null;
  developerGithubUsername: string | null;
  developerName: string | null;
  developerAvatarUrl: string | null;
  githubIssueUrl: string | null;
  githubPrUrl: string | null;
  githubPrNumber: number | null;
  highlightedBadge: UserBadge | null;
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() || "";
  const code = error.code || "";

  return (
    code === "42703" ||
    message.includes("github_pr_url") ||
    message.includes("github_pr_number") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function pickHighlightedBadge(badges: UserBadge[]) {
  const unlocked = badges.filter((badge) => badge.unlocked);
  if (unlocked.length === 0) {
    return null;
  }

  const priority: UserBadge["id"][] = [
    "first_issue_champion",
    "tasks_10_completed",
    "consistent_contributor",
    "open_source_starter",
    "first_merge",
    "first_pr",
    "first_task_assigned",
    "first_request",
    "multi_project_contributor",
  ];

  const found = priority
    .map((badgeId) => unlocked.find((badge) => badge.id === badgeId) || null)
    .find((badge) => badge !== null);

  return found || unlocked[0] || null;
}

export async function getContributionByTaskId(
  supabase: MinimalSupabaseClient,
  taskId: string
): Promise<ContributionDetails | null> {
  const taskWithPullRequest = await supabase
    .from("tasks")
    .select(
      "id, title, description, status, project_id, assigned_to, github_issue_url, github_pr_url, github_pr_number"
    )
    .eq("id", taskId)
    .maybeSingle();

  let task = taskWithPullRequest.data as ContributionTaskRow | null;
  let taskError = taskWithPullRequest.error;

  if (taskError && isMissingColumnError(taskError)) {
    const fallbackTask = await supabase
      .from("tasks")
      .select("id, title, description, status, project_id, assigned_to, github_issue_url")
      .eq("id", taskId)
      .maybeSingle();

    task = fallbackTask.data
      ? ({
          ...fallbackTask.data,
          github_pr_url: null,
          github_pr_number: null,
        } as ContributionTaskRow)
      : null;
    taskError = fallbackTask.error;
  }

  if (taskError || !task) {
    return null;
  }

  const [projectResult, profileResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, slug, name, repo_url")
      .eq("id", task.project_id)
      .maybeSingle(),
    task.assigned_to
      ? supabase
          .from("profiles")
          .select("id, github_username, full_name, avatar_url, tech_stack")
          .eq("id", task.assigned_to)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (projectResult.error || !projectResult.data) {
    return null;
  }

  const project = projectResult.data as ContributionProjectRow;
  const developer = profileResult.data as ContributionProfileRow | null;

  let highlightedBadge: UserBadge | null = null;

  if (developer?.id) {
    const progress = await getUserProgress(supabase, developer.id, developer.tech_stack || null);
    highlightedBadge = pickHighlightedBadge(getUserBadges(progress));
  }

  return {
    id: task.id,
    taskTitle: task.title?.trim() || "Tarea sin título",
    taskDescription: task.description || null,
    taskStatus: task.status,
    projectName: project.name?.trim() || "Proyecto",
    projectSlug: project.slug,
    projectRepoUrl: project.repo_url,
    developerId: developer?.id || null,
    developerGithubUsername: developer?.github_username || null,
    developerName: developer?.full_name || null,
    developerAvatarUrl: developer?.avatar_url || null,
    githubIssueUrl: task.github_issue_url,
    githubPrUrl: task.github_pr_url,
    githubPrNumber: task.github_pr_number,
    highlightedBadge,
  };
}
