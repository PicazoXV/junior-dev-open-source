import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createProjectAction } from "@/app/dashboard/projects/new/actions";
import { isReviewerRole } from "@/lib/roles";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import { getCurrentLocale } from "@/lib/i18n/server";

export default async function PublicNewProjectPage() {
  const locale = await getCurrentLocale();
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isReviewerRole(profile?.role)) {
    redirect("/dashboard");
  }

  return (
    <AppLayout containerClassName="mx-auto max-w-4xl">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Register new project" : "Registrar nuevo proyecto"}
          description={
            locale === "en"
              ? "Add a new open source repository so the community can contribute."
              : "Añade un nuevo repositorio open source para que la comunidad pueda contribuir."
          }
          actions={
            <Link
              href="/projects"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
            >
              {locale === "en" ? "Back to projects" : "Volver a proyectos"}
            </Link>
          }
        />

        <form action={createProjectAction} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Name" : "Nombre"}
              </label>
              <input id="name" name="name" required className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-300">
                Slug
              </label>
              <input id="slug" name="slug" required className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label htmlFor="short_description" className="mb-1 block text-sm font-medium text-gray-300">
              {locale === "en" ? "Short description" : "Descripción corta"}
            </label>
            <input id="short_description" name="short_description" className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-300">
              {locale === "en" ? "Description" : "Descripción"}
            </label>
            <textarea id="description" name="description" rows={5} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>

          <div>
            <label htmlFor="repo_url" className="mb-1 block text-sm font-medium text-gray-300">
              {locale === "en" ? "Repo URL (GitHub)" : "Repo URL (GitHub)"}
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
                {locale === "en" ? "Status" : "Estado"}
              </label>
              <select id="status" name="status" defaultValue="active" className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="active">active</option>
                <option value="archived">archived</option>
              </select>
            </div>
            <div>
              <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-gray-300">
                {locale === "en" ? "Difficulty" : "Dificultad"}
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
              {locale === "en" ? "Tech stack (comma separated)" : "Tech stack (separado por comas)"}
            </label>
            <input
              id="tech_stack"
              name="tech_stack"
              placeholder="nextjs, supabase, tailwindcss"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 hover:border-orange-400 hover:bg-orange-500/15"
          >
            {locale === "en" ? "Create project" : "Crear proyecto"}
          </button>
        </form>
      </SectionCard>
    </AppLayout>
  );
}
