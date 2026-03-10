"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isReviewerRole } from "@/lib/roles";

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
  const status = String(formData.get("status") || "open").trim();

  if (!projectId || !title) {
    redirect("/dashboard/tasks/new?error=missing_fields");
  }

  const labels = labelsRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const { error: insertError } = await supabase.from("tasks").insert({
    project_id: projectId,
    title,
    description: description || null,
    difficulty,
    labels,
    github_issue_url: githubIssueUrl || null,
    status,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Error creando tarea:", insertError.message);
    redirect("/dashboard/tasks/new?error=create_failed");
  }

  redirect("/dashboard/my-tasks");
}
