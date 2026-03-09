import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EditProfileForm from "@/components/edit-profile-form";
import Link from "next/link";
import Navbar from "@/components/navbar";

export default async function EditProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

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
      <Navbar containerClassName="max-w-2xl" />
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Volver al dashboard
          </Link>
        </div>
        <h1 className="mb-6 text-3xl font-bold">Editar perfil</h1>
        <EditProfileForm profile={profile} />
      </div>
    </main>
  );
}
