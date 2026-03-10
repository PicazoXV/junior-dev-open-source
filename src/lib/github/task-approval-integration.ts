import type { SupabaseClient } from "@supabase/supabase-js";
import { buildTaskIssueDraft } from "@/lib/github/task-approval-preparation";
import { getRepositoryInstallationAccessToken } from "@/lib/github/app-auth";
import {
  createIssueComment,
  createRepositoryIssue,
  getIssueNumberFromUrl,
} from "@/lib/github/issues";
import { isRepositoryCollaborator } from "@/lib/github/collaborators";
import { buildTaskIssueBody, buildTaskIssueTitle } from "@/lib/github/issue-body";
// Next phase extension point:
// import { linkPullRequestToTaskPlaceholder } from "@/lib/github/pull-requests";

export type EnsureTaskIssueResult = {
  status: "reused" | "created" | "skipped";
  issueUrl: string | null;
  issueNumber: number | null;
  reason?: string;
};

async function updateTaskIssueMetadata(
  supabase: SupabaseClient,
  taskId: string,
  issueUrl: string,
  issueNumber: number
) {
  const withNumber = await supabase
    .from("tasks")
    .update({
      github_issue_url: issueUrl,
      github_issue_number: issueNumber,
    })
    .eq("id", taskId);

  if (!withNumber.error) {
    return;
  }

  const message = withNumber.error.message || "";
  const code = (withNumber.error as { code?: string }).code || "";
  const missingColumn =
    code === "42703" ||
    message.toLowerCase().includes("github_issue_number") ||
    message.toLowerCase().includes("column") && message.toLowerCase().includes("does not exist");

  if (missingColumn) {
    const fallback = await supabase
      .from("tasks")
      .update({ github_issue_url: issueUrl })
      .eq("id", taskId);

    if (fallback.error) {
      throw new Error(`Could not persist github_issue_url: ${fallback.error.message}`);
    }

    return;
  }

  throw new Error(`Could not persist issue metadata: ${withNumber.error.message}`);
}

export async function ensureGitHubIssueForApprovedTask(params: {
  supabase: SupabaseClient;
  taskId: string;
  assignedUserId: string;
  approvedByUserId: string;
}): Promise<EnsureTaskIssueResult> {
  const { supabase, taskId, assignedUserId, approvedByUserId } = params;

  const [{ data: task, error: taskError }, { data: assignee }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, github_issue_url, github_issue_number, project_id")
      .eq("id", taskId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("github_username, full_name, email")
      .eq("id", assignedUserId)
      .maybeSingle(),
  ]);

  if (taskError || !task) {
    return { status: "skipped", issueUrl: null, issueNumber: null, reason: "task_not_found" };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, slug, repo_url")
    .eq("id", task.project_id)
    .maybeSingle();

  if (projectError || !project) {
    return { status: "skipped", issueUrl: null, issueNumber: null, reason: "project_not_found" };
  }

  const draft = buildTaskIssueDraft({
    projectRepoUrl: project.repo_url,
    taskTitle: task.title,
    taskDescription: task.description,
    existingIssueUrl: task.github_issue_url,
  });

  if (draft.reason === "already_has_issue") {
    const issueNumber =
      task.github_issue_number || getIssueNumberFromUrl(draft.existingIssueUrl) || null;

    if (issueNumber && draft.repository) {
      try {
        const token = await getRepositoryInstallationAccessToken(draft.repository);
        await createIssueComment(
          token,
          draft.repository,
          issueNumber,
          [
            "Assigned via MiPrimerIssue",
            "",
            `Developer: ${assignee?.github_username ? `@${assignee.github_username}` : "N/A"}`,
          ].join("\n")
        );
      } catch (error) {
        console.warn("Could not post assignment comment on existing issue", {
          taskId,
          issueNumber,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      status: "reused",
      issueUrl: draft.existingIssueUrl,
      issueNumber,
      reason: "already_has_issue",
    };
  }

  if (!draft.ready || !draft.repository || !draft.issueTitle || !draft.issueBody) {
    return {
      status: "skipped",
      issueUrl: null,
      issueNumber: null,
      reason: draft.reason,
    };
  }

  const installationToken = await getRepositoryInstallationAccessToken(draft.repository);

  if (assignee?.github_username) {
    try {
      const isCollaborator = await isRepositoryCollaborator(
        installationToken,
        draft.repository,
        assignee.github_username
      );
      console.info("GitHub collaborator check", {
        taskId,
        username: assignee.github_username,
        isCollaborator,
      });
    } catch (error) {
      console.warn("Could not verify collaborator status", {
        taskId,
        username: assignee.github_username,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const issue = await createRepositoryIssue(installationToken, draft.repository, {
    title: buildTaskIssueTitle(draft.issueTitle),
    body: buildTaskIssueBody({
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description,
      projectName: project.name,
      projectSlug: project.slug,
      assignedGithubUsername: assignee?.github_username || null,
      approvedByUserId,
    }),
  });

  await updateTaskIssueMetadata(supabase, task.id, issue.html_url, issue.number);

  try {
    await createIssueComment(
      installationToken,
      draft.repository,
      issue.number,
      [
        "Assigned via MiPrimerIssue",
        "",
        `Developer: ${assignee?.github_username ? `@${assignee.github_username}` : "N/A"}`,
      ].join("\n")
    );
  } catch (error) {
    console.warn("Could not post assignment comment in GitHub issue", {
      taskId,
      issueNumber: issue.number,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    status: "created",
    issueUrl: issue.html_url,
    issueNumber: issue.number,
  };
}
