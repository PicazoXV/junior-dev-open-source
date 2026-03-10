"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isReviewerRole } from "@/lib/roles";

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const code = error.code || "";
  const message = error.message?.toLowerCase() || "";

  return (
    code === "42703" ||
    message.includes("learning_resources") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

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
  const learningResourcesRaw = String(formData.get("learning_resources") || "").trim();
  const status = String(formData.get("status") || "open").trim();

  if (!id || !projectId || !title) {
    redirect("/dashboard");
  }

  const labels = labelsRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const learningResources = learningResourcesRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const updateWithResources = await supabase
    .from("tasks")
    .update({
      project_id: projectId,
      title,
      description: description || null,
      difficulty,
      labels,
      learning_resources: learningResources.length > 0 ? learningResources : null,
      github_issue_url: githubIssueUrl || null,
      status,
    })
    .eq("id", id);

  if (updateWithResources.error && !isMissingColumnError(updateWithResources.error)) {
    console.error("Error actualizando tarea:", updateWithResources.error.message);
    redirect(`/dashboard/tasks/${id}/edit?error=update_failed`);
  }

  if (updateWithResources.error && isMissingColumnError(updateWithResources.error)) {
    const fallbackUpdate = await supabase
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

    if (fallbackUpdate.error) {
      console.error("Error actualizando tarea:", fallbackUpdate.error.message);
      redirect(`/dashboard/tasks/${id}/edit?error=update_failed`);
    }
  }

  redirect(`/tasks/${id}`);
}
