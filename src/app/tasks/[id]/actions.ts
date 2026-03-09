"use server";

import { createClient } from "@/lib/supabase/server";

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
    .select("id, project_id, status")
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
