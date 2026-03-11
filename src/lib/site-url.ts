function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl() {
  const fromPublicEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromPublicEnv) {
    const normalized = normalizeSiteUrl(fromPublicEnv);
    if (normalized) {
      return normalized;
    }
  }

  const fromPlatformEnv = process.env.PLATFORM_BASE_URL;
  if (fromPlatformEnv) {
    const normalized = normalizeSiteUrl(fromPlatformEnv);
    if (normalized) {
      return normalized;
    }
  }

  return "https://www.miprimerissue.dev";
}
