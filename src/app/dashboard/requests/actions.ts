"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const isReviewer = profile?.role === "admin" || profile?.role === "maintainer";

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

  revalidatePath("/dashboard/requests");
}
