"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id || null };
}

export async function markNotificationRead(notificationId: string) {
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) return;

  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);

  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead() {
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) return;

  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);

  revalidatePath("/dashboard/notifications");
}
