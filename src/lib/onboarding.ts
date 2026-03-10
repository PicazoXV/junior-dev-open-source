import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProgressMetrics } from "@/lib/user-progress";

type MinimalSupabaseClient = SupabaseClient;

export type OnboardingStepId =
  | "complete_profile"
  | "explore_projects"
  | "first_request"
  | "first_pr"
  | "first_contribution";

export type OnboardingStepStatus = "pending" | "in_progress" | "completed";

export type OnboardingStep = {
  id: OnboardingStepId;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  status: OnboardingStepStatus;
};

export type UserOnboardingState = {
  steps: OnboardingStep[];
  completedSteps: number;
  totalSteps: number;
  completionPercent: number;
  isCompleted: boolean;
  nextStep: OnboardingStep | null;
  motivationMessage: string;
};

type UserProfileLite = {
  full_name: string | null;
  bio: string | null;
  tech_stack: string | null;
  location: string | null;
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
    message.includes("github_pr_url") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function getProfileCompletionScore(profile: UserProfileLite | null | undefined) {
  if (!profile) {
    return 0;
  }

  const fields = [profile.full_name, profile.bio, profile.tech_stack, profile.location];
  return fields.filter((field) => typeof field === "string" && field.trim().length > 0).length;
}

async function hasPullRequestSignal(supabase: MinimalSupabaseClient, userId: string) {
  const byNumber = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .not("github_pr_number", "is", null);

  if (!byNumber.error) {
    return (byNumber.count || 0) > 0;
  }

  if (!isMissingColumnError(byNumber.error)) {
    console.error("Error cargando onboarding PR signal:", byNumber.error.message);
    return false;
  }

  const byUrl = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .not("github_pr_url", "is", null);

  if (!byUrl.error) {
    return (byUrl.count || 0) > 0;
  }

  if (!isMissingColumnError(byUrl.error)) {
    console.error("Error cargando onboarding PR signal (url fallback):", byUrl.error.message);
  }

  return false;
}

function deriveStatus(params: {
  completed: boolean;
  inProgress?: boolean;
}): OnboardingStepStatus {
  if (params.completed) {
    return "completed";
  }

  if (params.inProgress) {
    return "in_progress";
  }

  return "pending";
}

export async function getUserOnboardingState(params: {
  supabase: MinimalSupabaseClient;
  userId: string;
  profile: UserProfileLite | null;
  progress: UserProgressMetrics;
}): Promise<UserOnboardingState> {
  const { supabase, userId, profile, progress } = params;

  const profileCompletionScore = getProfileCompletionScore(profile);
  const hasRequestedTask = progress.requestsSent > 0;
  const hasCompletedContribution = progress.completedTasks > 0;
  const hasOpenedPullRequest = await hasPullRequestSignal(supabase, userId);

  // We don't persist explicit "visited project" events yet.
  // A practical proxy is user engagement in requests/assigned work.
  const hasExploredProjects =
    hasRequestedTask || progress.inProgressTasks > 0 || progress.assignedTasks > 0 || hasCompletedContribution;

  const steps: OnboardingStep[] = [
    {
      id: "complete_profile",
      title: "Completa tu perfil",
      description: "Añade nombre, bio, tech stack o ubicación para mejorar tus recomendaciones.",
      href: "/profile/edit",
      ctaLabel: "Completar perfil",
      status: deriveStatus({
        completed: profileCompletionScore >= 2,
        inProgress: profileCompletionScore === 1,
      }),
    },
    {
      id: "explore_projects",
      title: "Explora proyectos",
      description: "Revisa repos activos y encuentra tareas aptas para tu nivel.",
      href: "/good-first-issues",
      ctaLabel: "Explorar tareas",
      status: deriveStatus({
        completed: hasExploredProjects,
      }),
    },
    {
      id: "first_request",
      title: "Solicita tu primera tarea",
      description: "Envía una solicitud para que un maintainer te asigne una tarea.",
      href: "/good-first-issues",
      ctaLabel: "Solicitar tarea",
      status: deriveStatus({
        completed: hasRequestedTask,
      }),
    },
    {
      id: "first_pr",
      title: "Abre tu primer Pull Request",
      description: "Cuando abras tu PR en GitHub, lo detectaremos automáticamente.",
      href: "/dashboard/my-tasks",
      ctaLabel: "Ver mis tareas",
      status: deriveStatus({
        completed: hasOpenedPullRequest,
        inProgress: progress.inProgressTasks > 0 || hasRequestedTask,
      }),
    },
    {
      id: "first_contribution",
      title: "Completa tu primera contribución",
      description: "Haz merge de tu PR y desbloquea tus primeros badges de progreso.",
      href: "/dashboard/my-tasks",
      ctaLabel: "Seguir progreso",
      status: deriveStatus({
        completed: hasCompletedContribution,
        inProgress: hasOpenedPullRequest,
      }),
    },
  ];

  const completedSteps = steps.filter((step) => step.status === "completed").length;
  const totalSteps = steps.length;
  const completionPercent = Math.round((completedSteps / totalSteps) * 100);
  const isCompleted = completedSteps === totalSteps;
  const nextStep = steps.find((step) => step.status !== "completed") || null;

  const motivationMessage = isCompleted
    ? "🎉 Ya has completado tu onboarding en PrimerIssue."
    : completedSteps >= 4
      ? "Estás a un paso de tu primera contribución real."
      : "Empieza hoy y gana experiencia demostrable en open source.";

  return {
    steps,
    completedSteps,
    totalSteps,
    completionPercent,
    isCompleted,
    nextStep,
    motivationMessage,
  };
}
