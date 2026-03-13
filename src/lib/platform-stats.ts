import type { SupabaseClient } from "@supabase/supabase-js";

type MinimalSupabaseClient = SupabaseClient;

type AuthUserRow = {
  id: string;
  raw_user_meta_data: Record<string, unknown> | null;
  raw_app_meta_data: Record<string, unknown> | null;
};

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

function cleanValue(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasGitHubIdentity(row: AuthUserRow) {
  const appMeta = row.raw_app_meta_data || {};
  const userMeta = row.raw_user_meta_data || {};
  const providers = Array.isArray(appMeta.providers) ? appMeta.providers : [];
  const provider = cleanValue(appMeta.provider);

  if (provider === "github") return true;
  if (providers.some((value) => cleanValue(value) === "github")) return true;

  return !!(
    cleanValue(userMeta.user_name) ||
    cleanValue(userMeta.preferred_username) ||
    cleanValue(userMeta.user_login) ||
    cleanValue(userMeta.login)
  );
}

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

  let totalDevelopers = developersResult.count || 0;

  try {
    const authUsersResult = await supabase
      .schema("auth")
      .from("users")
      .select("id, raw_user_meta_data, raw_app_meta_data");

    if (!authUsersResult.error) {
      const authUsers = (authUsersResult.data || []) as AuthUserRow[];
      const githubUsersCount = authUsers.filter(hasGitHubIdentity).length;
      totalDevelopers = Math.max(totalDevelopers, githubUsersCount);
    }
  } catch (error) {
    console.warn(
      "No se pudo leer auth.users para totalDevelopers, usando conteo de profiles.",
      error instanceof Error ? error.message : String(error)
    );
  }

  return {
    totalDevelopers,
    tasksCompleted: completedTasksResult.count || 0,
    projects: projectsResult.count || 0,
    pullRequestsMerged,
  };
}
