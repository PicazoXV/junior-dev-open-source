import Link from "next/link";
import SectionCard from "@/components/ui/section-card";
import DifficultyBadge from "@/components/ui/difficulty-badge";
import StatusBadge from "@/components/ui/status-badge";
import GitHubIssueBadge from "@/components/ui/github-issue-badge";
import Badge from "@/components/ui/badge";

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: "open" | "assigned" | "in_review" | "completed" | "closed";
    difficulty: "beginner" | "intermediate" | "advanced" | null;
    github_issue_url?: string | null;
    labels?: string[] | null;
  };
};

function getPreview(text: string | null, maxLength = 140) {
  if (!text) {
    return "Sin descripción disponible.";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <SectionCard className="h-full p-5">
      <h3 className="text-lg font-semibold text-white">{task.title}</h3>

      <p className="mt-2 text-sm text-gray-300">{getPreview(task.description)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status={task.status} />
        <DifficultyBadge difficulty={task.difficulty} />
        <GitHubIssueBadge issueUrl={task.github_issue_url || null} compact />
        {(task.labels || []).slice(0, 3).map((label) => (
          <Badge key={`${task.id}-${label}`}>{label}</Badge>
        ))}
      </div>

      <Link
        href={`/tasks/${task.id}`}
        className="mt-5 inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
      >
        Ver tarea
      </Link>
    </SectionCard>
  );
}
