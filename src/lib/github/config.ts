import { createPrivateKey } from "crypto";

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

function normalizeGitHubPrivateKey(rawPrivateKey: string) {
  let normalized = rawPrivateKey
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .replace(/\\\\n/g, "\n")
    .replace(/\r/g, "")
    .replace(/\\n/g, "\n");

  // Some dashboards collapse multiline PEM to a single line with spaces.
  if (
    normalized.includes("BEGIN") &&
    normalized.includes("PRIVATE KEY") &&
    normalized.includes("END") &&
    !normalized.includes("\n")
  ) {
    normalized = normalized
      .replace(/-----BEGIN [^-]+-----\s*/i, (m) => `${m.trim()}\n`)
      .replace(/\s*-----END [^-]+-----/i, (m) => `\n${m.trim()}`)
      .replace(/\s{2,}/g, "\n");
  }

  return normalized;
}

function rebuildPemIfPossible(candidate: string) {
  const pemMatch = candidate.match(
    /-----BEGIN ([A-Z ]+?)-----([\s\S]*?)-----END \1-----/m
  );

  if (!pemMatch) {
    return candidate;
  }

  const label = pemMatch[1];
  const body = pemMatch[2].replace(/[^A-Za-z0-9+/=]/g, "");
  const wrappedBody = body.match(/.{1,64}/g)?.join("\n") ?? body;

  return `-----BEGIN ${label}-----\n${wrappedBody}\n-----END ${label}-----`;
}

function buildPrivateKeyCandidates(rawPrivateKey: string) {
  const candidates = new Set<string>();
  const normalized = normalizeGitHubPrivateKey(rawPrivateKey);
  candidates.add(rebuildPemIfPossible(normalized));

  if (normalized.includes("\\n")) {
    candidates.add(rebuildPemIfPossible(normalized.replace(/\\n/g, "\n")));
  }

  if (normalized.includes("\\\\n")) {
    candidates.add(rebuildPemIfPossible(normalized.replace(/\\\\n/g, "\n")));
  }

  if (
    !normalized.includes("BEGIN") &&
    /^[A-Za-z0-9+/=\s]+$/.test(normalized)
  ) {
    try {
      const decoded = Buffer.from(normalized.replace(/\s+/g, ""), "base64").toString("utf8");
      if (decoded.includes("BEGIN") && decoded.includes("PRIVATE KEY")) {
        candidates.add(rebuildPemIfPossible(normalizeGitHubPrivateKey(decoded)));
      }
    } catch {}
  }

  return [...candidates];
}

function resolveGitHubPrivateKey(rawPrivateKey: string) {
  const candidates = buildPrivateKeyCandidates(rawPrivateKey);

  for (const candidate of candidates) {
    try {
      createPrivateKey(candidate);
      return candidate;
    } catch {}
  }

  throw new Error(
    "Failed to parse private key. Re-generate the GitHub App private key and paste the full PEM in GITHUB_APP_PRIVATE_KEY."
  );
}

export function getGitHubAppConfig(): GitHubAppConfig {
  const appId = getRequiredEnv("GITHUB_APP_ID");
  const rawPrivateKey = getRequiredEnv("GITHUB_APP_PRIVATE_KEY");

  return {
    appId,
    privateKey: resolveGitHubPrivateKey(rawPrivateKey),
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET?.trim() || null,
  };
}
