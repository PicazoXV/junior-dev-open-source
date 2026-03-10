import { createClient } from "@/lib/supabase/server";
import RightSidebar from "@/components/right-sidebar";
import { isReviewerRole } from "@/lib/roles";

type NavbarProps = {
  containerClassName?: string;
};

export default async function Navbar({ containerClassName }: NavbarProps = {}) {
  void containerClassName;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  const isReviewer = isReviewerRole(profile?.role);

  return (
    <RightSidebar isAuthenticated={!!user} isReviewer={isReviewer} />
  );
}
