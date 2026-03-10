import Link from "next/link";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import Badge from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { DEFAULT_TECH_RANKING_TAGS, getTopContributorsByTech } from "@/lib/tech-rankings";

type TechRankingPageProps = {
  searchParams: Promise<{ tech?: string }>;
};

export default async function TechRankingPage({ searchParams }: TechRankingPageProps) {
  const locale = await getCurrentLocale();
  const { tech = DEFAULT_TECH_RANKING_TAGS[0] } = await searchParams;
  const supabase = await createClient();
  const rows = await getTopContributorsByTech({ supabase, tech, limit: 20 });

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Tech rankings" : "Ranking por tecnologías"}
          description={
            locale === "en"
              ? "Top contributors grouped by technology focus."
              : "Top contributors agrupados por enfoque tecnológico."
          }
        />

        <form className="mb-6 flex flex-wrap gap-2">
          {DEFAULT_TECH_RANKING_TAGS.map((tag) => (
            <button
              key={tag}
              type="submit"
              name="tech"
              value={tag}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                tech === tag
                  ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                  : "border-white/20 bg-neutral-900 text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </form>

        {rows.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No data for this technology yet" : "Todavía no hay datos para esta tecnología"}
            description={
              locale === "en"
                ? "Contributors will appear once activity grows in this stack."
                : "Aparecerán contributors cuando crezca la actividad en este stack."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/20 bg-black/20">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-gray-400">
                  <th className="px-4 py-3">Developer</th>
                  <th className="px-4 py-3">{locale === "en" ? "Completed tasks" : "Tareas completadas"}</th>
                  <th className="px-4 py-3">PRs merged</th>
                  <th className="px-4 py-3">{locale === "en" ? "Projects" : "Proyectos"}</th>
                  <th className="px-4 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.userId}-${row.tech}`} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <p className="text-white">
                        #{index + 1} @{row.githubUsername}
                      </p>
                      {row.fullName ? <p className="text-xs text-gray-500">{row.fullName}</p> : null}
                      <div className="mt-1">
                        <Link
                          href={`/dev/${row.githubUsername}`}
                          className="text-xs text-orange-300 hover:underline"
                        >
                          {locale === "en" ? "View profile" : "Ver perfil"}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-200">{row.completedTasks}</td>
                    <td className="px-4 py-3 text-gray-200">{row.mergedPrs}</td>
                    <td className="px-4 py-3 text-gray-200">{row.contributedProjects}</td>
                    <td className="px-4 py-3">
                      <Badge tone="warning">{row.score}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}
