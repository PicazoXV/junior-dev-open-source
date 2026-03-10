import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserProgress } from "@/lib/user-progress";

type MinimalSupabaseClient = SupabaseClient;

export type TechRankingRow = {
  userId: string;
  githubUsername: string;
  fullName: string | null;
  tech: string;
  completedTasks: number;
  mergedPrs: number;
  contributedProjects: number;
  score: number;
};

export async function getTopContributorsByTech(params: {
  supabase: MinimalSupabaseClient;
  tech: string;
  limit?: number;
}) {
  const { supabase, tech, limit = 10 } = params;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, github_username, full_name, tech_stack")
    .ilike("tech_stack", `%${tech}%`)
    .limit(200);

  if (error) {
    console.error("Error loading tech ranking profiles:", error.message);
    return [] as TechRankingRow[];
  }

  const rows: TechRankingRow[] = [];

  for (const profile of profiles || []) {
    const progress = await getUserProgress(supabase, profile.id, profile.tech_stack || null);
    const score =
      progress.completedTasks * 5 + progress.mergedPullRequests * 4 + progress.contributedProjects * 3;

    rows.push({
      userId: profile.id,
      githubUsername: profile.github_username || "developer",
      fullName: profile.full_name || null,
      tech,
      completedTasks: progress.completedTasks,
      mergedPrs: progress.mergedPullRequests,
      contributedProjects: progress.contributedProjects,
      score,
    });
  }

  return rows.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const DEFAULT_TECH_RANKING_TAGS = [
  "React",
  "TypeScript",
  "Python",
  "Docs",
  "Backend",
];
