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

type InvitationApiResponse = {
  id?: number;
  message?: string;
};

export type InviteRepositoryCollaboratorResult =
  | { status: "invited"; invitationId: number | null }
  | { status: "already_collaborator"; invitationId: null };

export async function inviteRepositoryCollaborator(
  installationToken: string,
  repository: RepositoryRef,
  githubUsername: string
): Promise<InviteRepositoryCollaboratorResult> {
  if (!githubUsername?.trim()) {
    throw new Error("github_username_missing");
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository.owner}/${repository.repo}/collaborators/${encodeURIComponent(
      githubUsername
    )}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${installationToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        permission: "push",
      }),
    }
  );

  if (response.status === 201) {
    const body = (await response.json().catch(() => ({}))) as InvitationApiResponse;
    return {
      status: "invited",
      invitationId: typeof body.id === "number" ? body.id : null,
    };
  }

  if (response.status === 204) {
    return {
      status: "already_collaborator",
      invitationId: null,
    };
  }

  const errorPayload = (await response.json().catch(() => ({}))) as InvitationApiResponse;
  const errorMessage = (errorPayload.message || "").toLowerCase();

  if (response.status === 422 && errorMessage.includes("already a collaborator")) {
    return {
      status: "already_collaborator",
      invitationId: null,
    };
  }

  if (response.status === 422 && errorMessage.includes("already has a pending invitation")) {
    return {
      status: "invited",
      invitationId: null,
    };
  }

  throw new Error(
    `Error inviting collaborator (${response.status}): ${errorPayload.message || "empty response"}`
  );
}
