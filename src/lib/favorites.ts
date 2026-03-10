import type { SupabaseClient } from "@supabase/supabase-js";

type MinimalSupabaseClient = SupabaseClient;

export type FavoriteItemType = "project" | "task";

export type FavoriteRow = {
  id: string;
  user_id: string;
  item_type: FavoriteItemType;
  item_id: string;
  created_at: string;
};

export type DashboardFavorite = {
  id: string;
  itemType: FavoriteItemType;
  itemId: string;
  title: string;
  subtitle: string | null;
  href: string;
  createdAt: string;
};

export async function getFavoriteIdsByType(params: {
  supabase: MinimalSupabaseClient;
  userId: string | null;
  itemType: FavoriteItemType;
}) {
  const { supabase, userId, itemType } = params;
  if (!userId) return new Set<string>();

  const { data } = await supabase
    .from("favorites")
    .select("item_id")
    .eq("user_id", userId)
    .eq("item_type", itemType);

  return new Set((data || []).map((item) => item.item_id));
}

export async function getDashboardFavorites(params: {
  supabase: MinimalSupabaseClient;
  userId: string;
  locale: "es" | "en";
  limit?: number;
}) {
  const { supabase, userId, locale, limit = 10 } = params;
  const { data: favorites } = await supabase
    .from("favorites")
    .select("id, item_type, item_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (favorites || []) as FavoriteRow[];
  const taskIds = rows.filter((item) => item.item_type === "task").map((item) => item.item_id);
  const projectIds = rows
    .filter((item) => item.item_type === "project")
    .map((item) => item.item_id);

  const [tasksResult, projectsResult] = await Promise.all([
    taskIds.length > 0
      ? supabase.from("tasks").select("id, title").in("id", taskIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length > 0
      ? supabase.from("projects").select("id, name, slug").in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const tasksById = new Map((tasksResult.data || []).map((task) => [task.id, task]));
  const projectsById = new Map((projectsResult.data || []).map((project) => [project.id, project]));

  const mapped = rows
    .map<DashboardFavorite | null>((row) => {
      if (row.item_type === "task") {
        const task = tasksById.get(row.item_id);
        if (!task) return null;
        return {
          id: row.id,
          itemType: "task",
          itemId: row.item_id,
          title:
            task.title ||
            (locale === "en" ? "Untitled task" : "Tarea sin título"),
          subtitle: locale === "en" ? "Favorite task" : "Tarea favorita",
          href: `/tasks/${row.item_id}`,
          createdAt: row.created_at,
        };
      }

      const project = projectsById.get(row.item_id);
      if (!project) return null;
      return {
        id: row.id,
        itemType: "project",
        itemId: row.item_id,
        title:
          project.name ||
          (locale === "en" ? "Untitled project" : "Proyecto sin nombre"),
        subtitle: locale === "en" ? "Favorite project" : "Proyecto favorito",
        href: project.slug ? `/projects/${project.slug}` : "/projects",
        createdAt: row.created_at,
      };
    })
    .filter((item): item is DashboardFavorite => !!item);

  return mapped;
}
