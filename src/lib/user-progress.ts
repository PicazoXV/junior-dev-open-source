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
  challengeStartedAt: string | null;
  challengeCompletedAt: string | null;
  challengeCompletedInTime: boolean;
  techStack: string | null;
  recentActivity: UserRecentActivity;
  level: UserLevel;
};

type MinimalSupabaseClient = SupabaseClient;

type TaskStatus = "open" | "assigned" | "in_review" | "completed" | "closed";

type TaskWithPrRow = {
  assigned_to: string | null;
  status: TaskStatus;
  project_id: string | null;
  title: string | null;
  created_at: string;
  github_pr_number: number | null;
  github_pr_url: string | null;
};

type TaskFallbackRow = {
  assigned_to: string | null;
  status: TaskStatus;
  project_id: string | null;
  title: string | null;
  created_at: string;
};

type RequestRow = {
  user_id: string | null;
};

type ProfileChallengeRow = {
  id: string;
  created_at: string | null;
  challenge_started_at: string | null;
  challenge_completed_at: string | null;
};

type ProfileCreatedAtRow = {
  id: string;
  created_at: string | null;
};

type ProjectNameRow = {
  id: string;
  name: string | null;
};

type UserProgressAccumulator = {
  completedTasks: number;
  inProgressTasks: number;
  assignedTasks: number;
  requestsSent: number;
  mergedPullRequests: number;
  inReviewPullRequests: number;
  contributedProjectIds: Set<string>;
  profileCreatedAt: string | null;
  challengeStartedAt: string | null;
  challengeCompletedAt: string | null;
  firstCompletedAt: string | null;
  lastCompletedTaskTitle: string | null;
  lastCompletedProjectId: string | null;
  lastCompletedTaskAtTs: number | null;
  lastPullRequestUrl: string | null;
  lastPullRequestProjectId: string | null;
  lastPullRequestAtTs: number | null;
  techStack: string | null;
};

function normalizeTechStackValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(", ") || null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  return null;
}

function createEmptyAccumulator(techStack: string | null): UserProgressAccumulator {
  return {
    completedTasks: 0,
    inProgressTasks: 0,
    assignedTasks: 0,
    requestsSent: 0,
    mergedPullRequests: 0,
    inReviewPullRequests: 0,
    contributedProjectIds: new Set<string>(),
    profileCreatedAt: null,
    challengeStartedAt: null,
    challengeCompletedAt: null,
    firstCompletedAt: null,
    lastCompletedTaskTitle: null,
    lastCompletedProjectId: null,
    lastCompletedTaskAtTs: null,
    lastPullRequestUrl: null,
    lastPullRequestProjectId: null,
    lastPullRequestAtTs: null,
    techStack,
  };
}

function createEmptyMetrics(techStack: string | null): UserProgressMetrics {
  const metricsWithoutLevel = {
    completedTasks: 0,
    inProgressTasks: 0,
    assignedTasks: 0,
    contributedProjects: 0,
    requestsSent: 0,
    mergedPullRequests: 0,
    inReviewPullRequests: 0,
    challengeStartedAt: null,
    challengeCompletedAt: null,
    challengeCompletedInTime: false,
    techStack,
    recentActivity: {
      lastCompletedTaskTitle: null,
      lastContributedProjectName: null,
      lastPullRequestUrl: null,
    },
  };

  return {
    ...metricsWithoutLevel,
    level: calculateUserLevel(metricsWithoutLevel),
  };
}

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

function isMissingChallengeColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const code = error.code || "";
  const message = error.message?.toLowerCase() || "";

  return (
    code === "42703" ||
    message.includes("challenge_started_at") ||
    message.includes("challenge_completed_at") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function addDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function getUsersProgressBulk(params: {
  supabase: MinimalSupabaseClient;
  userIds: string[];
  techStackByUserId?: Record<string, string | string[] | null | undefined>;
}): Promise<Map<string, UserProgressMetrics>> {
  const { supabase, techStackByUserId = {} } = params;
  const userIds = [...new Set(params.userIds.filter(Boolean))];

  if (userIds.length === 0) {
    return new Map<string, UserProgressMetrics>();
  }

  const accumulatorByUserId = new Map<string, UserProgressAccumulator>();
  userIds.forEach((userId) => {
    accumulatorByUserId.set(
      userId,
      createEmptyAccumulator(normalizeTechStackValue(techStackByUserId[userId]))
    );
  });

  let hasGithubPrColumns = true;
  let taskRows: Array<TaskWithPrRow | TaskFallbackRow> = [];

  const tasksWithPrResult = await supabase
    .from("tasks")
    .select("assigned_to, status, project_id, title, created_at, github_pr_number, github_pr_url")
    .in("assigned_to", userIds)
    .in("status", ["assigned", "in_review", "completed", "closed"]);

  if (tasksWithPrResult.error && isMissingColumnError(tasksWithPrResult.error)) {
    hasGithubPrColumns = false;

    const tasksFallbackResult = await supabase
      .from("tasks")
      .select("assigned_to, status, project_id, title, created_at")
      .in("assigned_to", userIds)
      .in("status", ["assigned", "in_review", "completed", "closed"]);

    if (tasksFallbackResult.error) {
      console.error(
        "Error cargando métricas (tasks bulk fallback):",
        tasksFallbackResult.error.message
      );
    } else {
      taskRows = (tasksFallbackResult.data || []) as TaskFallbackRow[];
    }
  } else if (tasksWithPrResult.error) {
    console.error("Error cargando métricas (tasks bulk):", tasksWithPrResult.error.message);
  } else {
    taskRows = (tasksWithPrResult.data || []) as TaskWithPrRow[];
  }

  for (const row of taskRows) {
    const userId = row.assigned_to;
    if (!userId) {
      continue;
    }

    const accumulator = accumulatorByUserId.get(userId);
    if (!accumulator) {
      continue;
    }

    const status = row.status;

    accumulator.assignedTasks += 1;

    if (status === "assigned" || status === "in_review") {
      accumulator.inProgressTasks += 1;
    }

    if (status === "completed") {
      accumulator.completedTasks += 1;
    }

    if (row.project_id) {
      accumulator.contributedProjectIds.add(row.project_id);
    }

    if (hasGithubPrColumns) {
      const withPr = row as TaskWithPrRow;

      if (status === "completed" && withPr.github_pr_number !== null) {
        accumulator.mergedPullRequests += 1;
      }

      if (status === "in_review" && withPr.github_pr_number !== null) {
        accumulator.inReviewPullRequests += 1;
      }

      const prTs = toTimestamp(withPr.created_at);
      if (withPr.github_pr_url && prTs !== null) {
        if (accumulator.lastPullRequestAtTs === null || prTs > accumulator.lastPullRequestAtTs) {
          accumulator.lastPullRequestAtTs = prTs;
          accumulator.lastPullRequestUrl = withPr.github_pr_url;
          accumulator.lastPullRequestProjectId = withPr.project_id;
        }
      }
    } else {
      if (status === "completed") {
        accumulator.mergedPullRequests += 1;
      }

      if (status === "in_review") {
        accumulator.inReviewPullRequests += 1;
      }
    }

    if (status === "completed") {
      const completedTs = toTimestamp(row.created_at);

      if (completedTs !== null) {
        if (accumulator.lastCompletedTaskAtTs === null || completedTs > accumulator.lastCompletedTaskAtTs) {
          accumulator.lastCompletedTaskAtTs = completedTs;
          accumulator.lastCompletedTaskTitle = row.title;
          accumulator.lastCompletedProjectId = row.project_id;
        }

        const firstCompletedTs = toTimestamp(accumulator.firstCompletedAt);
        if (accumulator.firstCompletedAt === null || firstCompletedTs === null || completedTs < firstCompletedTs) {
          accumulator.firstCompletedAt = row.created_at;
        }
      }
    }
  }

  const requestsResult = await supabase
    .from("task_requests")
    .select("user_id")
    .in("user_id", userIds);

  if (requestsResult.error) {
    console.error("Error cargando métricas (task requests bulk):", requestsResult.error.message);
  } else {
    for (const row of (requestsResult.data || []) as RequestRow[]) {
      if (!row.user_id) continue;
      const accumulator = accumulatorByUserId.get(row.user_id);
      if (!accumulator) continue;
      accumulator.requestsSent += 1;
    }
  }

  const profileChallengeResult = await supabase
    .from("profiles")
    .select("id, created_at, challenge_started_at, challenge_completed_at")
    .in("id", userIds);

  if (profileChallengeResult.error && isMissingChallengeColumnError(profileChallengeResult.error)) {
    const fallbackProfileResult = await supabase
      .from("profiles")
      .select("id, created_at")
      .in("id", userIds);

    if (fallbackProfileResult.error) {
      console.error(
        "Error cargando métricas (challenge profile bulk fallback):",
        fallbackProfileResult.error.message
      );
    } else {
      for (const row of (fallbackProfileResult.data || []) as ProfileCreatedAtRow[]) {
        const accumulator = accumulatorByUserId.get(row.id);
        if (!accumulator) continue;

        accumulator.profileCreatedAt = row.created_at;
        accumulator.challengeStartedAt = row.created_at;
      }
    }
  } else if (profileChallengeResult.error) {
    console.error(
      "Error cargando métricas (challenge profile bulk):",
      profileChallengeResult.error.message
    );
  } else {
    for (const row of (profileChallengeResult.data || []) as ProfileChallengeRow[]) {
      const accumulator = accumulatorByUserId.get(row.id);
      if (!accumulator) continue;

      accumulator.profileCreatedAt = row.created_at;
      accumulator.challengeStartedAt = row.challenge_started_at || row.created_at;
      accumulator.challengeCompletedAt = row.challenge_completed_at;
    }
  }

  const recentProjectIds = new Set<string>();
  for (const accumulator of accumulatorByUserId.values()) {
    const recentProjectId = accumulator.lastCompletedProjectId || accumulator.lastPullRequestProjectId;
    if (recentProjectId) {
      recentProjectIds.add(recentProjectId);
    }
  }

  const recentProjectNameById = new Map<string, string | null>();

  if (recentProjectIds.size > 0) {
    const projectsResult = await supabase
      .from("projects")
      .select("id, name")
      .in("id", [...recentProjectIds]);

    if (projectsResult.error) {
      console.error("Error cargando actividad reciente (project names bulk):", projectsResult.error.message);
    } else {
      for (const project of (projectsResult.data || []) as ProjectNameRow[]) {
        recentProjectNameById.set(project.id, project.name || null);
      }
    }
  }

  const metricsByUserId = new Map<string, UserProgressMetrics>();

  for (const userId of userIds) {
    const accumulator = accumulatorByUserId.get(userId);

    if (!accumulator) {
      metricsByUserId.set(userId, createEmptyMetrics(normalizeTechStackValue(techStackByUserId[userId])));
      continue;
    }

    const challengeStartedAt = accumulator.challengeStartedAt || accumulator.profileCreatedAt || null;
    const challengeCompletedAt = accumulator.challengeCompletedAt || accumulator.firstCompletedAt || null;

    const challengeCompletedInTime =
      !!challengeStartedAt &&
      !!challengeCompletedAt &&
      new Date(challengeCompletedAt).getTime() <= new Date(addDays(challengeStartedAt, 7)).getTime();

    const recentProjectId = accumulator.lastCompletedProjectId || accumulator.lastPullRequestProjectId;
    const lastContributedProjectName = recentProjectId
      ? recentProjectNameById.get(recentProjectId) || null
      : null;

    const metricsWithoutLevel = {
      completedTasks: accumulator.completedTasks,
      inProgressTasks: accumulator.inProgressTasks,
      assignedTasks: accumulator.assignedTasks,
      contributedProjects: accumulator.contributedProjectIds.size,
      requestsSent: accumulator.requestsSent,
      mergedPullRequests: accumulator.mergedPullRequests,
      inReviewPullRequests: accumulator.inReviewPullRequests,
      challengeStartedAt,
      challengeCompletedAt,
      challengeCompletedInTime,
      techStack: accumulator.techStack,
      recentActivity: {
        lastCompletedTaskTitle: accumulator.lastCompletedTaskTitle,
        lastContributedProjectName,
        lastPullRequestUrl: accumulator.lastPullRequestUrl,
      },
    };

    metricsByUserId.set(userId, {
      ...metricsWithoutLevel,
      level: calculateUserLevel(metricsWithoutLevel),
    });
  }

  return metricsByUserId;
}

export async function getUserProgress(
  supabase: MinimalSupabaseClient,
  userId: string,
  techStackFromProfile?: string | string[] | null
): Promise<UserProgressMetrics> {
  const progressByUserId = await getUsersProgressBulk({
    supabase,
    userIds: [userId],
    techStackByUserId: {
      [userId]: techStackFromProfile,
    },
  });

  return (
    progressByUserId.get(userId) ||
    createEmptyMetrics(normalizeTechStackValue(techStackFromProfile))
  );
}
