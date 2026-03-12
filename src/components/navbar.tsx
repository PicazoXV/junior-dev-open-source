import { createClient } from "@/lib/supabase/server";
import RightSidebar from "@/components/right-sidebar";
import { isReviewerRole } from "@/lib/roles";
import { getUnreadNotificationsCount } from "@/lib/notifications";
import { cookies } from "next/headers";
import { DEFAULT_THEME, normalizeTheme, THEME_COOKIE_NAME } from "@/lib/theme";

type NavbarProps = {
  containerClassName?: string;
  variant?: "full" | "public";
};

export default async function Navbar({ containerClassName, variant = "full" }: NavbarProps = {}) {
  void containerClassName;
  const cookieStore = await cookies();
  const currentTheme = normalizeTheme(cookieStore.get(THEME_COOKIE_NAME)?.value || DEFAULT_THEME);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  const isReviewer = isReviewerRole(profile?.role);
  const unreadNotifications =
    variant === "full"
      ? await getUnreadNotificationsCount({
          supabase,
          userId: user?.id || null,
        })
      : 0;

  return (
    <RightSidebar
      isAuthenticated={!!user}
      isReviewer={isReviewer}
      unreadNotifications={unreadNotifications}
      currentTheme={currentTheme}
    />
  );
}
