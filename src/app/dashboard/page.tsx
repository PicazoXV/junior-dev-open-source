import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

export default async function DashboardPage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error cargando perfil:", error.message);
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <LogoutButton />
        </div>

        <div className="flex items-center gap-4">
          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="h-20 w-20 rounded-full"
            />
          )}

          <div>
            <h2 className="text-xl font-semibold">
              {profile?.full_name || "Sin nombre"}
            </h2>
            <p className="text-gray-600">
              @{profile?.github_username || "sin-username"}
            </p>
            <p className="text-sm text-gray-500">
              {profile?.email || user.email}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Rol</p>
            <p className="text-lg font-medium">{profile?.role || "junior"}</p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Fecha de alta</p>
            <p className="text-lg font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString("es-ES")
                : "No disponible"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}