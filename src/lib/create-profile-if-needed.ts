import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

type ProfilePayload = {
  id: string;
  email: string | null;
  github_username: string | null;
  github_url: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: "junior";
};

function toCleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeGithubUsername(value: unknown) {
  const cleaned = toCleanString(value);
  if (!cleaned) return null;
  return cleaned.replace(/^@+/, "");
}

function collectIdentityData(user: User) {
  const candidates: Record<string, unknown>[] = [];
  if (user.user_metadata && typeof user.user_metadata === "object") {
    candidates.push(user.user_metadata as Record<string, unknown>);
  }

  for (const identity of user.identities || []) {
    const identityData = identity?.identity_data;
    if (identityData && typeof identityData === "object") {
      candidates.push(identityData as Record<string, unknown>);
    }
  }

  return candidates;
}

function pickGithubUsername(user: User) {
  const sources = collectIdentityData(user);
  for (const source of sources) {
    const username =
      normalizeGithubUsername(source.user_name) ||
      normalizeGithubUsername(source.preferred_username) ||
      normalizeGithubUsername(source.user_login) ||
      normalizeGithubUsername(source.login);

    if (username) return username;
  }
  return null;
}

function pickFullName(user: User) {
  const sources = collectIdentityData(user);
  for (const source of sources) {
    const fullName = toCleanString(source.full_name) || toCleanString(source.name);
    if (fullName) return fullName;
  }
  return null;
}

function pickAvatarUrl(user: User) {
  const sources = collectIdentityData(user);
  for (const source of sources) {
    const avatar =
      toCleanString(source.avatar_url) ||
      toCleanString(source.picture);
    if (avatar) return avatar;
  }
  return null;
}

function pickGithubUrl(user: User, githubUsername: string | null) {
  const sources = collectIdentityData(user);
  for (const source of sources) {
    const url = toCleanString(source.html_url) || toCleanString(source.profile);
    if (url) return url;
  }

  if (githubUsername) {
    return `https://github.com/${githubUsername}`;
  }

  return null;
}

function isMissingColumnError(
  error: { code?: string; message?: string } | null | undefined,
  columnName: string
) {
  if (!error) return false;
  const code = (error.code || "").toUpperCase();
  const message = (error.message || "").toLowerCase();
  const column = columnName.toLowerCase();

  return (
    code === "42703" ||
    code === "PGRST204" ||
    (message.includes(column) &&
      (message.includes("column") || message.includes("does not exist") || message.includes("could not find")))
  );
}

async function insertProfileWithFallback(
  supabase: SupabaseClient,
  payload: ProfilePayload & { challenge_started_at: string }
) {
  const mutablePayload: Record<string, unknown> = { ...payload };
  const optionalColumns = ["challenge_started_at", "github_url"];

  for (let attempt = 0; attempt < optionalColumns.length + 1; attempt += 1) {
    const { error } = await supabase.from("profiles").insert(mutablePayload);
    if (!error) return null;

    const removableColumn = optionalColumns.find(
      (column) => column in mutablePayload && isMissingColumnError(error, column)
    );

    if (!removableColumn) {
      return error;
    }

    delete mutablePayload[removableColumn];
  }

  return null;
}

async function updateProfileWithFallback(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
) {
  const mutablePayload: Record<string, unknown> = { ...payload };
  const optionalColumns = ["github_url"];

  for (let attempt = 0; attempt < optionalColumns.length + 1; attempt += 1) {
    const { error } = await supabase.from("profiles").update(mutablePayload).eq("id", userId);
    if (!error) return null;

    const removableColumn = optionalColumns.find(
      (column) => column in mutablePayload && isMissingColumnError(error, column)
    );

    if (!removableColumn) {
      return error;
    }

    delete mutablePayload[removableColumn];
  }

  return null;
}

export async function syncProfileFromAuthUser(
  supabase: SupabaseClient,
  user: User
) {
  const githubUsername = pickGithubUsername(user);
  const githubUrl = pickGithubUrl(user, githubUsername);
  const fullName = pickFullName(user);
  const avatarUrl = pickAvatarUrl(user);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, github_username, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return;
  }

  if (!profile) {
    const insertError = await insertProfileWithFallback(supabase, {
      id: user.id,
      email: user.email || null,
      github_username: githubUsername,
      github_url: githubUrl,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: "junior",
      challenge_started_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Error creating profile:", insertError);
    }

    return;
  }

  const updatePayload: Record<string, unknown> = {};

  if (githubUsername && githubUsername !== profile.github_username) {
    updatePayload.github_username = githubUsername;
  }

  if (fullName && fullName !== profile.full_name) {
    updatePayload.full_name = fullName;
  }

  if (avatarUrl && avatarUrl !== profile.avatar_url) {
    updatePayload.avatar_url = avatarUrl;
  }

  if (githubUrl) {
    updatePayload.github_url = githubUrl;
  }

  if (Object.keys(updatePayload).length === 0) {
    return;
  }

  const updateError = await updateProfileWithFallback(supabase, user.id, updatePayload);
  if (updateError) {
    console.error("Error syncing profile data:", updateError);
  }
}

export async function createProfileIfNeeded() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }
    await syncProfileFromAuthUser(supabase, user);

    return user;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Dynamic server usage")) {
      throw error;
    }

    console.error(
      "Error initializing profile/session (fallback to anonymous):",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}
