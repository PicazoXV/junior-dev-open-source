import { githubInstallationRequest } from "@/lib/github/api";
import type { RepositoryRef } from "@/lib/github/repository";

export type GitHubIssue = {
  html_url: string;
  number: number;
};

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
