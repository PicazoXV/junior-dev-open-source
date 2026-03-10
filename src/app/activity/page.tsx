import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import { getPlatformActivity } from "@/lib/activity-feed";
import { getCurrentLocale } from "@/lib/i18n/server";

export default async function ActivityPage() {
  const locale = await getCurrentLocale();
  const supabase = await createClient();
  const activity = await getPlatformActivity(supabase, 30);

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Activity feed" : "Feed de actividad"}
          description={
            locale === "en"
              ? "Recent activity from the community contributing to open source projects."
              : "Actividad reciente de la comunidad contribuyendo en proyectos open source."
          }
        />

        {activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/15 bg-black/20 p-4">
                <p className="text-sm text-gray-200">
                  <span className="text-orange-300">{item.actorName}</span>{" "}
                  {item.type === "merged_pr"
                    ? locale === "en"
                      ? "merged a PR in"
                      : "merged PR en"
                    : item.type === "completed_task"
                      ? locale === "en"
                        ? "completed a task in"
                        : "completó la tarea en"
                      : locale === "en"
                        ? "started a task in"
                        : "empezó una tarea en"}{" "}
                  <span className="text-white">{item.projectName}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">{item.taskTitle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.projectSlug ? (
                    <Link
                      href={`/projects/${item.projectSlug}`}
                      className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                    >
                      {locale === "en" ? "View project" : "Ver proyecto"}
                    </Link>
                  ) : null}
                  {item.githubUrl ? (
                    <Link
                      href={item.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 hover:border-orange-400"
                    >
                      {locale === "en" ? "View on GitHub" : "Ver en GitHub"}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={locale === "en" ? "No recent activity yet" : "Aún no hay actividad reciente"}
            description={
              locale === "en"
                ? "When developers progress tasks and PRs, events will appear here."
                : "Cuando los developers avancen tareas y PRs, aparecerán los eventos aquí."
            }
          />
        )}
      </SectionCard>
    </AppLayout>
  );
}
