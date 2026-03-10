import type { SupabaseClient } from "@supabase/supabase-js";

type MinimalSupabaseClient = SupabaseClient;

type ProfileLite = {
  id: string;
  github_username: string | null;
  full_name: string | null;
};

type ProjectLite = {
  id: string;
  name: string | null;
  slug: string | null;
};

type TaskActivityRow = {
  id: string;
  title: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  assigned_to: string | null;
  project_id: string;
  github_pr_url?: string | null;
  created_at: string;
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = error.code || "";
  const message = (error.message || "").toLowerCase();
  return (
    code === "42703" ||
    message.includes("github_pr_url") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export type ActivityItem = {
  id: string;
  type: "started_task" | "completed_task" | "merged_pr";
  createdAt: string;
  actorName: string;
  taskTitle: string;
  projectName: string;
  projectSlug: string | null;
  githubUrl: string | null;
};

function getActorName(profile: ProfileLite | undefined) {
  if (!profile) {
    return "@developer";
  }
  return profile.github_username ? `@${profile.github_username}` : profile.full_name || "@developer";
}

export async function getPlatformActivity(
  supabase: MinimalSupabaseClient,
  limit = 20
): Promise<ActivityItem[]> {
  const withPr = await supabase
    .from("tasks")
    .select("id, title, status, assigned_to, project_id, github_pr_url, created_at")
    .in("status", ["assigned", "in_review", "completed"])
    .order("created_at", { ascending: false })
    .limit(Math.max(limit * 3, 30));

  let tasks = withPr.data;
  let tasksError = withPr.error;

  if (tasksError && isMissingColumnError(tasksError)) {
    const fallback = await supabase
      .from("tasks")
      .select("id, title, status, assigned_to, project_id, created_at")
      .in("status", ["assigned", "in_review", "completed"])
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 3, 30));
    tasks = (fallback.data || []).map((task) => ({ ...task, github_pr_url: null }));
    tasksError = fallback.error;
  }

  if (tasksError) {
    console.error("Error cargando feed de actividad:", tasksError.message);
    return [];
  }

  const taskRows = (tasks || []) as TaskActivityRow[];
  if (taskRows.length === 0) {
    return [];
  }

  const profileIds = [
    ...new Set(taskRows.map((task) => task.assigned_to).filter((id): id is string => !!id)),
  ];
  const projectIds = [...new Set(taskRows.map((task) => task.project_id))];

  const [{ data: profiles }, { data: projects }] = await Promise.all([
    profileIds.length > 0
      ? supabase.from("profiles").select("id, github_username, full_name").in("id", profileIds)
      : { data: [] },
    projectIds.length > 0
      ? supabase.from("projects").select("id, name, slug").in("id", projectIds)
      : { data: [] },
  ]);

  const profileMap = new Map(((profiles || []) as ProfileLite[]).map((profile) => [profile.id, profile]));
  const projectMap = new Map(((projects || []) as ProjectLite[]).map((project) => [project.id, project]));

  const activity: ActivityItem[] = [];

  taskRows.forEach((task) => {
    const project = projectMap.get(task.project_id);
    const actor = task.assigned_to ? profileMap.get(task.assigned_to) : undefined;

    const base = {
      actorName: getActorName(actor),
      taskTitle: task.title || "Tarea sin título",
      projectName: project?.name || "Proyecto",
      projectSlug: project?.slug || null,
      createdAt: task.created_at,
    };

    if (task.status === "completed") {
      activity.push({
        id: `${task.id}-completed`,
        type: "completed_task",
        ...base,
        githubUrl: task.github_pr_url || null,
      });
      return;
    }

    if (task.status === "in_review") {
      activity.push({
        id: `${task.id}-in-review`,
        type: "started_task",
        ...base,
        githubUrl: task.github_pr_url || null,
      });
      return;
    }

    if (task.status === "assigned") {
      activity.push({
        id: `${task.id}-assigned`,
        type: "started_task",
        ...base,
        githubUrl: null,
      });
      return;
    }
  });

  return activity.slice(0, limit);
}

export async function getRecentContributions(
  supabase: MinimalSupabaseClient,
  limit = 6
): Promise<ActivityItem[]> {
  const activity = await getPlatformActivity(supabase, Math.max(limit * 2, 12));
  return activity
    .filter((item) => item.type === "completed_task" || item.githubUrl)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      type: item.githubUrl ? "merged_pr" : "completed_task",
    }));
}
