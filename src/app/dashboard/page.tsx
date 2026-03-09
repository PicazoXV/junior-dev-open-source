import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";

export default async function DashboardPage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
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
      <Navbar />
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Tu perfil dentro de la plataforma
            </p>
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar del usuario"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-semibold text-gray-600">
                {(profile?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </div>
            )}

            <div>
              <h2 className="text-2xl font-semibold">
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

          <div className="mt-6">
            <p className="mb-1 text-sm font-medium text-gray-500">Bio</p>
            <p className="text-gray-800">
              {profile?.bio || "Todavía no has añadido una bio."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
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

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Ubicación</p>
            <p className="text-lg font-medium">
              {profile?.location || "No especificada"}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">Tech stack</p>
            <p className="text-lg font-medium">
              {profile?.tech_stack || "No especificado"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
