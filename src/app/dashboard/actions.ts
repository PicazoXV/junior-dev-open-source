"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type UpdateDashboardProfileInput = {
  bio: string;
  location: string;
  roles: string[];
  techStack: string[];
};

type UpdateDashboardProfileResult = {
  ok: boolean;
  error?: string;
  profile?: {
    bio: string | null;
    location: string | null;
    roles: string[];
    techStack: string[];
  };
};

function normalizeUniqueList(values: string[], max: number) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of values) {
    const value = String(raw || "").trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(value);

    if (normalized.length >= max) {
      break;
    }
  }

  return normalized;
}

function isMissingRolesColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = (error.code || "").toUpperCase();
  const messageText = (error.message || "").toLowerCase();

  return (
    code === "42703" ||
    code === "PGRST204" ||
    messageText.includes("roles") ||
    messageText.includes("could not find the") ||
    (messageText.includes("column") && messageText.includes("does not exist"))
  );
}

function isTechStackArrayTypeError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const code = (error.code || "").toUpperCase();
  const messageText = (error.message || "").toLowerCase();

  return (
    code === "22P02" ||
    messageText.includes("malformed array literal") ||
    (messageText.includes("tech_stack") && messageText.includes("array"))
  );
}

export async function updateDashboardProfileAction(
  input: UpdateDashboardProfileInput
): Promise<UpdateDashboardProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "unauthorized" };
  }

  const bio = String(input.bio || "").trim().slice(0, 600);
  const location = String(input.location || "").trim().slice(0, 120);
  const roles = normalizeUniqueList(input.roles || [], 3);
  const techStack = normalizeUniqueList(input.techStack || [], 10);

  const basePayload = {
    bio: bio || null,
    location: location || null,
  };

  const withRolesString = {
    ...basePayload,
    roles,
    tech_stack: techStack.join(", "),
  };

  const withoutRolesString = {
    ...basePayload,
    tech_stack: techStack.join(", "),
  };

  const withRolesArray = {
    ...basePayload,
    roles,
    tech_stack: techStack,
  };

  const withoutRolesArray = {
    ...basePayload,
    tech_stack: techStack,
  };

  const firstTry = await supabase.from("profiles").update(withRolesString).eq("id", user.id);
  let finalError = firstTry.error;

  if (finalError && isMissingRolesColumnError(finalError)) {
    const withoutRolesTry = await supabase
      .from("profiles")
      .update(withoutRolesString)
      .eq("id", user.id);
    finalError = withoutRolesTry.error;

    if (finalError && isTechStackArrayTypeError(finalError)) {
      const withoutRolesArrayTry = await supabase
        .from("profiles")
        .update(withoutRolesArray)
        .eq("id", user.id);
      finalError = withoutRolesArrayTry.error;
    }
  } else if (finalError && isTechStackArrayTypeError(finalError)) {
    const withRolesArrayTry = await supabase
      .from("profiles")
      .update(withRolesArray)
      .eq("id", user.id);
    finalError = withRolesArrayTry.error;

    if (finalError && isMissingRolesColumnError(finalError)) {
      const withoutRolesArrayTry = await supabase
        .from("profiles")
        .update(withoutRolesArray)
        .eq("id", user.id);
      finalError = withoutRolesArrayTry.error;
    }
  }

  if (finalError) {
    console.error("Error actualizando perfil desde dashboard:", finalError.message);
    return { ok: false, error: "update_failed" };
  }

  const { data: refreshedProfile } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("id", user.id)
    .maybeSingle();

  revalidatePath("/dashboard");
  revalidatePath("/developers");
  revalidatePath("/developers/tech");

  const githubUsername = refreshedProfile?.github_username?.trim();
  if (githubUsername) {
    revalidatePath(`/dev/${githubUsername}`);
  }

  return {
    ok: true,
    profile: {
      bio: basePayload.bio,
      location: basePayload.location,
      roles,
      techStack,
    },
  };
}
