import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { createClient } from "@/lib/supabase/server";
import { isReviewerRole } from "@/lib/roles";
import { createGitHubTestIssueAction } from "@/app/dev/github/actions";
import { GITHUB_TEST_REPOSITORY_URL, runGitHubAppDiagnostics } from "@/lib/github/diagnostics";

type GitHubDevPageProps = {
  searchParams: Promise<{
    repo_url?: string;
    result?: string;
    issue_url?: string;
    error?: string;
  }>;
};

function DiagnosticRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string | null;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-300">{label}</p>
        <Badge tone={ok ? "success" : "danger"}>{ok ? "OK" : "Error"}</Badge>
      </div>
      {detail ? <p className="mt-2 text-xs text-gray-500">{detail}</p> : null}
    </div>
  );
}

export default async function GitHubDevPage({ searchParams }: GitHubDevPageProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

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

  const resolvedSearch = await searchParams;
  const repoUrl = resolvedSearch.repo_url?.trim() || GITHUB_TEST_REPOSITORY_URL;
  const diagnostics = await runGitHubAppDiagnostics(repoUrl);

  return (
    <AppLayout containerClassName="mx-auto max-w-4xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title="GitHub App Diagnostics (Dev)"
          description="Diagnóstico interno para verificar integración con GitHub App y el repositorio de prueba."
          actions={
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              Volver al dashboard
            </Link>
          }
        />

        <form action="/dev/github" className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="repo_url"
            defaultValue={repoUrl}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg border border-white/20 bg-neutral-900 px-4 py-2 text-sm text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
          >
            Re-ejecutar diagnóstico
          </button>
        </form>

        {resolvedSearch.result === "issue_created" && resolvedSearch.issue_url ? (
          <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-3">
            <p className="text-sm text-emerald-300">
              Issue de prueba creado:{" "}
              <Link
                href={resolvedSearch.issue_url}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                abrir en GitHub
              </Link>
            </p>
          </div>
        ) : null}

        {resolvedSearch.error ? (
          <div className="mb-4 rounded-lg border border-rose-500/25 bg-rose-500/10 p-3">
            <p className="text-sm text-rose-300">Error: {resolvedSearch.error}</p>
          </div>
        ) : null}

        <div className="grid gap-3">
          <DiagnosticRow
            label="GITHUB_APP_ID configurado"
            ok={diagnostics.env.appIdConfigured}
          />
          <DiagnosticRow
            label="GITHUB_APP_PRIVATE_KEY configurada"
            ok={diagnostics.env.privateKeyConfigured}
          />
          <DiagnosticRow
            label="Repo parseado (owner/repo)"
            ok={diagnostics.repository.parsed}
            detail={
              diagnostics.repository.parsed
                ? `${diagnostics.repository.owner}/${diagnostics.repository.repo}`
                : diagnostics.repository.error
            }
          />
          <DiagnosticRow
            label="JWT de GitHub App generado"
            ok={diagnostics.auth.jwtGenerated}
            detail={diagnostics.auth.error}
          />
          <DiagnosticRow
            label="Instalación encontrada en el repositorio"
            ok={diagnostics.installation.resolved}
            detail={
              diagnostics.installation.resolved
                ? `installation_id=${diagnostics.installation.installationId}`
                : diagnostics.installation.error
            }
          />
          <DiagnosticRow
            label="Installation token obtenido"
            ok={diagnostics.token.resolved}
            detail={diagnostics.token.error}
          />
          <DiagnosticRow
            label="Acceso al repositorio válido"
            ok={diagnostics.repositoryAccess.ok}
            detail={diagnostics.repositoryAccess.error}
          />
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title="Crear issue de prueba"
          description="Utilidad solo para desarrollo. No usar en producción."
        />

        <form action={createGitHubTestIssueAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">Repo URL</label>
            <input
              type="text"
              name="repo_url"
              defaultValue={repoUrl}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Título</label>
            <input
              type="text"
              name="title"
              defaultValue="[Dev Test] GitHub App issue creation"
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">Body</label>
            <textarea
              name="body"
              rows={5}
              defaultValue={`Issue de diagnóstico para validar integración GitHub App.\n\nRepositorio objetivo: ${repoUrl}`}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
          >
            Crear issue de prueba
          </button>
        </form>
      </SectionCard>
    </AppLayout>
  );
}
