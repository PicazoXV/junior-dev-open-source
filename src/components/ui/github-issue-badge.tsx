import Badge from "@/components/ui/badge";

type GitHubIssueBadgeProps = {
  issueUrl: string | null;
  compact?: boolean;
};

export default function GitHubIssueBadge({ issueUrl, compact = false }: GitHubIssueBadgeProps) {
  if (issueUrl) {
    return <Badge tone="success">{compact ? "Issue creado" : "GitHub conectado"}</Badge>;
  }

  return <Badge tone="default">{compact ? "Sin issue" : "Sin integración GitHub"}</Badge>;
}
