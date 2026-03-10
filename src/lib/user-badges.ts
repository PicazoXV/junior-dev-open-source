import type { UserProgressMetrics } from "@/lib/user-progress";

export type UserBadgeId =
  | "first_issue_champion"
  | "first_request"
  | "first_task_assigned"
  | "first_pr"
  | "first_merge"
  | "open_source_starter"
  | "consistent_contributor"
  | "tasks_10_completed"
  | "multi_project_contributor";

export type UserBadge = {
  id: UserBadgeId;
  title: string;
  description: string;
  unlocked: boolean;
};

type BadgeRule = Omit<UserBadge, "unlocked"> & {
  isUnlocked: (metrics: UserProgressMetrics) => boolean;
};

const BADGE_RULES: BadgeRule[] = [
  {
    id: "first_issue_champion",
    title: "First Issue Champion",
    description: "Completaste tu primera contribución dentro del reto de 7 días.",
    isUnlocked: (metrics) => metrics.challengeCompletedInTime,
  },
  {
    id: "first_request",
    title: "First Request",
    description: "Has enviado tu primera solicitud de tarea.",
    isUnlocked: (metrics) => metrics.requestsSent >= 1,
  },
  {
    id: "first_task_assigned",
    title: "First Task Assigned",
    description: "Ya tienes al menos una tarea asignada.",
    isUnlocked: (metrics) => metrics.assignedTasks >= 1,
  },
  {
    id: "first_pr",
    title: "First PR",
    description: "Se detectó tu primer Pull Request vinculado.",
    isUnlocked: (metrics) => metrics.mergedPullRequests + metrics.inReviewPullRequests >= 1,
  },
  {
    id: "first_merge",
    title: "First Merge",
    description: "Completaste tu primera tarea con merge.",
    isUnlocked: (metrics) => metrics.mergedPullRequests >= 1 || metrics.completedTasks >= 1,
  },
  {
    id: "open_source_starter",
    title: "Open Source Starter",
    description: "Has completado 3 tareas.",
    isUnlocked: (metrics) => metrics.completedTasks >= 3,
  },
  {
    id: "consistent_contributor",
    title: "Consistent Contributor",
    description: "Has completado 5 tareas.",
    isUnlocked: (metrics) => metrics.completedTasks >= 5,
  },
  {
    id: "tasks_10_completed",
    title: "10 Tasks Completed",
    description: "Has completado 10 tareas.",
    isUnlocked: (metrics) => metrics.completedTasks >= 10,
  },
  {
    id: "multi_project_contributor",
    title: "Multi-Project Contributor",
    description: "Has contribuido en 3 proyectos distintos.",
    isUnlocked: (metrics) => metrics.contributedProjects >= 3,
  },
];

export function getUserBadges(metrics: UserProgressMetrics): UserBadge[] {
  return BADGE_RULES.map((rule) => ({
    id: rule.id,
    title: rule.title,
    description: rule.description,
    unlocked: rule.isUnlocked(metrics),
  }));
}
