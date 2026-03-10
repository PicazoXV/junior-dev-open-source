import Link from "next/link";
import { notFound } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import LevelBadge from "@/components/ui/level-badge";
import AchievementBadge from "@/components/ui/achievement-badge";
import StatCard from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getDeveloperPublicProfile } from "@/lib/developer-stats";
import { getVerifiedContributions } from "@/lib/verified-contributions";

type ShareProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function ShareProfilePage({ params }: ShareProfilePageProps) {
  const locale = await getCurrentLocale();
  const { username } = await params;
  const supabase = await createClient();

  const profile = await getDeveloperPublicProfile(supabase, username);
  if (!profile) {
    notFound();
  }

  const verified = await getVerifiedContributions({
    supabase,
    userId: profile.id,
    limit: 8,
  });

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={profile.fullName || `@${profile.githubUsername}`}
          description={
            locale === "en"
              ? "Shareable developer portfolio from MiPrimerIssue."
              : "Portfolio compartible de developer en MiPrimerIssue."
          }
          actions={
            <Link
              href={`/dev/${profile.githubUsername}`}
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
            >
              {locale === "en" ? "Open public profile" : "Abrir perfil público"}
            </Link>
          }
        />

        <div className="rounded-xl border border-white/15 bg-black/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={profile.level} />
            <span className="text-sm text-gray-300">@{profile.githubUsername}</span>
          </div>
          <p className="mt-2 text-sm text-gray-300">
            {profile.bio ||
              (locale === "en"
                ? "Building real open source experience."
                : "Construyendo experiencia real en open source.")}
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <StatCard label={locale === "en" ? "Completed tasks" : "Tareas completadas"} value={profile.completedTasks} />
          <StatCard label={locale === "en" ? "Merged PRs" : "PRs mergeados"} value={profile.mergedPullRequests} />
          <StatCard label={locale === "en" ? "Contributed projects" : "Proyectos contribuidos"} value={profile.contributedProjects} />
          <StatCard label={locale === "en" ? "Requests sent" : "Solicitudes enviadas"} value={profile.requestsSent} />
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Verified contributions" : "Contribuciones verificadas"}
          description={
            locale === "en"
              ? "Contributions validated through task completion and GitHub sync."
              : "Contribuciones validadas por tareas completadas y sincronización con GitHub."
          }
        />
        {verified.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-sm text-gray-400">
            {locale === "en"
              ? "No verified contributions yet."
              : "Todavía no hay contribuciones verificadas."}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {verified.map((item) => (
              <article key={item.taskId} className="rounded-xl border border-white/15 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">{item.taskTitle}</p>
                <p className="mt-1 text-xs text-gray-400">{item.projectName}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.githubPrUrl ? (
                    <Link
                      href={item.githubPrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 transition hover:border-orange-400"
                    >
                      {locale === "en" ? "View PR" : "Ver PR"}
                    </Link>
                  ) : null}
                  <Link
                    href={`/tasks/${item.taskId}`}
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
                  >
                    {locale === "en" ? "View task" : "Ver tarea"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Badges" : "Badges"}
          description={locale === "en" ? "Unlocked achievements." : "Logros desbloqueados."}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {profile.badges.map((badge) => (
            <AchievementBadge key={badge.id} badge={badge} />
          ))}
        </div>
      </SectionCard>
    </AppLayout>
  );
}
