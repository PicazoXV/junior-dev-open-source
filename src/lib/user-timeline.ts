import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserBadges } from "@/lib/user-badges";
import { getUserProgress } from "@/lib/user-progress";
import { getBadgeCopy } from "@/lib/i18n/labels";

type MinimalSupabaseClient = SupabaseClient;

type TimelineEventType =
  | "request_sent"
  | "task_approved"
  | "issue_created"
  | "pr_opened"
  | "pr_merged"
  | "badge_unlocked";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  createdAt: string;
  title: string;
  description: string;
  link: string | null;
};

function pushIf<T>(arr: T[], value: T | null | undefined) {
  if (value) {
    arr.push(value);
  }
}

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

export async function getUserTimeline(params: {
  supabase: MinimalSupabaseClient;
  userId: string;
  locale: "es" | "en";
  limit?: number;
}) {
  const { supabase, userId, locale, limit = 20 } = params;
  const events: TimelineEvent[] = [];

  const [requestsResult, tasksWithPr] = await Promise.all([
    supabase
      .from("task_requests")
      .select("id, task_id, status, created_at, reviewed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("tasks")
      .select(
        "id, title, status, github_issue_url, github_pr_url, github_pr_number, created_at, assigned_to"
      )
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  let tasksResult = tasksWithPr;
  if (tasksResult.error && isMissingPrColumnsError(tasksResult.error)) {
    const fallback = await supabase
      .from("tasks")
      .select("id, title, status, github_issue_url, created_at, assigned_to")
      .eq("assigned_to", userId)
      .order("created_at", { ascending: false })
      .limit(40);
    tasksResult = {
      ...fallback,
      data: (fallback.data || []).map((task) => ({
        ...task,
        github_pr_url: null,
        github_pr_number: null,
      })),
    };
  }

  (requestsResult.data || []).forEach((request) => {
    pushIf(events, {
      id: `req-${request.id}-sent`,
      type: "request_sent",
      createdAt: request.created_at,
      title: locale === "en" ? "Task request sent" : "Solicitud enviada",
      description:
        locale === "en"
          ? "You requested a new task."
          : "Has enviado una solicitud para una tarea.",
      link: `/tasks/${request.task_id}`,
    });

    if (request.status === "approved" && request.reviewed_at) {
      pushIf(events, {
        id: `req-${request.id}-approved`,
        type: "task_approved",
        createdAt: request.reviewed_at,
        title: locale === "en" ? "Task approved" : "Tarea aprobada",
        description:
          locale === "en"
            ? "A maintainer approved your request."
            : "Un maintainer aprobó tu solicitud.",
        link: `/tasks/${request.task_id}`,
      });
    }
  });

  (tasksResult.data || []).forEach((task) => {
    if (task.github_issue_url) {
      pushIf(events, {
        id: `task-${task.id}-issue`,
        type: "issue_created",
        createdAt: task.created_at,
        title: locale === "en" ? "GitHub issue created" : "Issue de GitHub creado",
        description:
          locale === "en"
            ? `Issue linked for ${task.title || "task"}.`
            : `Issue enlazado para ${task.title || "la tarea"}.`,
        link: task.github_issue_url,
      });
    }

    if (task.status === "in_review" || task.github_pr_number || task.github_pr_url) {
      pushIf(events, {
        id: `task-${task.id}-pr-open`,
        type: "pr_opened",
        createdAt: task.created_at,
        title: locale === "en" ? "Pull Request opened" : "Pull Request abierto",
        description:
          locale === "en"
            ? `PR detected for ${task.title || "task"}.`
            : `PR detectado para ${task.title || "la tarea"}.`,
        link: task.github_pr_url || `/tasks/${task.id}`,
      });
    }

    if (task.status === "completed") {
      pushIf(events, {
        id: `task-${task.id}-pr-merged`,
        type: "pr_merged",
        createdAt: task.created_at,
        title: locale === "en" ? "Pull Request merged" : "Pull Request mergeado",
        description:
          locale === "en"
            ? `Contribution completed: ${task.title || "task"}.`
            : `Contribución completada: ${task.title || "tarea"}.`,
        link: task.github_pr_url || `/tasks/${task.id}`,
      });
    }
  });

  const progress = await getUserProgress(supabase, userId);
  const unlockedBadges = getUserBadges(progress).filter((badge) => badge.unlocked);
  unlockedBadges.forEach((badge, index) => {
    const badgeCopy = getBadgeCopy(badge.id, locale);
    pushIf(events, {
      id: `badge-${badge.id}-${index}`,
      type: "badge_unlocked",
      createdAt: new Date().toISOString(),
      title: locale === "en" ? "Badge unlocked" : "Badge desbloqueado",
      description: badgeCopy.title,
      link: null,
    });
  });

  return events
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
