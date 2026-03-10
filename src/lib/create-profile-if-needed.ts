import { createClient } from "@/lib/supabase/server";

export async function createProfileIfNeeded() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return user;
  }

  if (!profile) {
    const githubUsername =
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      user.user_metadata?.user_name ||
      null;

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      null;

    const avatarUrl = user.user_metadata?.avatar_url || null;

    const baseProfilePayload = {
      id: user.id,
      email: user.email,
      github_username: githubUsername,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: "junior",
    };

    const withChallengePayload = {
      ...baseProfilePayload,
      challenge_started_at: new Date().toISOString(),
    };

    const firstInsert = await supabase.from("profiles").insert(withChallengePayload);

    const isMissingChallengeColumn =
      firstInsert.error &&
      ((firstInsert.error as { code?: string }).code === "42703" ||
        firstInsert.error.message?.toLowerCase().includes("challenge_started_at"));

    const insertError = isMissingChallengeColumn
      ? (await supabase.from("profiles").insert(baseProfilePayload)).error
      : firstInsert.error;

    if (insertError) {
      console.error("Error creating profile:", insertError);
    }
  }

  return user;
}
