import { createClient } from "@/lib/supabase/server";
import RightSidebar from "@/components/right-sidebar";
import { isReviewerRole } from "@/lib/roles";
import { getUnreadNotificationsCount } from "@/lib/notifications";

type NavbarProps = {
  containerClassName?: string;
  variant?: "full" | "public";
};

export default async function Navbar({ containerClassName, variant = "full" }: NavbarProps = {}) {
  void containerClassName;

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
    />
  );
}
