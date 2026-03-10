import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStats } from "@/lib/platform-stats";

export default async function StatsPage() {
  const supabase = await createClient();
  const stats = await getPlatformStats(supabase);

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title="Estadísticas de la plataforma"
          description="Métricas públicas de actividad y crecimiento de MiPrimerIssue."
        />
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard label="Total developers" value={stats.totalDevelopers} />
          <StatCard label="Tasks completed" value={stats.tasksCompleted} />
          <StatCard label="Projects" value={stats.projects} />
          <StatCard label="PRs merged" value={stats.pullRequestsMerged} />
        </div>
      </SectionCard>
    </AppLayout>
  );
}

