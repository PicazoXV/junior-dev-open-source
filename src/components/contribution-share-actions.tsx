"use client";

import { useMemo, useState } from "react";

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
  const [copied, setCopied] = useState(false);

  const shareText = useMemo(() => {
    const developer = developerUsername ? `@${developerUsername}` : "developer";
    const prText = prNumber ? `PR #${prNumber}` : "PR merged";
    return `🎉 Contribution completed on PrimerIssue. ${taskTitle} · ${prText} in ${projectName}. Developer: ${developer}`;
  }, [developerUsername, prNumber, projectName, taskTitle]);

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
        Share on Twitter
      </a>
      <a
        href={linkedInHref}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
      >
        Share on LinkedIn
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
      >
        {copied ? "Link copiado" : "Copy link"}
      </button>
    </div>
  );
}
