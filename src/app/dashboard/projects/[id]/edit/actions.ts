"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProjectAction(formData: FormData) {
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

  const isAllowed = profile.role === "admin" || profile.role === "maintainer";

  if (!isAllowed) {
    redirect("/dashboard");
  }

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  const shortDescription = String(formData.get("short_description") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const repoUrl = String(formData.get("repo_url") || "").trim();
  const status = String(formData.get("status") || "active").trim();
  const difficulty = String(formData.get("difficulty") || "beginner").trim();
  const techStackRaw = String(formData.get("tech_stack") || "").trim();

  if (!id || !name || !slug) {
    redirect("/dashboard");
  }

  const techStack = techStackRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      name,
      slug,
      short_description: shortDescription || null,
      description: description || null,
      repo_url: repoUrl || null,
      status,
      difficulty,
      tech_stack: techStack,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Error actualizando proyecto:", updateError.message);
    redirect(`/dashboard/projects/${id}/edit?error=update_failed`);
  }

  redirect(`/projects/${slug}`);
}

