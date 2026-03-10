import { createSign } from "crypto";
import { getGitHubAppConfig } from "@/lib/github/config";
import type { RepositoryRef } from "@/lib/github/repository";

export type GitHubInstallation = {
  id: number;
  permissions?: Record<string, string>;
  repository_selection?: "all" | "selected";
};

type InstallationTokenResponse = {
  token: string;
  expires_at: string;
};

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createGitHubAppJwt(clockSkewSeconds = 0) {
  const { appId, privateKey } = getGitHubAppConfig();

  const now = Math.floor(Date.now() / 1000) - clockSkewSeconds;
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    // Keep JWT lifetime short to reduce sensitivity to local clock drift.
    iat: now - 60,
    exp: now + 4 * 60,
    iss: appId,
  };

  const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload)
  )}`;

  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(privateKey);
  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

async function githubAppRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const skewAttempts = [0, 120, 300, 600];
  let lastError: Error | null = null;

  for (const skew of skewAttempts) {
    const jwt = createGitHubAppJwt(skew);

    const response = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.headers || {}),
      },
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    const body = await response.text();
    const message = `GitHub App API error (${response.status}) on ${path}: ${
      body || "empty response"
    }`;

    const isClockSkewError =
      response.status === 401 &&
      body.toLowerCase().includes("expiration time") &&
      body.toLowerCase().includes("too far in the future");

    lastError = new Error(message);

    if (!isClockSkewError) {
      break;
    }
  }

  throw lastError || new Error(`Unknown GitHub App API error on ${path}`);
}

export async function getInstallationForRepository(repository: RepositoryRef) {
  return githubAppRequest<GitHubInstallation>(
    `/repos/${repository.owner}/${repository.repo}/installation`
  );
}

export async function getInstallationAccessToken(installationId: number) {
  return githubAppRequest<InstallationTokenResponse>(
    `/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
    }
  );
}

export async function getRepositoryInstallationAccessToken(repository: RepositoryRef) {
  const installation = await getInstallationForRepository(repository);
  const installationToken = await getInstallationAccessToken(installation.id);
  return installationToken.token;
}
