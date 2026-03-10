import { parseRepositoryFromUrl } from "@/lib/github/repository";

type BuildTaskIssueDraftInput = {
  projectRepoUrl: string | null;
  taskTitle: string | null;
  taskDescription: string | null;
  existingIssueUrl: string | null;
};

export type TaskIssueDraft = {
  ready: boolean;
  reason: "already_has_issue" | "missing_repo_url" | "invalid_repo_url" | "ready";
  repository: { owner: string; repo: string } | null;
  issueTitle: string | null;
  issueBody: string | null;
  existingIssueUrl: string | null;
};

export function buildTaskIssueDraft({
  projectRepoUrl,
  taskTitle,
  taskDescription,
  existingIssueUrl,
}: BuildTaskIssueDraftInput): TaskIssueDraft {
  if (existingIssueUrl) {
    return {
      ready: false,
      reason: "already_has_issue",
      repository: null,
      issueTitle: null,
      issueBody: null,
      existingIssueUrl,
    };
  }

  if (!projectRepoUrl) {
    return {
      ready: false,
      reason: "missing_repo_url",
      repository: null,
      issueTitle: null,
      issueBody: null,
      existingIssueUrl: null,
    };
  }

  const repository = parseRepositoryFromUrl(projectRepoUrl);

  if (!repository) {
    return {
      ready: false,
      reason: "invalid_repo_url",
      repository: null,
      issueTitle: null,
      issueBody: null,
      existingIssueUrl: null,
    };
  }

  return {
    ready: true,
    reason: "ready",
    repository,
    issueTitle: taskTitle?.trim() || "Nueva tarea asignada",
    issueBody: taskDescription?.trim() || "Sin descripción proporcionada en la plataforma.",
    existingIssueUrl: null,
  };
}
