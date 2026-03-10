import { githubInstallationRequest } from "@/lib/github/api";
import { getRepositoryInstallationAccessToken } from "@/lib/github/app-auth";
import type { RepositoryRef } from "@/lib/github/repository";

type PullRequestTimelineEvent = {
  event?: string;
  source?: {
    issue?: {
      number?: number;
    };
  };
};

function getUniqueNumbers(input: number[]) {
  return [...new Set(input.filter((value) => Number.isInteger(value) && value > 0))];
}

export function extractIssueNumbersFromText(text: string | null | undefined) {
  if (!text) {
    return [];
  }

  const matches = text.match(/#(\d+)/g) || [];
  const numbers = matches
    .map((raw) => Number(raw.replace("#", "")))
    .filter((value) => Number.isInteger(value) && value > 0);

  return getUniqueNumbers(numbers);
}

export function extractIssueNumbersFromPullRequest(title: string | null, body: string | null) {
  return getUniqueNumbers([
    ...extractIssueNumbersFromText(title),
    ...extractIssueNumbersFromText(body),
  ]);
}

export async function getLinkedIssueNumbersForPullRequest(
  repository: RepositoryRef,
  pullRequestNumber: number
) {
  const installationToken = await getRepositoryInstallationAccessToken(repository);

  const timeline = await githubInstallationRequest<PullRequestTimelineEvent[]>(
    installationToken,
    `/repos/${repository.owner}/${repository.repo}/issues/${pullRequestNumber}/timeline`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
    }
  );

  const numbers = timeline
    .map((event) => event.source?.issue?.number)
    .filter((value): value is number => typeof value === "number" && Number.isInteger(value) && value > 0);

  return getUniqueNumbers(numbers);
}

export type PullRequestSyncPoint = {
  taskId: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  repository: RepositoryRef;
};

// TODO(next phase): persist PR references in a dedicated table for history.
export async function linkPullRequestToTaskPlaceholder(point: PullRequestSyncPoint) {
  void point;
  return;
}

// TODO(next phase): consume PR events to orchestrate deeper task workflows.
export async function syncPullRequestStatusPlaceholder() {
  return;
}
