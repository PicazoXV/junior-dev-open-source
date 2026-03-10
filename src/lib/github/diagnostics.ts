import { createGitHubAppJwt, getInstallationForRepository, getRepositoryInstallationAccessToken } from "@/lib/github/app-auth";
import { getGitHubAppConfig } from "@/lib/github/config";
import { githubInstallationRequest } from "@/lib/github/api";
import { createRepositoryIssue } from "@/lib/github/issues";
import { parseRepositoryFromUrl } from "@/lib/github/repository";

export const GITHUB_TEST_REPOSITORY_URL = "https://github.com/PicazoXV/Tic-Tac-Toe-Responsive";

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export type GitHubDiagnosticReport = {
  repoUrl: string;
  env: {
    appIdConfigured: boolean;
    privateKeyConfigured: boolean;
    webhookSecretConfigured: boolean;
  };
  repository: {
    parsed: boolean;
    owner: string | null;
    repo: string | null;
    error: string | null;
  };
  auth: {
    jwtGenerated: boolean;
    error: string | null;
  };
  installation: {
    resolved: boolean;
    installationId: number | null;
    repositorySelection: "all" | "selected" | null;
    permissions: Record<string, string> | null;
    error: string | null;
  };
  token: {
    resolved: boolean;
    error: string | null;
  };
  repositoryAccess: {
    ok: boolean;
    error: string | null;
  };
  success: boolean;
};

export async function runGitHubAppDiagnostics(
  repoUrl: string
): Promise<GitHubDiagnosticReport> {
  const trimmedRepoUrl = repoUrl.trim();

  const env = {
    appIdConfigured: !!process.env.GITHUB_APP_ID?.trim(),
    privateKeyConfigured: !!process.env.GITHUB_APP_PRIVATE_KEY?.trim(),
    webhookSecretConfigured: !!process.env.GITHUB_WEBHOOK_SECRET?.trim(),
  };

  const repository = parseRepositoryFromUrl(trimmedRepoUrl);

  const report: GitHubDiagnosticReport = {
    repoUrl: trimmedRepoUrl,
    env,
    repository: {
      parsed: !!repository,
      owner: repository?.owner || null,
      repo: repository?.repo || null,
      error: repository ? null : "No se pudo extraer owner/repo desde repo_url",
    },
    auth: {
      jwtGenerated: false,
      error: null,
    },
    installation: {
      resolved: false,
      installationId: null,
      repositorySelection: null,
      permissions: null,
      error: null,
    },
    token: {
      resolved: false,
      error: null,
    },
    repositoryAccess: {
      ok: false,
      error: null,
    },
    success: false,
  };

  if (!repository) {
    return report;
  }

  try {
    getGitHubAppConfig();
    createGitHubAppJwt();
    report.auth.jwtGenerated = true;
  } catch (error) {
    report.auth.error = toErrorMessage(error);
    return report;
  }

  let installationId: number | null = null;
  let installationToken: string | null = null;

  try {
    const installation = await getInstallationForRepository(repository);
    installationId = installation.id;
    report.installation = {
      resolved: true,
      installationId: installation.id,
      repositorySelection: installation.repository_selection || null,
      permissions: installation.permissions || null,
      error: null,
    };
  } catch (error) {
    report.installation.error = toErrorMessage(error);
    return report;
  }

  try {
    installationToken = await getRepositoryInstallationAccessToken(repository);
    report.token.resolved = true;
  } catch (error) {
    report.token.error = toErrorMessage(error);
    return report;
  }

  if (!installationToken || !installationId) {
    return report;
  }

  try {
    await githubInstallationRequest<{ id: number }>(
      installationToken,
      `/repos/${repository.owner}/${repository.repo}`
    );
    report.repositoryAccess.ok = true;
  } catch (error) {
    report.repositoryAccess.error = toErrorMessage(error);
    return report;
  }

  report.success = true;
  return report;
}

export async function createDevelopmentIssueForRepository(params: {
  repoUrl: string;
  title: string;
  body: string;
}) {
  const repository = parseRepositoryFromUrl(params.repoUrl);

  if (!repository) {
    throw new Error("Repo URL inválida para crear issue de prueba.");
  }

  const installationToken = await getRepositoryInstallationAccessToken(repository);
  return createRepositoryIssue(installationToken, repository, {
    title: params.title,
    body: params.body,
  });
}
