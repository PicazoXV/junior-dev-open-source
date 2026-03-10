"use server";

import { redirect } from "next/navigation";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import { isReviewerRole } from "@/lib/roles";
import { createDevelopmentIssueForRepository, GITHUB_TEST_REPOSITORY_URL } from "@/lib/github/diagnostics";

export async function createGitHubTestIssueAction(formData: FormData) {
  if (process.env.NODE_ENV !== "development") {
    redirect("/dashboard");
  }

  const user = await createProfileIfNeeded();
  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isReviewerRole(profile?.role)) {
    redirect("/dashboard");
  }

  const repoUrl =
    String(formData.get("repo_url") || "").trim() || GITHUB_TEST_REPOSITORY_URL;
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!title) {
    redirect(`/dev/github?repo_url=${encodeURIComponent(repoUrl)}&error=missing_title`);
  }

  try {
    const issue = await createDevelopmentIssueForRepository({
      repoUrl,
      title,
      body: body || "Issue de prueba creado desde la integración GitHub App.",
    });

    redirect(
      `/dev/github?repo_url=${encodeURIComponent(repoUrl)}&result=issue_created&issue_url=${encodeURIComponent(
        issue.html_url
      )}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    redirect(
      `/dev/github?repo_url=${encodeURIComponent(repoUrl)}&error=${encodeURIComponent(message)}`
    );
  }
}
