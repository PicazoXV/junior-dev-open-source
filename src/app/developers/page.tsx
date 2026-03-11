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
import { getDevelopersLeaderboard } from "@/lib/developer-stats";
import { getCurrentLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Ranking de developers open source | MiPrimerIssue",
  description:
    "Descubre developers junior activos, sus tareas completadas, PRs mergeados y progreso público dentro de MiPrimerIssue.",
};

export default async function DevelopersPage() {
  const locale = await getCurrentLocale();
  const supabase = await createClient();
  const leaderboard = await getDevelopersLeaderboard(supabase);

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
