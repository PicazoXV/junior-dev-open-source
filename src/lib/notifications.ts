import type { SupabaseClient } from "@supabase/supabase-js";

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
}) {
  const { supabase, userId, type, title, body = null, link = null, metadata = null } = params;

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    link,
    metadata,
  });

  if (error) {
    console.error("Error creating notification:", error.message);
  }
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
