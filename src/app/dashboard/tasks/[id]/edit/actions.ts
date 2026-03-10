"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isReviewerRole } from "@/lib/roles";

export async function updateTaskAction(formData: FormData) {
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

  const id = String(formData.get("id") || "").trim();
  const projectId = String(formData.get("project_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const difficulty = String(formData.get("difficulty") || "beginner").trim();
  const labelsRaw = String(formData.get("labels") || "").trim();
  const githubIssueUrl = String(formData.get("github_issue_url") || "").trim();
  const status = String(formData.get("status") || "open").trim();

  if (!id || !projectId || !title) {
    redirect("/dashboard");
  }

  const labels = labelsRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      project_id: projectId,
      title,
      description: description || null,
      difficulty,
      labels,
      github_issue_url: githubIssueUrl || null,
      status,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Error actualizando tarea:", updateError.message);
    redirect(`/dashboard/tasks/${id}/edit?error=update_failed`);
  }

  redirect(`/tasks/${id}`);
}
