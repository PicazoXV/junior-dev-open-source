import type { UserProgressMetrics } from "@/lib/user-progress";

export type UserRoadmapMilestone = {
  id:
    | "first_request"
    | "first_assigned"
    | "first_pr_opened"
    | "first_pr_merged"
    | "three_completed"
    | "ten_completed";
  label: string;
  completed: boolean;
};

export type UserRoadmap = {
  completed: number;
  total: number;
  progressPercent: number;
  milestones: UserRoadmapMilestone[];
};

export function getUserRoadmap(
  progress: UserProgressMetrics,
  locale: "es" | "en"
): UserRoadmap {
  const milestones: UserRoadmapMilestone[] = [
    {
      id: "first_request",
      label: locale === "en" ? "First request sent" : "Primera solicitud enviada",
      completed: progress.requestsSent >= 1,
    },
    {
      id: "first_assigned",
      label: locale === "en" ? "First task assigned" : "Primera tarea asignada",
      completed: progress.assignedTasks >= 1,
    },
    {
      id: "first_pr_opened",
      label: locale === "en" ? "First PR opened" : "Primer PR abierto",
      completed: progress.inReviewPullRequests + progress.mergedPullRequests >= 1,
    },
    {
      id: "first_pr_merged",
      label: locale === "en" ? "First PR merged" : "Primer PR mergeado",
      completed: progress.mergedPullRequests >= 1,
    },
    {
      id: "three_completed",
      label: locale === "en" ? "3 tasks completed" : "3 tareas completadas",
      completed: progress.completedTasks >= 3,
    },
    {
      id: "ten_completed",
      label: locale === "en" ? "10 tasks completed" : "10 tareas completadas",
      completed: progress.completedTasks >= 10,
    },
  ];

  const completed = milestones.filter((item) => item.completed).length;
  const total = milestones.length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    total,
    progressPercent,
    milestones,
  };
}
