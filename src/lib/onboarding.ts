import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserProgressMetrics } from "@/lib/user-progress";
import type { MessageDictionary } from "@/lib/i18n/types";

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
  const serialized = JSON.stringify(error).toLowerCase();

  return (
    code === "42703" ||
    message.includes("github_pr_number") ||
    message.includes("github_pr_url") ||
    serialized.includes("github_pr_number") ||
    serialized.includes("github_pr_url") ||
    (message.includes("column") && message.includes("does not exist")) ||
    serialized.includes("does not exist") ||
    serialized.includes("could not find the")
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
  // Safe baseline signal that does not depend on optional GitHub PR columns.
  const byStatus = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .in("status", ["in_review", "completed"]);

  if (!byStatus.error && (byStatus.count || 0) > 0) {
    return true;
  }

  const byNumber = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .not("github_pr_number", "is", null);

  if (!byNumber.error) {
    return (byNumber.count || 0) > 0;
  }

  if (!isMissingColumnError(byNumber.error)) {
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
  messages: MessageDictionary;
}): Promise<UserOnboardingState> {
  const { supabase, userId, profile, progress, messages } = params;

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
      title: messages.onboarding.completeProfileTitle,
      description: messages.onboarding.completeProfileDesc,
      href: "/dashboard?editProfile=1",
      ctaLabel: messages.onboarding.completeProfileCta,
      status: deriveStatus({
        completed: profileCompletionScore >= 2,
        inProgress: profileCompletionScore === 1,
      }),
    },
    {
      id: "explore_projects",
      title: messages.onboarding.exploreProjectsTitle,
      description: messages.onboarding.exploreProjectsDesc,
      href: "/buena-primera-issue",
      ctaLabel: messages.onboarding.exploreProjectsCta,
      status: deriveStatus({
        completed: hasExploredProjects,
      }),
    },
    {
      id: "first_request",
      title: messages.onboarding.firstRequestTitle,
      description: messages.onboarding.firstRequestDesc,
      href: "/buena-primera-issue",
      ctaLabel: messages.onboarding.firstRequestCta,
      status: deriveStatus({
        completed: hasRequestedTask,
      }),
    },
    {
      id: "first_pr",
      title: messages.onboarding.firstPrTitle,
      description: messages.onboarding.firstPrDesc,
      href: "/dashboard/my-tasks",
      ctaLabel: messages.onboarding.firstPrCta,
      status: deriveStatus({
        completed: hasOpenedPullRequest,
        inProgress: progress.inProgressTasks > 0 || hasRequestedTask,
      }),
    },
    {
      id: "first_contribution",
      title: messages.onboarding.firstContributionTitle,
      description: messages.onboarding.firstContributionDesc,
      href: "/dashboard/my-tasks",
      ctaLabel: messages.onboarding.firstContributionCta,
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
    ? messages.onboarding.completedMessage
    : completedSteps >= 4
      ? messages.onboarding.almostThereMessage
      : messages.onboarding.startMessage;

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
