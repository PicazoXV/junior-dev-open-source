import { createClient } from "@/lib/supabase/server";
import SidebarNav from "@/components/sidebar-nav";

type NavbarProps = {
  containerClassName?: string;
};

export default async function Navbar({ containerClassName: _containerClassName = "max-w-4xl" }: NavbarProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  const isReviewer = profile?.role === "admin" || profile?.role === "maintainer";

  return (
    <SidebarNav isAuthenticated={!!user} isReviewer={isReviewer} />
  );
}
