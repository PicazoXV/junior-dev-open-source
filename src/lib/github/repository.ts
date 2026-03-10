export type RepositoryRef = {
  owner: string;
  repo: string;
};

function normalizeRepositoryParts(owner: string, repo: string): RepositoryRef | null {
  const normalizedOwner = owner.trim();
  const normalizedRepo = repo.trim().replace(/\.git$/i, "");

  if (!normalizedOwner || !normalizedRepo) {
    return null;
  }

  return { owner: normalizedOwner, repo: normalizedRepo };
}

export function parseRepositoryFromUrl(repoUrl: string): RepositoryRef | null {
  const raw = repoUrl.trim();
  if (!raw) {
    return null;
  }

  const sshPattern = /^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/i;
  const sshMatch = raw.match(sshPattern);
  if (sshMatch) {
    return normalizeRepositoryParts(sshMatch[1], sshMatch[2]);
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") {
      return null;
    }

    const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
    const [owner, repoWithSuffix] = path.split("/");

    if (!owner || !repoWithSuffix) {
      return null;
    }

    return normalizeRepositoryParts(owner, repoWithSuffix);
  } catch {
    return null;
  }
}
