import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

type NavbarProps = {
  containerClassName?: string;
};

export default async function Navbar({ containerClassName = "max-w-4xl" }: NavbarProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className={`mx-auto mb-6 rounded-2xl border bg-white p-4 shadow-sm ${containerClassName}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="text-sm font-semibold text-gray-900">
          Junior Dev Open Source
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Inicio
          </Link>
          <Link
            href="/projects"
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Proyectos
          </Link>
          <Link
            href="/dashboard/my-requests"
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Mis solicitudes
          </Link>
          <Link
            href="/dashboard/my-tasks"
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Mis tareas
          </Link>
          <Link
            href="/profile/edit"
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Mi perfil
          </Link>
          {user ? <LogoutButton /> : null}
        </div>
      </div>
    </nav>
  );
}
