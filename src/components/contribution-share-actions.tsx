"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";

type ContributionShareActionsProps = {
  contributionUrl: string;
  projectName: string;
  taskTitle: string;
  prNumber?: number | null;
  developerUsername?: string | null;
};

export default function ContributionShareActions({
  contributionUrl,
  projectName,
  taskTitle,
  prNumber,
  developerUsername,
}: ContributionShareActionsProps) {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);

  const shareText = useMemo(() => {
    const developer = developerUsername
      ? `@${developerUsername}`
      : locale === "en"
        ? "developer"
        : "developer";
    const prText = prNumber
      ? `PR #${prNumber}`
      : locale === "en"
        ? "PR merged"
        : "PR mergeado";
    return locale === "en"
      ? `🎉 Contribution completed on MiPrimerIssue. ${taskTitle} · ${prText} in ${projectName}. Developer: ${developer}`
      : `🎉 Contribución completada en MiPrimerIssue. ${taskTitle} · ${prText} en ${projectName}. Developer: ${developer}`;
  }, [developerUsername, locale, prNumber, projectName, taskTitle]);

  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(contributionUrl);

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contributionUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a
        href={twitterHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
      >
        {locale === "en" ? "Share on Twitter" : "Compartir en Twitter"}
      </a>
      <a
        href={linkedInHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
      >
        {locale === "en" ? "Share on LinkedIn" : "Compartir en LinkedIn"}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
      >
        {copied ? (locale === "en" ? "Link copied" : "Link copiado") : locale === "en" ? "Copy link" : "Copiar link"}
      </button>
    </div>
  );
}
