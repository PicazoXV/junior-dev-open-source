import Link from "next/link";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import Badge from "@/components/ui/badge";
import { getCurrentLocale } from "@/lib/i18n/server";

const BENEFITS_ES = [
  "Recibe contributors con contexto y tareas guiadas.",
  "Filtra solicitudes antes de asignar trabajo real.",
  "Conecta issues y PRs con seguimiento automático.",
  "Mejora onboarding de juniors sin sacrificar calidad.",
];

const BENEFITS_EN = [
  "Get contributors with context and guided tasks.",
  "Filter requests before assigning real work.",
  "Connect issues and PRs with automatic tracking.",
  "Improve junior onboarding without sacrificing quality.",
];

export default async function ForMaintainersPage() {
  const locale = await getCurrentLocale();
  const benefits = locale === "en" ? BENEFITS_EN : BENEFITS_ES;

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "For Maintainers" : "Para maintainers"}
          description={
            locale === "en"
              ? "Scale your open source project with prepared junior contributors."
              : "Escala tu proyecto open source con contributors junior preparados."
          }
        />

        <div className="mt-4 space-y-3 text-gray-300">
          <p>
            {locale === "en"
              ? "MiPrimerIssue helps maintainers publish clear tasks, review incoming requests, and keep contribution flow connected to GitHub."
              : "MiPrimerIssue ayuda a maintainers a publicar tareas claras, revisar solicitudes y mantener el flujo de contribución conectado con GitHub."}
          </p>
          <p>
            {locale === "en"
              ? "Instead of random inbound contributions, you get guided collaborators with progress tracking, challenge mechanics, and transparent activity."
              : "En lugar de contribuciones aleatorias, recibes colaboradores guiados con progreso, retos y actividad transparente."}
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {benefits.map((benefit) => (
            <article key={benefit} className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-gray-200">{benefit}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge tone="warning">
            {locale === "en" ? "Maintainer-ready flow" : "Flujo listo para maintainers"}
          </Badge>
          <Badge tone="info">
            {locale === "en" ? "GitHub-connected tasks" : "Tareas conectadas con GitHub"}
          </Badge>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/projects/new"
            className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
          >
            {locale === "en" ? "Add your project" : "Añade tu proyecto"}
          </Link>
          <Link
            href="/dashboard/tasks/new"
            className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
          >
            {locale === "en" ? "Publish tasks on MiPrimerIssue" : "Publica tareas en MiPrimerIssue"}
          </Link>
        </div>
      </SectionCard>
    </AppLayout>
  );
}
