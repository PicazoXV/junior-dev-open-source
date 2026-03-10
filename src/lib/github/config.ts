type GitHubAppConfig = {
  appId: string;
  privateKey: string;
  webhookSecret: string | null;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required GitHub env var: ${name}. Configure it to enable GitHub App integration.`
    );
  }

  return value.trim();
}

export function getGitHubAppConfig(): GitHubAppConfig {
  const appId = getRequiredEnv("GITHUB_APP_ID");
  const rawPrivateKey = getRequiredEnv("GITHUB_APP_PRIVATE_KEY");

  return {
    appId,
    privateKey: rawPrivateKey.replace(/\\n/g, "\n"),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET?.trim() || null,
  };
}
