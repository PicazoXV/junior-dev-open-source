import type { Metadata } from "next";
import PublicLayout from "@/components/layout/public-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStats } from "@/lib/platform-stats";
import { getCurrentLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Estadísticas de la comunidad | MiPrimerIssue",
  description:
    "Consulta métricas públicas de MiPrimerIssue: developers activos, tareas completadas, proyectos publicados y PRs mergeados.",
};

export default async function StatsPage() {
  const locale = await getCurrentLocale();
  const supabase = await createClient();
  const stats = await getPlatformStats(supabase);

  return (
    <PublicLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard variant="hero" className="p-8">
        <PageHeader
          title={locale === "en" ? "Platform stats" : "Estadísticas de la plataforma"}
          description={
            locale === "en"
              ? "Public activity and growth metrics for MiPrimerIssue."
              : "Métricas públicas de actividad y crecimiento de MiPrimerIssue."
          }
        />
        <p className="mb-4 text-sm text-gray-300">
          {locale === "en"
            ? "A quick snapshot of real contribution momentum across the community."
            : "Una foto rápida del ritmo real de contribución de la comunidad."}
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard label={locale === "en" ? "Total developers" : "Total developers"} value={stats.totalDevelopers} />
          <StatCard label={locale === "en" ? "Tasks completed" : "Tareas completadas"} value={stats.tasksCompleted} />
          <StatCard label={locale === "en" ? "Projects" : "Proyectos"} value={stats.projects} />
          <StatCard label="PRs merged" value={stats.pullRequestsMerged} />
        </div>
      </SectionCard>
    </PublicLayout>
  );
}
