import type { AppLocale } from "@/lib/i18n/types";
import type { UserBadgeId } from "@/lib/user-badges";
import type { UserLevel } from "@/lib/user-progress";

type TaskStatus = "open" | "assigned" | "in_review" | "completed" | "closed";
type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
type Status = TaskStatus | RequestStatus;
type Difficulty = "beginner" | "intermediate" | "advanced" | null;

const STATUS_LABELS: Record<AppLocale, Record<Status, string>> = {
  es: {
    open: "Abierta",
    assigned: "Asignada",
    in_review: "En revisión",
    completed: "Completada",
    closed: "Cerrada",
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    cancelled: "Cancelada",
  },
  en: {
    open: "Open",
    assigned: "Assigned",
    in_review: "In review",
    completed: "Completed",
    closed: "Closed",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  },
};

const DIFFICULTY_LABELS: Record<AppLocale, Record<Exclude<Difficulty, null>, string>> = {
  es: {
    beginner: "Principiante",
    intermediate: "Intermedia",
    advanced: "Avanzada",
  },
  en: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  },
};

const LEVEL_LABELS: Record<AppLocale, Record<UserLevel, string>> = {
  es: {
    beginner: "Principiante",
    junior: "Junior",
    contributor: "Contributor",
    maintainer: "Maintainer",
  },
  en: {
    beginner: "Beginner",
    junior: "Junior",
    contributor: "Contributor",
    maintainer: "Maintainer",
  },
};

const BADGE_COPY: Record<AppLocale, Record<UserBadgeId, { title: string; description: string }>> = {
  es: {
    first_issue_champion: {
      title: "First Issue Champion",
      description: "Completaste tu primera contribución dentro del reto de 7 días.",
    },
    first_request: {
      title: "First Request",
      description: "Has enviado tu primera solicitud de tarea.",
    },
    first_task_assigned: {
      title: "First Task Assigned",
      description: "Ya tienes al menos una tarea asignada.",
    },
    first_pr: {
      title: "First PR",
      description: "Se detectó tu primer Pull Request vinculado.",
    },
    first_merge: {
      title: "First Merge",
      description: "Completaste tu primera tarea con merge.",
    },
    open_source_starter: {
      title: "Open Source Starter",
      description: "Has completado 3 tareas.",
    },
    consistent_contributor: {
      title: "Consistent Contributor",
      description: "Has completado 5 tareas.",
    },
    tasks_10_completed: {
      title: "10 Tasks Completed",
      description: "Has completado 10 tareas.",
    },
    multi_project_contributor: {
      title: "Multi-Project Contributor",
      description: "Has contribuido en 3 proyectos distintos.",
    },
  },
  en: {
    first_issue_champion: {
      title: "First Issue Champion",
      description: "You completed your first contribution within the 7-day challenge.",
    },
    first_request: {
      title: "First Request",
      description: "You have submitted your first task request.",
    },
    first_task_assigned: {
      title: "First Task Assigned",
      description: "You already have at least one assigned task.",
    },
    first_pr: {
      title: "First PR",
      description: "Your first linked Pull Request was detected.",
    },
    first_merge: {
      title: "First Merge",
      description: "You completed your first task with a merge.",
    },
    open_source_starter: {
      title: "Open Source Starter",
      description: "You have completed 3 tasks.",
    },
    consistent_contributor: {
      title: "Consistent Contributor",
      description: "You have completed 5 tasks.",
    },
    tasks_10_completed: {
      title: "10 Tasks Completed",
      description: "You have completed 10 tasks.",
    },
    multi_project_contributor: {
      title: "Multi-Project Contributor",
      description: "You have contributed to 3 different projects.",
    },
  },
};

export function getStatusLabel(status: Status, locale: AppLocale) {
  return STATUS_LABELS[locale][status];
}

export function getDifficultyLabel(difficulty: Difficulty, locale: AppLocale) {
  if (!difficulty) {
    return locale === "en" ? "Not specified" : "No especificada";
  }

  return DIFFICULTY_LABELS[locale][difficulty];
}

export function getLevelLabel(level: UserLevel, locale: AppLocale) {
  return LEVEL_LABELS[locale][level];
}

export function getBadgeCopy(id: UserBadgeId, locale: AppLocale) {
  return BADGE_COPY[locale][id];
}
