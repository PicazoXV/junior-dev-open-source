import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { syncProfileFromAuthUser } from "@/lib/create-profile-if-needed";

function getSafeNextPath(next: string | null) {
  if (!next) {
    return "/dashboard";
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging OAuth code for session:", error.message);
    } else {
      const user = data?.user || data?.session?.user;
      if (user) {
        await syncProfileFromAuthUser(supabase, user);
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
