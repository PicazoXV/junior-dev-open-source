export function normalizeRole(role: string | null | undefined) {
  return (role || "").trim().toLowerCase();
}

export function isReviewerRole(role: string | null | undefined) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "admin" || normalizedRole === "maintainer";
}
