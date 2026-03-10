import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createProjectAction } from "@/app/dashboard/projects/new/actions";
import { isReviewerRole } from "@/lib/roles";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";

export default async function NewProjectPage() {
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error cargando perfil:", profileError.message);
    redirect("/dashboard");
  }

  if (!isReviewerRole(profile?.role)) {
    redirect("/dashboard");
  }

  return (
    <AppLayout containerClassName="mx-auto max-w-4xl">
      <SectionCard className="p-8">
        <PageHeader
          title="Nuevo proyecto"
          description="Define los datos base para publicar un proyecto en la plataforma."
          actions={
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Volver al dashboard
            </Link>
          }
        />

        <form action={createProjectAction} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-300">
                Nombre
              </label>
              <input id="name" name="name" required className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>

            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-300">
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                required
                placeholder="mi-proyecto-open-source"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="short_description" className="mb-1 block text-sm font-medium text-gray-300">
              Descripción corta
            </label>
            <input id="short_description" name="short_description" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-300">
              Descripción
            </label>
            <textarea id="description" name="description" rows={5} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>

          <div>
            <label htmlFor="repo_url" className="mb-1 block text-sm font-medium text-gray-300">
              URL del repositorio
            </label>
            <input
              id="repo_url"
              name="repo_url"
              type="url"
              placeholder="https://github.com/org/repo"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-300">
                Estado
              </label>
              <select id="status" name="status" defaultValue="active" className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-gray-300">
                Dificultad
              </label>
              <select id="difficulty" name="difficulty" defaultValue="beginner" className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="tech_stack" className="mb-1 block text-sm font-medium text-gray-300">
              Tech stack (separado por comas)
            </label>
            <input
              id="tech_stack"
              name="tech_stack"
              placeholder="nextjs, supabase, tailwindcss"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              Crear proyecto
            </button>
          </div>
        </form>
      </SectionCard>
    </AppLayout>
  );
}
