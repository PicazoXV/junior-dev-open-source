import type { SupabaseClient } from "@supabase/supabase-js";
import { buildTaskIssueDraft } from "@/lib/github/task-approval-preparation";
import { getRepositoryInstallationAccessToken } from "@/lib/github/app-auth";
import {
  createIssueComment,
  createRepositoryIssue,
  getIssueNumberFromUrl,
} from "@/lib/github/issues";
import {
  inviteRepositoryCollaborator,
  isRepositoryCollaborator,
} from "@/lib/github/collaborators";
import { buildTaskIssueBody, buildTaskIssueTitle } from "@/lib/github/issue-body";
import { parseRepositoryFromUrl, type RepositoryRef } from "@/lib/github/repository";
// Next phase extension point:
// import { linkPullRequestToTaskPlaceholder } from "@/lib/github/pull-requests";

export type CollaboratorAccessStatus =
  | "invited"
  | "already_collaborator"
  | "skipped_no_repo"
  | "skipped_no_github_username"
  | "failed";

export type EnsureTaskIssueResult = {
  status: "reused" | "created" | "skipped";
  issueUrl: string | null;
  issueNumber: number | null;
  reason?: string;
  repository: RepositoryRef | null;
  collaboratorAccess: CollaboratorAccessStatus;
  collaboratorAccessError: string | null;
};

function buildAssignmentGitHubComment(params: {
  githubUsername: string | null;
  taskTitle: string | null;
}) {
  const mention = params.githubUsername ? `@${params.githubUsername}` : "Developer";
  const title = params.taskTitle?.trim() || "la tarea";

  return [
    `✅ ${mention} tu tarea ha sido asignada en MiPrimerIssue.`,
    "",
    `Tarea: ${title}`,
    "Siguiente paso: empieza a trabajar y abre tu Pull Request cuando esté lista.",
  ].join("\n");
}

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
    return {
      status: "skipped",
      issueUrl: null,
      issueNumber: null,
      reason: "task_not_found",
      repository: null,
      collaboratorAccess: "skipped_no_repo",
      collaboratorAccessError: null,
    };
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, slug, repo_url")
    .eq("id", task.project_id)
    .maybeSingle();

  if (projectError || !project) {
    return {
      status: "skipped",
      issueUrl: null,
      issueNumber: null,
      reason: "project_not_found",
      repository: null,
      collaboratorAccess: "skipped_no_repo",
      collaboratorAccessError: null,
    };
  }

  const projectRepository = parseRepositoryFromUrl(project.repo_url || "");

  let installationTokenCache: string | null = null;
  const getInstallationToken = async () => {
    if (installationTokenCache) {
      return installationTokenCache;
    }

    if (!projectRepository) {
      throw new Error("project_repository_not_available");
    }

    installationTokenCache = await getRepositoryInstallationAccessToken(projectRepository);
    return installationTokenCache;
  };

  const ensureCollaboratorAccess = async (): Promise<{
    status: CollaboratorAccessStatus;
    error: string | null;
  }> => {
    if (!projectRepository) {
      return { status: "skipped_no_repo", error: null };
    }

    const githubUsername = assignee?.github_username?.trim();
    if (!githubUsername) {
      return { status: "skipped_no_github_username", error: null };
    }

    try {
      const token = await getInstallationToken();
      const isCollaborator = await isRepositoryCollaborator(token, projectRepository, githubUsername);

      if (isCollaborator) {
        return { status: "already_collaborator", error: null };
      }

      const invitation = await inviteRepositoryCollaborator(token, projectRepository, githubUsername);
      return {
        status: invitation.status === "invited" ? "invited" : "already_collaborator",
        error: null,
      };
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const draft = buildTaskIssueDraft({
    projectRepoUrl: project.repo_url,
    taskTitle: task.title,
    taskDescription: task.description,
    existingIssueUrl: task.github_issue_url,
  });

  if (draft.reason === "already_has_issue") {
    const collaboratorAccess = await ensureCollaboratorAccess();
    const issueNumber =
      task.github_issue_number || getIssueNumberFromUrl(draft.existingIssueUrl) || null;

    if (issueNumber && projectRepository) {
      try {
        const token = await getInstallationToken();
        await createIssueComment(
          token,
          projectRepository,
          issueNumber,
          buildAssignmentGitHubComment({
            githubUsername: assignee?.github_username || null,
            taskTitle: task.title,
          })
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
      repository: projectRepository,
      collaboratorAccess: collaboratorAccess.status,
      collaboratorAccessError: collaboratorAccess.error,
    };
  }

  if (!draft.ready || !draft.repository || !draft.issueTitle || !draft.issueBody) {
    const collaboratorAccess = await ensureCollaboratorAccess();
    return {
      status: "skipped",
      issueUrl: null,
      issueNumber: null,
      reason: draft.reason,
      repository: projectRepository,
      collaboratorAccess: collaboratorAccess.status,
      collaboratorAccessError: collaboratorAccess.error,
    };
  }

  const collaboratorAccess = await ensureCollaboratorAccess();
  const issueCreationToken = await getInstallationToken();

  const issue = await createRepositoryIssue(issueCreationToken, draft.repository, {
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
      issueCreationToken,
      draft.repository,
      issue.number,
      buildAssignmentGitHubComment({
        githubUsername: assignee?.github_username || null,
        taskTitle: task.title,
      })
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
    repository: projectRepository,
    collaboratorAccess: collaboratorAccess.status,
    collaboratorAccessError: collaboratorAccess.error,
  };
}
