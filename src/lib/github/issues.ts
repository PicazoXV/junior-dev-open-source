import { githubInstallationRequest } from "@/lib/github/api";
import type { RepositoryRef } from "@/lib/github/repository";

export type GitHubIssue = {
  html_url: string;
  number: number;
};

export function getIssueNumberFromUrl(issueUrl: string | null | undefined) {
  if (!issueUrl) {
    return null;
  }

  const match = issueUrl.match(/\/issues\/(\d+)(?:$|[?#])/);
  if (!match) {
    return null;
  }

  const issueNumber = Number(match[1]);
  return Number.isInteger(issueNumber) && issueNumber > 0 ? issueNumber : null;
}

export async function createRepositoryIssue(
  installationToken: string,
  repository: RepositoryRef,
  payload: { title: string; body: string }
) {
  return githubInstallationRequest<GitHubIssue>(
    installationToken,
    `/repos/${repository.owner}/${repository.repo}/issues`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export async function createIssueComment(
  installationToken: string,
  repository: RepositoryRef,
  issueNumber: number,
  body: string
) {
  return githubInstallationRequest<{ id: number; html_url: string }>(
    installationToken,
    `/repos/${repository.owner}/${repository.repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    }
  );
}
