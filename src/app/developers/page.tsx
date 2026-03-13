import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PublicLayout from "@/components/layout/public-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import LevelBadge from "@/components/ui/level-badge";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Table from "@/components/ui/table";
import { getDevelopersLeaderboard, type LeaderboardRow } from "@/lib/developer-stats";
import { getCurrentLocale } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Ranking de developers open source | MiPrimerIssue",
  description:
    "Descubre developers junior activos, sus tareas completadas, PRs mergeados y progreso público dentro de MiPrimerIssue.",
};

type AuthUserRow = {
  id: string;
  email: string | null;
  created_at: string | null;
  raw_user_meta_data: Record<string, unknown> | null;
  raw_app_meta_data: Record<string, unknown> | null;
};

function cleanValue(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickGithubUsername(row: AuthUserRow) {
  const metadata = row.raw_user_meta_data || {};
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

function isGithubRegistered(row: AuthUserRow) {
  const appMeta = row.raw_app_meta_data || {};
  const providers = Array.isArray(appMeta.providers) ? appMeta.providers : [];
  const provider = cleanValue(appMeta.provider);
  const username = pickGithubUsername(row);

  if (provider === "github") return true;
  if (providers.some((value) => cleanValue(value) === "github")) return true;
  return !!username;
}

function withRegisteredUsers(
  leaderboard: LeaderboardRow[],
  authUsers: AuthUserRow[]
) {
  const mergedMap = new Map(leaderboard.map((row) => [row.id, row]));
  const createdAtById = new Map<string, string | null>();

  for (const authUser of authUsers) {
    createdAtById.set(authUser.id, authUser.created_at);
    if (!isGithubRegistered(authUser)) continue;

    const githubUsername = pickGithubUsername(authUser);
    if (!githubUsername) continue;

    const existing = mergedMap.get(authUser.id);
    if (existing) {
      mergedMap.set(authUser.id, {
        ...existing,
        githubUsername: existing.githubUsername || githubUsername,
        fullName:
          existing.fullName ||
          cleanValue(authUser.raw_user_meta_data?.full_name) ||
          cleanValue(authUser.raw_user_meta_data?.name),
        avatarUrl:
          existing.avatarUrl ||
          cleanValue(authUser.raw_user_meta_data?.avatar_url) ||
          cleanValue(authUser.raw_user_meta_data?.picture),
      });
      continue;
    }

    mergedMap.set(authUser.id, {
      id: authUser.id,
      githubUsername,
      fullName:
        cleanValue(authUser.raw_user_meta_data?.full_name) ||
        cleanValue(authUser.raw_user_meta_data?.name),
      avatarUrl:
        cleanValue(authUser.raw_user_meta_data?.avatar_url) ||
        cleanValue(authUser.raw_user_meta_data?.picture),
      level: "beginner",
      completedTasks: 0,
      mergedPullRequests: 0,
      contributedProjects: 0,
      badges: [],
      score: 0,
    });
  }

  const rows = [...mergedMap.values()];
  rows.sort((a, b) => {
    const aActivity = a.completedTasks + a.mergedPullRequests + a.contributedProjects;
    const bActivity = b.completedTasks + b.mergedPullRequests + b.contributedProjects;

    if (aActivity === 0 && bActivity > 0) return 1;
    if (bActivity === 0 && aActivity > 0) return -1;
    if (b.score !== a.score) return b.score - a.score;

    const aCreatedAt = createdAtById.get(a.id);
    const bCreatedAt = createdAtById.get(b.id);
    if (aCreatedAt && bCreatedAt) {
      return new Date(bCreatedAt).getTime() - new Date(aCreatedAt).getTime();
    }

    return a.githubUsername.localeCompare(b.githubUsername);
  });

  return rows;
}

export default async function DevelopersPage() {
  const locale = await getCurrentLocale();
  let supabase = await createClient();
  let adminClient: ReturnType<typeof createAdminClient> | null = null;

  try {
    adminClient = createAdminClient();
    supabase = adminClient;
  } catch (error) {
    console.warn(
      "No se pudo usar cliente admin para leaderboard de developers, usando cliente público.",
      error instanceof Error ? error.message : String(error)
    );
  }

  const rawLeaderboard = await getDevelopersLeaderboard(supabase);
  let leaderboard = rawLeaderboard;

  if (adminClient) {
    const { data: authUsers, error } = await adminClient
      .schema("auth")
      .from("users")
      .select("id, email, created_at, raw_user_meta_data, raw_app_meta_data")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando usuarios auth para developers:", error.message);
    } else {
      leaderboard = withRegisteredUsers(rawLeaderboard, (authUsers || []) as AuthUserRow[]);
    }
  }

  return (
    <PublicLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard variant="hero" className="p-8">
        <PageHeader
          title={locale === "en" ? "Developers leaderboard" : "Leaderboard de developers"}
          description={
            locale === "en"
              ? "Public ranking based on completed tasks, merged PRs, and contributed projects."
              : "Ranking público basado en tareas completadas, PRs merged y proyectos contribuidos."
          }
        />

        {leaderboard.length === 0 ? (
          <EmptyState
            title={
              locale === "en"
                ? "There are no developers in the leaderboard yet"
                : "Aún no hay developers en el leaderboard"
            }
            description={
              locale === "en"
                ? "When there is activity in the platform, the ranking will appear here."
                : "Cuando haya actividad en la plataforma, el ranking aparecerá aquí."
            }
          />
        ) : (
          <Table className="rounded-xl">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-400">
                <th className="px-4 py-3">{locale === "en" ? "Developer" : "Developer"}</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3">PRs merged</th>
                <th className="px-4 py-3">{locale === "en" ? "Projects" : "Proyectos"}</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Badges</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((developer, index) => (
                <tr key={developer.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white">
                        #{index + 1} @{developer.githubUsername}
                      </p>
                      <p className="text-xs text-gray-500">
                        {developer.fullName || (locale === "en" ? "Developer on MiPrimerIssue" : "Developer en MiPrimerIssue")}
                      </p>
                      <Link
                        href={`/dev/${developer.githubUsername}`}
                        className="mt-1 inline-flex text-xs text-orange-300 hover:underline"
                      >
                        {locale === "en" ? "View public profile" : "Ver perfil público"}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-200">{developer.completedTasks}</td>
                  <td className="px-4 py-3 text-gray-200">{developer.mergedPullRequests}</td>
                  <td className="px-4 py-3 text-gray-200">{developer.contributedProjects}</td>
                  <td className="px-4 py-3">
                    <LevelBadge level={developer.level} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {developer.badges.map((badge) => (
                        <Badge key={`${developer.id}-${badge}`} tone="warning">
                          {badge}
                        </Badge>
                      ))}
                      {developer.badges.length === 0 ? (
                        <span className="text-xs text-gray-500">
                          {locale === "en" ? "No badges yet" : "Sin badges por ahora"}
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </SectionCard>
    </PublicLayout>
  );
}
