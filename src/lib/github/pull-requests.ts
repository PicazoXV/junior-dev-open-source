import type { RepositoryRef } from "@/lib/github/repository";

export type TaskPullRequestReference = {
  taskId: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  repository: RepositoryRef;
};

// TODO(next phase): persist PR references in DB and link them to tasks.
export async function linkPullRequestToTaskPlaceholder(
  _reference: TaskPullRequestReference
) {
  void _reference;
  return;
}

// TODO(next phase): sync PR status to task status (in_review/completed).
export async function syncPullRequestStatusPlaceholder() {
  return;
}
