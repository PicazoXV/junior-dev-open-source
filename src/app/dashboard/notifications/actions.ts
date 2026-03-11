"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function deleteNotification(notificationId: string) {
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) return;

  const directDelete = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (directDelete.error) {
    // Fallback for environments where notifications delete policy is not present yet.
    try {
      const admin = createAdminClient();
      const adminDelete = await admin
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (adminDelete.error) {
        console.error("Error deleting notification (admin fallback):", adminDelete.error.message);
      }
    } catch (error) {
      console.error(
        "Error deleting notification (admin fallback client):",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  revalidatePath("/dashboard/notifications");
}
