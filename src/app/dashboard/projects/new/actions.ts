"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isReviewerRole } from "@/lib/roles";
import { parseRepositoryFromUrl } from "@/lib/github/repository";

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect("/dashboard");
  }

  const isAllowed = isReviewerRole(profile.role);

  if (!isAllowed) {
    redirect("/dashboard");
  }

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const shortDescription = String(formData.get("short_description") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const repoUrl = String(formData.get("repo_url") || "").trim();
  const status = String(formData.get("status") || "active").trim();
  const difficulty = String(formData.get("difficulty") || "beginner").trim();
  const techStackRaw = String(formData.get("tech_stack") || "").trim();

  if (!name || !slug) {
    redirect("/dashboard/projects/new?error=missing_fields");
  }

  if (repoUrl && !parseRepositoryFromUrl(repoUrl)) {
    redirect("/dashboard/projects/new?error=invalid_repo_url");
  }

  const techStack = techStackRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const { error: insertError } = await supabase.from("projects").insert({
    name,
    slug,
    short_description: shortDescription || null,
    description: description || null,
    repo_url: repoUrl || null,
    status,
    difficulty,
    tech_stack: techStack,
    created_by: user.id,
  });

  if (insertError) {
    console.error("Error creando proyecto:", insertError.message);
    redirect("/dashboard/projects/new?error=create_failed");
  }

  redirect("/projects");
}
