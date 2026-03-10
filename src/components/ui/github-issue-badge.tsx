"use client";

import Badge from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/client";

type GitHubIssueBadgeProps = {
  issueUrl: string | null;
  compact?: boolean;
};

export default function GitHubIssueBadge({ issueUrl, compact = false }: GitHubIssueBadgeProps) {
  const { locale } = useI18n();

  if (issueUrl) {
    return (
      <Badge tone="success">
        {compact
          ? locale === "en"
            ? "Issue created"
            : "Issue creado"
          : locale === "en"
            ? "GitHub connected"
            : "GitHub conectado"}
      </Badge>
    );
  }

  return (
    <Badge tone="default">
      {compact
        ? locale === "en"
          ? "No issue"
          : "Sin issue"
        : locale === "en"
          ? "No GitHub integration"
          : "Sin integración GitHub"}
    </Badge>
  );
}
