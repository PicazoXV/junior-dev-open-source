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
    message.includes("estimated_minutes") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

export async function createTaskAction(formData: FormData) {
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

  const projectId = String(formData.get("project_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const difficulty = String(formData.get("difficulty") || "beginner").trim();
  const labelsRaw = String(formData.get("labels") || "").trim();
  const githubIssueUrl = String(formData.get("github_issue_url") || "").trim();
  const learningResourcesRaw = String(formData.get("learning_resources") || "").trim();
  const status = String(formData.get("status") || "open").trim();
  const estimatedMinutesRaw = String(formData.get("estimated_minutes") || "").trim();
  const estimatedMinutes = estimatedMinutesRaw ? Number(estimatedMinutesRaw) : null;

  if (!projectId || !title) {
    redirect("/dashboard/tasks/new?error=missing_fields");
  }

  const labels = labelsRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const learningResources = learningResourcesRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const insertWithResources = await supabase.from("tasks").insert({
    project_id: projectId,
    title,
    description: description || null,
    difficulty,
    labels,
    learning_resources: learningResources.length > 0 ? learningResources : null,
    github_issue_url: githubIssueUrl || null,
    status,
    estimated_minutes: Number.isFinite(estimatedMinutes) ? estimatedMinutes : null,
    created_at: new Date().toISOString(),
  });

  if (insertWithResources.error && !isMissingColumnError(insertWithResources.error)) {
    console.error("Error creando tarea:", insertWithResources.error.message);
    redirect("/dashboard/tasks/new?error=create_failed");
  }

  if (insertWithResources.error && isMissingColumnError(insertWithResources.error)) {
    const fallbackInsert = await supabase.from("tasks").insert({
      project_id: projectId,
      title,
      description: description || null,
      difficulty,
      labels,
      github_issue_url: githubIssueUrl || null,
      status,
      created_at: new Date().toISOString(),
    });

    if (fallbackInsert.error) {
      console.error("Error creando tarea:", fallbackInsert.error.message);
      redirect("/dashboard/tasks/new?error=create_failed");
    }
  }

  redirect("/dashboard/my-tasks");
}
