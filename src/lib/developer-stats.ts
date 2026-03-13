import type { SupabaseClient } from "@supabase/supabase-js";
import { getUsersProgressBulk } from "@/lib/user-progress";
import { getUserBadges } from "@/lib/user-badges";

type MinimalSupabaseClient = SupabaseClient;

type ProfileRow = {
  id: string;
  github_username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  tech_stack: string | null;
};

type ContributedProject = {
  id: string;
  slug: string | null;
  name: string | null;
  repo_url: string | null;
};

type AuthUserRow = {
  id: string;
  raw_user_meta_data: Record<string, unknown> | null;
};

export type LeaderboardRow = {
  id: string;
  githubUsername: string;
  fullName: string | null;
  avatarUrl: string | null;
  level: "beginner" | "junior" | "contributor" | "maintainer";
  completedTasks: number;
  mergedPullRequests: number;
  contributedProjects: number;
  badges: string[];
  score: number;
};

export type DeveloperPublicProfile = {
  id: string;
  githubUsername: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  techStack: string | null;
  level: "beginner" | "junior" | "contributor" | "maintainer";
  completedTasks: number;
  inProgressTasks: number;
  contributedProjects: number;
  requestsSent: number;
  mergedPullRequests: number;
  inReviewPullRequests: number;
  badges: ReturnType<typeof getUserBadges>;
  recentActivity: {
    lastCompletedTaskTitle: string | null;
    lastContributedProjectName: string | null;
    lastPullRequestUrl: string | null;
  };
  projects: ContributedProject[];
};

function toPublicUsername(profile: ProfileRow) {
  return profile.github_username || profile.full_name?.toLowerCase().replace(/\s+/g, "-") || "developer";
}

function cleanValue(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickGithubUsernameFromMetadata(metadata: Record<string, unknown> | null) {
  if (!metadata) return null;

  const candidates = [
    metadata.user_name,
    metadata.preferred_username,
    metadata.user_login,
    metadata.login,
  ];

  for (const candidate of candidates) {
    const value = cleanValue(candidate);
    if (value) {
      return value.replace(/^@+/, "");
    }
  }

  return null;
}

export async function getDevelopersLeaderboard(
  supabase: MinimalSupabaseClient
): Promise<LeaderboardRow[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, github_username, full_name, avatar_url, tech_stack")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando leaderboard:", error.message);
    return [];
  }

  const profileRows = (profiles || []) as ProfileRow[];
  const progressByUserId = await getUsersProgressBulk({
    supabase,
    userIds: profileRows.map((profile) => profile.id),
    techStackByUserId: Object.fromEntries(
      profileRows.map((profile) => [profile.id, profile.tech_stack || null])
    ),
  });

  const leaderboard: LeaderboardRow[] = profileRows.map((profile) => {
    const progress = progressByUserId.get(profile.id);
    if (!progress) {
      return {
        id: profile.id,
        githubUsername: toPublicUsername(profile),
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        level: "beginner",
        completedTasks: 0,
        mergedPullRequests: 0,
        contributedProjects: 0,
        badges: [],
        score: 0,
      };
    }

    const score =
      progress.completedTasks * 5 +
      progress.mergedPullRequests * 4 +
      progress.contributedProjects * 3 +
      progress.inReviewPullRequests;

    const visualBadges: string[] = [];
    if (progress.completedTasks >= 10 || progress.mergedPullRequests >= 8) {
      visualBadges.push("Top contributor");
    }
    if (progress.level === "junior" || progress.level === "beginner") {
      visualBadges.push("Rising developer");
    }
    if (progress.inProgressTasks > 0 || progress.inReviewPullRequests > 0) {
      visualBadges.push("Active this week");
    }

    return {
      id: profile.id,
      githubUsername: toPublicUsername(profile),
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      level: progress.level,
      completedTasks: progress.completedTasks,
      mergedPullRequests: progress.mergedPullRequests,
      contributedProjects: progress.contributedProjects,
      badges: visualBadges,
      score,
    };
  });

  return leaderboard.sort((a, b) => b.score - a.score);
}

export async function getDeveloperPublicProfile(
  supabase: MinimalSupabaseClient,
  username: string
): Promise<DeveloperPublicProfile | null> {
  const sanitizedUsername = username.trim().toLowerCase();
  if (!sanitizedUsername) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, github_username, full_name, avatar_url, bio, location, tech_stack")
    .ilike("github_username", sanitizedUsername)
    .maybeSingle();
  let typedProfile: ProfileRow | null = null;

  if (!error && profile) {
    typedProfile = profile as ProfileRow;
  } else {
    try {
      const { data: authUsers, error: authUsersError } = await supabase
        .schema("auth")
        .from("users")
        .select("id, raw_user_meta_data")
        .limit(1000);

      if (!authUsersError) {
        const authRows = (authUsers || []) as AuthUserRow[];
        const matched = authRows.find((row) => {
          const githubUsername = pickGithubUsernameFromMetadata(row.raw_user_meta_data);
          return githubUsername?.toLowerCase() === sanitizedUsername;
        });

        if (matched) {
          typedProfile = {
            id: matched.id,
            github_username: pickGithubUsernameFromMetadata(matched.raw_user_meta_data),
            full_name:
              cleanValue(matched.raw_user_meta_data?.full_name) ||
              cleanValue(matched.raw_user_meta_data?.name),
            avatar_url:
              cleanValue(matched.raw_user_meta_data?.avatar_url) ||
              cleanValue(matched.raw_user_meta_data?.picture),
            bio: null,
            location: null,
            tech_stack: null,
          };
        }
      }
    } catch {}
  }

  if (!typedProfile) {
    return null;
  }
  const progressByUserId = await getUsersProgressBulk({
    supabase,
    userIds: [typedProfile.id],
    techStackByUserId: {
      [typedProfile.id]: typedProfile.tech_stack || null,
    },
  });
  const progress = progressByUserId.get(typedProfile.id);

  if (!progress) return null;

  const badges = getUserBadges(progress);

  const { data: contributedTasks } = await supabase
    .from("tasks")
    .select("project_id")
    .eq("assigned_to", typedProfile.id)
    .in("status", ["assigned", "in_review", "completed", "closed"]);

  const projectIds = [
    ...new Set(
      (contributedTasks || [])
        .map((task) => task.project_id)
        .filter((projectId): projectId is string => typeof projectId === "string")
    ),
  ];

  const { data: projects } =
    projectIds.length > 0
      ? await supabase
          .from("projects")
          .select("id, slug, name, repo_url")
          .in("id", projectIds)
      : { data: [] };

  return {
    id: typedProfile.id,
    githubUsername: toPublicUsername(typedProfile),
    fullName: typedProfile.full_name,
    avatarUrl: typedProfile.avatar_url,
    bio: typedProfile.bio,
    location: typedProfile.location,
    techStack: typedProfile.tech_stack,
    level: progress.level,
    completedTasks: progress.completedTasks,
    inProgressTasks: progress.inProgressTasks,
    contributedProjects: progress.contributedProjects,
    requestsSent: progress.requestsSent,
    mergedPullRequests: progress.mergedPullRequests,
    inReviewPullRequests: progress.inReviewPullRequests,
    badges,
    recentActivity: progress.recentActivity,
    projects: (projects || []) as ContributedProject[],
  };
}
