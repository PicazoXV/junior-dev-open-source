import { createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRepositoryFromUrl, type RepositoryRef } from "@/lib/github/repository";
import {
  extractIssueNumbersFromPullRequest,
  getLinkedIssueNumbersForPullRequest,
  linkPullRequestToTaskPlaceholder,
} from "@/lib/github/pull-requests";

export type PullRequestWebhookPayload = {
  action: string;
  pull_request?: {
    number: number;
    html_url: string;
    title?: string | null;
    body?: string | null;
    merged?: boolean;
  };
  repository?: {
    name?: string;
    owner?: {
      login?: string;
    };
  };
};

type TaskCandidate = {
  id: string;
  project_id: string;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  github_issue_number: number | null;
};

type ProjectRepository = {
  id: string;
  repo_url: string | null;
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = error.message?.toLowerCase() || "";
  const code = error.code || "";

  return (
    code === "42703" ||
    message.includes("github_pr_number") ||
    message.includes("github_pr_url") ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

function repositoriesMatch(a: RepositoryRef, b: RepositoryRef) {
  return (
    a.owner.toLowerCase() === b.owner.toLowerCase() &&
    a.repo.toLowerCase() === b.repo.toLowerCase()
  );
}

export function verifyGitHubWebhookSignature({
  payload,
  signatureHeader,
  secret,
}: {
  payload: string;
  signatureHeader: string | null;
  secret: string;
}) {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const digest = createHmac("sha256", secret).update(payload).digest("hex");
  const expected = Buffer.from(`sha256=${digest}`);
  const received = Buffer.from(signatureHeader);

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

function extractRepositoryFromPayload(payload: PullRequestWebhookPayload): RepositoryRef | null {
  const owner = payload.repository?.owner?.login?.trim();
  const repo = payload.repository?.name?.trim();

  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}

async function resolveIssueNumbersFromPullRequest(
  repository: RepositoryRef,
  pullRequestNumber: number,
  title: string | null | undefined,
  body: string | null | undefined
) {
  const fromText = extractIssueNumbersFromPullRequest(title || null, body || null);
  const issueNumbers = new Set(fromText);

  try {
    const fromLinkedIssues = await getLinkedIssueNumbersForPullRequest(
      repository,
      pullRequestNumber
    );
    fromLinkedIssues.forEach((number) => issueNumbers.add(number));
  } catch (error) {
    console.warn("Could not resolve linked issues for pull request", {
      repository: `${repository.owner}/${repository.repo}`,
      pullRequestNumber,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return [...issueNumbers];
}

async function findTaskByIssueNumbers(params: {
  supabase: SupabaseClient;
  issueNumbers: number[];
  repository: RepositoryRef;
}) {
  const { supabase, issueNumbers, repository } = params;

  if (issueNumbers.length === 0) {
    return null;
  }

  const { data: taskCandidates, error: tasksError } = await supabase
    .from("tasks")
    .select("id, project_id, status, github_issue_number")
    .in("github_issue_number", issueNumbers);

  if (tasksError) {
    throw new Error(`Could not load task candidates: ${tasksError.message}`);
  }

  const candidates = (taskCandidates || []) as TaskCandidate[];
  if (candidates.length === 0) {
    return null;
  }

  const projectIds = [...new Set(candidates.map((task) => task.project_id))];

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, repo_url")
    .in("id", projectIds);

  if (projectsError) {
    throw new Error(`Could not load candidate projects: ${projectsError.message}`);
  }

  const projectsById = new Map(
    ((projects || []) as ProjectRepository[]).map((project) => [project.id, project])
  );

  for (const issueNumber of issueNumbers) {
    const matchesForIssue = candidates.filter(
      (task) => task.github_issue_number === issueNumber
    );

    for (const candidate of matchesForIssue) {
      const project = projectsById.get(candidate.project_id);
      if (!project?.repo_url) {
        continue;
      }

      const parsedProjectRepository = parseRepositoryFromUrl(project.repo_url);
      if (!parsedProjectRepository) {
        continue;
      }

      if (repositoriesMatch(parsedProjectRepository, repository)) {
        return candidate;
      }
    }
  }

  return null;
}

async function updateTaskWithPullRequestMetadata(params: {
  supabase: SupabaseClient;
  taskId: string;
  status: "assigned" | "in_review" | "completed";
  pullRequestNumber: number;
  pullRequestUrl: string;
}) {
  const { supabase, taskId, status, pullRequestNumber, pullRequestUrl } = params;

  const updateWithMetadata = await supabase
    .from("tasks")
    .update({
      status,
      github_pr_number: pullRequestNumber,
      github_pr_url: pullRequestUrl,
    })
    .eq("id", taskId);

  if (!updateWithMetadata.error) {
    return;
  }

  if (!isMissingColumnError(updateWithMetadata.error)) {
    throw new Error(
      `Could not update task with PR metadata: ${updateWithMetadata.error.message}`
    );
  }

  const fallback = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (fallback.error) {
    throw new Error(`Could not update task status from webhook: ${fallback.error.message}`);
  }
}

export async function handlePullRequestWebhook(params: {
  supabase: SupabaseClient;
  payload: PullRequestWebhookPayload;
}) {
  const { supabase, payload } = params;
  const action = payload.action;
  const pullRequest = payload.pull_request;
  const repository = extractRepositoryFromPayload(payload);

  if (!pullRequest || !repository) {
    return { ok: true, ignored: true, reason: "missing_pr_or_repository" };
  }

  if (action !== "opened" && action !== "reopened" && action !== "closed") {
    return { ok: true, ignored: true, reason: `unsupported_action_${action}` };
  }

  const issueNumbers = await resolveIssueNumbersFromPullRequest(
    repository,
    pullRequest.number,
    pullRequest.title,
    pullRequest.body
  );

  const task = await findTaskByIssueNumbers({
    supabase,
    issueNumbers,
    repository,
  });

  if (!task) {
    return {
      ok: true,
      ignored: true,
      reason: "task_not_found_for_pull_request",
      issueNumbers,
    };
  }

  const nextStatus: "assigned" | "in_review" | "completed" =
    action === "closed" ? (pullRequest.merged ? "completed" : "assigned") : "in_review";

  await updateTaskWithPullRequestMetadata({
    supabase,
    taskId: task.id,
    status: nextStatus,
    pullRequestNumber: pullRequest.number,
    pullRequestUrl: pullRequest.html_url,
  });

  await linkPullRequestToTaskPlaceholder({
    taskId: task.id,
    pullRequestNumber: pullRequest.number,
    pullRequestUrl: pullRequest.html_url,
    repository,
  });

  return {
    ok: true,
    ignored: false,
    action,
    taskId: task.id,
    nextStatus,
    issueNumbers,
    pullRequestNumber: pullRequest.number,
  };
}
