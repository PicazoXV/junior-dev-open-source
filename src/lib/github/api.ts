type GitHubErrorBody = {
  message?: string;
  documentation_url?: string;
};

export async function githubInstallationRequest<T>(
  installationToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${installationToken}`,
      "User-Agent": "MiPrimerIssue-GitHubIntegration/1.0",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `GitHub installation API error (${response.status}) on ${path}`;

    try {
      const body = (await response.json()) as GitHubErrorBody;
      if (body.message) {
        message = `${message}: ${body.message}`;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = `${message}: ${text}`;
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
