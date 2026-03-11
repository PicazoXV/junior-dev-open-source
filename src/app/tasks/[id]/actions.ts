"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export type RequestTaskResult = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function requestTask(taskId: string): Promise<RequestTaskResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Debes iniciar sesión para solicitar una tarea.",
    };
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, project_id, title, status")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError || !task) {
    return {
      status: "error",
      message: "No se encontró la tarea.",
    };
  }

  if (task.status !== "open") {
    return {
      status: "error",
      message: "Esta tarea ya no está disponible.",
    };
  }

  const { data: existingRequest, error: existingRequestError } = await supabase
    .from("task_requests")
    .select("id")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingRequestError) {
    return {
      status: "error",
      message: "No se pudo validar tu solicitud. Inténtalo de nuevo.",
    };
  }

  if (existingRequest) {
    return {
      status: "error",
      message: "Ya has solicitado esta tarea.",
    };
  }

  const { error: insertError } = await supabase.from("task_requests").insert({
    task_id: task.id,
    project_id: task.project_id,
    user_id: user.id,
    status: "pending",
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        status: "error",
        message: "Ya has solicitado esta tarea.",
      };
    }

    return {
      status: "error",
      message: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
    };
  }

  await createNotification({
    supabase,
    userId: user.id,
    type: "request_sent",
    title: "Solicitud enviada",
    body: "Tu solicitud fue enviada correctamente. Te avisaremos cuando se revise.",
    link: `/tasks/${task.id}`,
  });

  const [{ data: requesterProfile }, { data: projectOwner }] = await Promise.all([
    supabase
      .from("profiles")
      .select("github_username, full_name")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("created_by, name")
      .eq("id", task.project_id)
      .maybeSingle(),
  ]);

  if (projectOwner?.created_by && projectOwner.created_by !== user.id) {
    const requesterName =
      requesterProfile?.github_username
        ? `@${requesterProfile.github_username}`
        : requesterProfile?.full_name || "Un developer";

    await createNotification({
      supabase,
      userId: projectOwner.created_by,
      type: "new_task_request",
      title: "Nueva solicitud de tarea",
      body: `${requesterName} solicitó trabajar en "${task.title || "una tarea"}"${
        projectOwner.name ? ` del proyecto ${projectOwner.name}` : ""
      }.`,
      link: "/dashboard/requests",
      metadata: {
        taskId: task.id,
        projectId: task.project_id,
        requesterId: user.id,
      },
      asSystem: true,
    });
  }

  return {
    status: "success",
    message: "Solicitud enviada. Un maintainer revisará tu petición.",
  };
}

export async function requestTaskAction(
  _prevState: RequestTaskResult,
  formData: FormData
): Promise<RequestTaskResult> {
  const taskId = formData.get("taskId");

  if (!taskId || typeof taskId !== "string") {
    return {
      status: "error",
      message: "No se pudo identificar la tarea.",
    };
  }

  return requestTask(taskId);
}

export async function addTaskCommentAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const taskId = String(formData.get("taskId") || "").trim();
  const body = String(formData.get("body") || "").trim();

  if (!taskId || !body) {
    return;
  }

  const { error } = await supabase.from("task_comments").insert({
    task_id: taskId,
    user_id: user.id,
    body,
  });

  if (error) {
    console.error("Error creating task comment:", error.message);
    return;
  }

  revalidatePath(`/tasks/${taskId}`);
}
