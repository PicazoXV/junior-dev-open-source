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

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      github_username: githubUsername,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: "junior",
    });

    if (insertError) {
      console.error("Error creating profile:", insertError);
    }
  }

  return user;
}