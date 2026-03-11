import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

type MinimalSupabaseClient = SupabaseClient;

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export async function createNotification(params: {
  supabase: MinimalSupabaseClient;
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  asSystem?: boolean;
}) {
  const {
    supabase,
    userId,
    type,
    title,
    body = null,
    link = null,
    metadata = null,
    asSystem = false,
  } = params;

  const payload = {
    user_id: userId,
    type,
    title,
    body,
    link,
    metadata,
  };

  const insertWithClient = async (client: MinimalSupabaseClient, source: "session" | "admin") => {
    const { error } = await client.from("notifications").insert(payload);
    if (error) {
      console.error(`Error creating notification (${source}):`, error.message);
      return false;
    }
    return true;
  };

  if (asSystem) {
    try {
      const admin = createAdminClient();
      const success = await insertWithClient(admin, "admin");
      if (success) return;
    } catch (error) {
      console.error(
        "Error creating notification with admin client:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  await insertWithClient(supabase, "session");
}

export async function getUnreadNotificationsCount(params: {
  supabase: MinimalSupabaseClient;
  userId: string | null;
}) {
  const { supabase, userId } = params;
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error loading unread notifications count:", error.message);
    return 0;
  }

  return count || 0;
}
