import type { SupabaseClient } from "@supabase/supabase-js";

type MinimalSupabaseClient = SupabaseClient;

export type UserStreaks = {
  currentStreakDays: number;
  longestStreakDays: number;
  activeDaysLast7: number;
  activeDaysLast30: number;
  totalActiveDays: number;
};

function toDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function dateFromKey(key: string) {
  return new Date(`${key}T00:00:00.000Z`);
}

function calculateStreaksFromKeys(keys: string[]) {
  if (keys.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sorted = [...keys].sort((a, b) => dateFromKey(a).getTime() - dateFromKey(b).getTime());

  let longest = 1;
  let running = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = dateFromKey(sorted[i - 1]);
    const curr = dateFromKey(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      running += 1;
      if (running > longest) longest = running;
    } else if (diffDays > 1) {
      running = 1;
    }
  }

  let current = 1;
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    const curr = dateFromKey(sorted[i]);
    const prev = dateFromKey(sorted[i - 1]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current += 1;
    } else {
      break;
    }
  }

  const lastDate = dateFromKey(sorted[sorted.length - 1]);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const lastKey = lastDate.toISOString().slice(0, 10);

  if (lastKey !== todayKey && lastKey !== yesterdayKey) {
    current = 0;
  }

  return { current, longest };
}

export async function getUserStreaks(
  supabase: MinimalSupabaseClient,
  userId: string
): Promise<UserStreaks> {
  const [requestsResult, tasksResult, commentsResult] = await Promise.all([
    supabase.from("task_requests").select("created_at").eq("user_id", userId).limit(500),
    supabase
      .from("tasks")
      .select("created_at")
      .eq("assigned_to", userId)
      .in("status", ["assigned", "in_review", "completed", "closed"])
      .limit(500),
    supabase.from("task_comments").select("created_at").eq("user_id", userId).limit(500),
  ]);

  const dates = new Set<string>();
  (requestsResult.data || []).forEach((item) => dates.add(toDateKey(item.created_at)));
  (tasksResult.data || []).forEach((item) => dates.add(toDateKey(item.created_at)));
  (commentsResult.data || []).forEach((item) => dates.add(toDateKey(item.created_at)));

  const keys = [...dates];
  const { current, longest } = calculateStreaksFromKeys(keys);

  const now = new Date();
  const daysAgo7 = new Date(now);
  daysAgo7.setUTCDate(daysAgo7.getUTCDate() - 7);
  const daysAgo30 = new Date(now);
  daysAgo30.setUTCDate(daysAgo30.getUTCDate() - 30);

  const activeDaysLast7 = keys.filter((key) => dateFromKey(key).getTime() >= daysAgo7.getTime()).length;
  const activeDaysLast30 = keys.filter((key) => dateFromKey(key).getTime() >= daysAgo30.getTime()).length;

  return {
    currentStreakDays: current,
    longestStreakDays: longest,
    activeDaysLast7,
    activeDaysLast30,
    totalActiveDays: keys.length,
  };
}
