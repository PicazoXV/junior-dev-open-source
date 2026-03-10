import type { SupabaseClient } from "@supabase/supabase-js";

type MinimalSupabaseClient = SupabaseClient;

type ProfileChallengeRow = {
  created_at: string | null;
  challenge_started_at: string | null;
  challenge_completed_at: string | null;
};

type TaskChallengeRow = {
  id: string;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  github_pr_number: number | null;
};

export type FirstIssueChallengeProgress = {
  startedAt: string | null;
  deadlineAt: string | null;
  completedAt: string | null;
  completedInTime: boolean;
  isCompleted: boolean;
  isExpired: boolean;
  daysRemaining: number;
  steps: {
    taskRequested: boolean;
    taskApproved: boolean;
    prOpened: boolean;
    prMerged: boolean;
  };
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() || "";
  const code = error.code || "";

  return (
    code === "42703" ||
    message.includes("challenge_started_at") ||
    message.includes("challenge_completed_at") ||
    message.includes("github_pr_number") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function diffDays(fromIso: string, toIso: string) {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.max(0, Math.ceil((to - from) / (1000 * 60 * 60 * 24)));
}

async function loadProfileChallengeData(supabase: MinimalSupabaseClient, userId: string) {
  const withChallengeColumns = await supabase
    .from("profiles")
    .select("created_at, challenge_started_at, challenge_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (!withChallengeColumns.error) {
    return withChallengeColumns.data as ProfileChallengeRow | null;
  }

  if (!isMissingColumnError(withChallengeColumns.error)) {
    return null;
  }

  const fallback = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle();

  if (fallback.error || !fallback.data) {
    return null;
  }

  return {
    created_at: fallback.data.created_at,
    challenge_started_at: null,
    challenge_completed_at: null,
  };
}

export async function getFirstIssueChallengeProgress(
  supabase: MinimalSupabaseClient,
  userId: string
): Promise<FirstIssueChallengeProgress> {
  const [profile, requestRows, approvedRows, tasksWithPrResult, firstCompletedTaskResult] =
    await Promise.all([
      loadProfileChallengeData(supabase, userId),
      supabase.from("task_requests").select("id", { head: true, count: "exact" }).eq("user_id", userId),
      supabase
        .from("task_requests")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", userId)
        .eq("status", "approved"),
      supabase
        .from("tasks")
        .select("id, status, github_pr_number")
        .eq("assigned_to", userId)
        .in("status", ["assigned", "in_review", "completed", "closed"]),
      supabase
        .from("tasks")
        .select("id, created_at")
        .eq("assigned_to", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

  let tasks = (tasksWithPrResult.data || []) as TaskChallengeRow[];

  if (tasksWithPrResult.error && isMissingColumnError(tasksWithPrResult.error)) {
    const fallbackTasks = await supabase
      .from("tasks")
      .select("id, status")
      .eq("assigned_to", userId)
      .in("status", ["assigned", "in_review", "completed", "closed"]);

    tasks = (fallbackTasks.data || []).map((task) => ({ ...task, github_pr_number: null })) as TaskChallengeRow[];
  }

  const startedAt = profile?.challenge_started_at || profile?.created_at || null;
  const deadlineAt = startedAt ? addDays(startedAt, 7) : null;
  const completedAt =
    profile?.challenge_completed_at || firstCompletedTaskResult.data?.created_at || null;

  const nowIso = new Date().toISOString();
  const isCompleted = tasks.some((task) => task.status === "completed") || !!completedAt;
  const completedInTime =
    !!completedAt && !!deadlineAt && new Date(completedAt).getTime() <= new Date(deadlineAt).getTime();
  const isExpired = !!deadlineAt && !isCompleted && nowIso > deadlineAt;
  const daysRemaining = deadlineAt ? diffDays(nowIso, deadlineAt) : 0;

  const hasPrOpened = tasks.some(
    (task) => task.status === "in_review" || task.status === "completed" || !!task.github_pr_number
  );

  return {
    startedAt,
    deadlineAt,
    completedAt,
    completedInTime,
    isCompleted,
    isExpired,
    daysRemaining,
    steps: {
      taskRequested: (requestRows.count || 0) > 0,
      taskApproved: (approvedRows.count || 0) > 0,
      prOpened: hasPrOpened,
      prMerged: tasks.some((task) => task.status === "completed"),
    },
  };
}

export async function markFirstIssueChallengeCompleted(params: {
  supabase: MinimalSupabaseClient;
  userId: string;
  completedAt?: string;
}) {
  const { supabase, userId, completedAt = new Date().toISOString() } = params;

  const profile = await loadProfileChallengeData(supabase, userId);

  if (!profile) {
    return { updated: false, reason: "profile_not_found" as const };
  }

  if (profile.challenge_completed_at) {
    return { updated: false, reason: "already_completed" as const };
  }

  const startAt = profile.challenge_started_at || profile.created_at;
  if (!startAt) {
    return { updated: false, reason: "missing_start" as const };
  }

  const deadlineAt = addDays(startAt, 7);
  if (new Date(completedAt).getTime() > new Date(deadlineAt).getTime()) {
    return { updated: false, reason: "outside_challenge_window" as const };
  }

  const updateResult = await supabase
    .from("profiles")
    .update({ challenge_completed_at: completedAt })
    .eq("id", userId);

  if (updateResult.error) {
    if (isMissingColumnError(updateResult.error)) {
      return { updated: false, reason: "missing_columns" as const };
    }

    throw new Error(`No se pudo actualizar challenge_completed_at: ${updateResult.error.message}`);
  }

  return { updated: true, reason: "completed" as const };
}
