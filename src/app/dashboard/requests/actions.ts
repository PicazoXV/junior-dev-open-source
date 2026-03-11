"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isReviewerRole } from "@/lib/roles";
import { ensureGitHubIssueForApprovedTask } from "@/lib/github/task-approval-integration";
import { createNotification } from "@/lib/notifications";

async function getReviewerContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, isReviewer: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const isReviewer = isReviewerRole(profile?.role);

  return { supabase, user, isReviewer };
}

export async function approveRequest(requestId: string) {
  const { supabase, user, isReviewer } = await getReviewerContext();

  if (!user || !isReviewer) {
    throw new Error("No autorizado");
  }

  const { data: request, error: requestError } = await supabase
    .from("task_requests")
    .select("id, task_id, user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) {
    throw new Error("Solicitud no encontrada");
  }

  if (request.status !== "pending") {
    revalidatePath("/dashboard/requests");
    return;
  }

  const { error: requestUpdateError } = await supabase
    .from("task_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", request.id);

  if (requestUpdateError) {
    throw new Error("No se pudo aprobar la solicitud");
  }

  const { error: taskUpdateError } = await supabase
    .from("tasks")
    .update({
      status: "assigned",
      assigned_to: request.user_id,
    })
    .eq("id", request.task_id);

  if (taskUpdateError) {
    throw new Error("No se pudo asignar la tarea");
  }

  await createNotification({
    supabase,
    userId: request.user_id,
    type: "request_approved",
    title: "Tu solicitud fue aprobada",
    body: "Te asignaron la tarea. Ya puedes empezar a colaborar.",
    link: `/tasks/${request.task_id}`,
    asSystem: true,
  });

  try {
    const integrationResult = await ensureGitHubIssueForApprovedTask({
      supabase,
      taskId: request.task_id,
      assignedUserId: request.user_id,
      approvedByUserId: user.id,
    });

    console.info("GitHub issue integration result", {
      requestId: request.id,
      taskId: request.task_id,
      status: integrationResult.status,
      issueUrl: integrationResult.issueUrl,
      issueNumber: integrationResult.issueNumber,
      reason: integrationResult.reason,
      collaboratorAccess: integrationResult.collaboratorAccess,
      collaboratorAccessError: integrationResult.collaboratorAccessError,
    });

    if (integrationResult.issueUrl) {
      await createNotification({
        supabase,
        userId: request.user_id,
        type: "issue_created",
        title: "Issue creado en GitHub",
        body: "La tarea ya tiene un issue enlazado en GitHub.",
        link: integrationResult.issueUrl,
        asSystem: true,
      });
    }

    if (integrationResult.collaboratorAccess === "invited" && integrationResult.repository) {
      await createNotification({
        supabase,
        userId: request.user_id,
        type: "repo_access_invited",
        title: "Acceso al repositorio enviado",
        body: `Te enviamos invitación para colaborar en ${integrationResult.repository.owner}/${integrationResult.repository.repo}. Revisa tu email o notificaciones de GitHub.`,
        link: `https://github.com/${integrationResult.repository.owner}/${integrationResult.repository.repo}`,
        asSystem: true,
      });
    } else if (integrationResult.collaboratorAccess === "already_collaborator") {
      await createNotification({
        supabase,
        userId: request.user_id,
        type: "repo_access_ready",
        title: "Ya tienes acceso al repositorio",
        body: "Tu acceso de colaboración al repositorio ya estaba activo. Puedes empezar a trabajar.",
        link: `/tasks/${request.task_id}`,
        asSystem: true,
      });
    } else if (integrationResult.collaboratorAccess === "failed") {
      await createNotification({
        supabase,
        userId: request.user_id,
        type: "repo_access_pending",
        title: "Acceso al repositorio pendiente",
        body:
          "Tu tarea está aprobada, pero no pudimos conceder acceso automático al repositorio. Un maintainer te dará acceso manualmente.",
        link: `/tasks/${request.task_id}`,
        metadata: {
          collaboratorAccessError: integrationResult.collaboratorAccessError,
        },
        asSystem: true,
      });
    }
  } catch (error) {
    const githubErrorMessage = error instanceof Error ? error.message : String(error);

    console.error("GitHub integration failed while approving task request", {
      requestId: request.id,
      taskId: request.task_id,
      error: githubErrorMessage,
    });

    await createNotification({
      supabase,
      userId: user.id,
      type: "github_sync_failed",
      title: "Fallo en integración con GitHub",
      body: `La solicitud se aprobó, pero no pudimos crear/sincronizar el issue automáticamente. Motivo: ${githubErrorMessage}`,
      link: "/dashboard/requests",
      metadata: {
        requestId: request.id,
        taskId: request.task_id,
      },
    });

    await createNotification({
      supabase,
      userId: request.user_id,
      type: "repo_access_pending",
      title: "Tarea aprobada, integración GitHub pendiente",
      body:
        "Tu tarea fue aprobada, pero estamos resolviendo la integración con GitHub. Un maintainer te ayudará manualmente si hace falta.",
      link: `/tasks/${request.task_id}`,
      asSystem: true,
    });
  }

  const reviewedAt = new Date().toISOString();

  const { error: cancelOthersError } = await supabase
    .from("task_requests")
    .update({
      status: "cancelled",
      reviewed_at: reviewedAt,
      reviewed_by: user.id,
    })
    .eq("task_id", request.task_id)
    .neq("id", request.id)
    .eq("status", "pending");

  if (cancelOthersError) {
    throw new Error("No se pudieron cancelar las solicitudes pendientes");
  }

  revalidatePath("/dashboard/requests");
}

export async function rejectRequest(requestId: string) {
  const { supabase, user, isReviewer } = await getReviewerContext();

  if (!user || !isReviewer) {
    throw new Error("No autorizado");
  }

  const { data: request } = await supabase
    .from("task_requests")
    .select("id, user_id, task_id")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await supabase
    .from("task_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", requestId);

  if (error) {
    throw new Error("No se pudo rechazar la solicitud");
  }

  if (request?.user_id && request?.task_id) {
    await createNotification({
      supabase,
      userId: request.user_id,
      type: "request_rejected",
      title: "Tu solicitud fue rechazada",
      body: "Esta solicitud no fue aprobada. Puedes intentar con otra tarea.",
      link: `/tasks/${request.task_id}`,
      asSystem: true,
    });
  }

  revalidatePath("/dashboard/requests");
}
