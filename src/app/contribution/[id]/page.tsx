import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import Badge from "@/components/ui/badge";
import GitHubIssueBadge from "@/components/ui/github-issue-badge";
import ContributionShareActions from "@/components/contribution-share-actions";
import { getContributionByTaskId } from "@/lib/contributions";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getBadgeCopy } from "@/lib/i18n/labels";

type ContributionPageProps = {
  params: Promise<{ id: string }>;
};

function getBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "https://www.primerissue.dev";
}

export default async function ContributionPage({ params }: ContributionPageProps) {
  const locale = await getCurrentLocale();
  const { id } = await params;

  if (!id || typeof id !== "string") {
    notFound();
  }

  const supabase = await createClient();
  const contribution = await getContributionByTaskId(supabase, id);

  if (!contribution || contribution.taskStatus !== "completed") {
    notFound();
  }

  const contributionUrl = `${getBaseUrl()}/contribution/${contribution.id}`;

  return (
    <AppLayout containerClassName="mx-auto max-w-4xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Contribution completed" : "Contribución completada"}
          description={
            locale === "en"
              ? "Share this milestone and showcase your open source progress in PrimerIssue."
              : "Comparte este hito y enseña tu progreso open source en PrimerIssue."
          }
          actions={
            contribution.projectSlug ? (
              <Link
                href={`/projects/${contribution.projectSlug}`}
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
              >
                {locale === "en" ? "View project" : "Ver proyecto"}
              </Link>
            ) : null
          }
        />

        <div className="rounded-2xl border border-white/20 bg-black/20 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-orange-300">
            {locale === "en" ? "PrimerIssue Contribution" : "Contribución de PrimerIssue"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{contribution.taskTitle}</h2>
          <p className="mt-2 text-sm text-gray-300">
            {locale === "en" ? "PR merged in" : "PR mergeado en"}{" "}
            <span className="text-white">{contribution.projectName}</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="success">
              {locale === "en" ? "🎉 Contribution completed" : "🎉 Contribución completada"}
            </Badge>
            {contribution.githubPrNumber ? (
              <Badge tone="info">
                {locale === "en" ? "PR merged" : "PR mergeado"}: #{contribution.githubPrNumber}
              </Badge>
            ) : null}
            <GitHubIssueBadge issueUrl={contribution.githubIssueUrl} compact />
            {contribution.highlightedBadge ? (
              <Badge tone="warning">
                {locale === "en" ? "Badge earned" : "Badge conseguido"}:{" "}
                {getBadgeCopy(contribution.highlightedBadge.id, locale).title}
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 space-y-1 text-sm text-gray-300">
            <p>
              <span className="text-gray-400">{locale === "en" ? "Developer" : "Developer"}:</span>{" "}
                {contribution.developerGithubUsername
                  ? `@${contribution.developerGithubUsername}`
                  : contribution.developerName || (locale === "en" ? "Developer" : "Developer")}
            </p>
            <p>
              <span className="text-gray-400">{locale === "en" ? "Platform" : "Plataforma"}:</span> PrimerIssue · primerissue.dev
            </p>
          </div>

          <ContributionShareActions
            contributionUrl={contributionUrl}
            projectName={contribution.projectName}
            taskTitle={contribution.taskTitle}
            prNumber={contribution.githubPrNumber}
            developerUsername={contribution.developerGithubUsername}
          />

          <div className="mt-5 flex flex-wrap gap-2">
            {contribution.githubPrUrl ? (
              <Link
                href={contribution.githubPrUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
              >
                {locale === "en" ? "View PR on GitHub" : "Ver PR en GitHub"}
              </Link>
            ) : null}
            {contribution.githubIssueUrl ? (
              <Link
                href={contribution.githubIssueUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
              >
                {locale === "en" ? "View issue on GitHub" : "Ver issue en GitHub"}
              </Link>
            ) : null}
            {contribution.projectRepoUrl ? (
              <Link
                href={contribution.projectRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
              >
                {locale === "en" ? "Project repository" : "Repo del proyecto"}
              </Link>
            ) : null}
          </div>
        </div>
      </SectionCard>
    </AppLayout>
  );
}
