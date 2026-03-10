import type { RepositoryRef } from "@/lib/github/repository";

export async function isRepositoryCollaborator(
  installationToken: string,
  repository: RepositoryRef,
  githubUsername: string
) {
  if (!githubUsername?.trim()) {
    return false;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository.owner}/${repository.repo}/collaborators/${encodeURIComponent(
      githubUsername
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${installationToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (response.status === 204) {
    return true;
  }

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Error checking collaborator (${response.status}): ${text || "empty response"}`
    );
  }

  return false;
}

// TODO(next phase): invite collaborator with GitHub App permissions when
// repository policy and permissions are confirmed.
export async function inviteRepositoryCollaboratorPlaceholder() {
  return;
}
