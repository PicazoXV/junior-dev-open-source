import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditProfileForm from "@/components/edit-profile-form";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import { getUserProgress } from "@/lib/user-progress";
import LevelBadge from "@/components/ui/level-badge";
import StatCard from "@/components/ui/stat-card";
import { getUserBadges } from "@/lib/user-badges";
import AchievementBadge from "@/components/ui/achievement-badge";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUserTimeline } from "@/lib/user-timeline";
import UserTimelineCard from "@/components/timeline/user-timeline-card";
import { getVerifiedContributions } from "@/lib/verified-contributions";
import EmptyState from "@/components/ui/empty-state";
import { getUserStreaks } from "@/lib/user-streaks";
import { parseTechStack } from "@/lib/profile-options";
import Badge from "@/components/ui/badge";

export default async function EditProfilePage() {
  const locale = await getCurrentLocale();
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

  const progress = await getUserProgress(supabase, user.id, profile?.tech_stack || null);
  const badges = getUserBadges(progress);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const timeline = await getUserTimeline({ supabase, userId: user.id, locale, limit: 8 });
  const verifiedContributions = await getVerifiedContributions({
    supabase,
    userId: user.id,
    limit: 6,
  });
  const streaks = await getUserStreaks(supabase, user.id);
  const profileRoles = ((profile?.roles as string[] | null | undefined) || []).filter(Boolean);
  const techStackTags = parseTechStack(profile?.tech_stack);

  return (
    <AppLayout containerClassName="mx-auto max-w-2xl">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Edit profile" : "Editar perfil"}
          description={
            locale === "en"
              ? "Update your public information on MiPrimerIssue."
              : "Actualiza tu información pública en MiPrimerIssue."
          }
          actions={
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
            >
              {locale === "en" ? "Back to dashboard" : "Volver al dashboard"}
            </Link>
          }
        />

        <div className="mb-6 rounded-2xl border border-white/20 bg-black/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
              {locale === "en" ? "Level" : "Nivel"}
            </p>
            <LevelBadge level={progress.level} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label={locale === "en" ? "Completed tasks" : "Tareas completadas"} value={progress.completedTasks} />
            <StatCard label={locale === "en" ? "Tasks in progress" : "Tareas en curso"} value={progress.inProgressTasks} />
            <StatCard label={locale === "en" ? "Contributed projects" : "Proyectos contribuidos"} value={progress.contributedProjects} />
            <StatCard label={locale === "en" ? "Requests sent" : "Solicitudes enviadas"} value={progress.requestsSent} />
            <StatCard label="PRs merged" value={progress.mergedPullRequests} />
            <StatCard
              label={locale === "en" ? "Unlocked badges" : "Badges desbloqueados"}
              value={`${unlockedBadges.length}/${badges.length}`}
            />
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-white/20 bg-black/20 p-4">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Developer achievements" : "Logros del developer"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {locale === "en"
              ? "These badges are automatically calculated from your activity."
              : "Estos badges se calculan automáticamente según tu actividad."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {badges.map((badge) => (
              <AchievementBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-white/20 bg-black/20 p-4">
          <h3 className="text-base font-semibold text-white">
            {locale === "en" ? "Specialization" : "Especialización"}
          </h3>
          <div className="mt-3">
            <p className="text-sm text-gray-400">{locale === "en" ? "Position" : "Puesto"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profileRoles.length > 0 ? (
                profileRoles.map((role) => <Badge key={role}>{role}</Badge>)
              ) : (
                <span className="text-sm text-gray-500">
                  {locale === "en" ? "No positions selected" : "Sin puestos seleccionados"}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Tech stack</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {techStackTags.length > 0 ? (
                techStackTags.map((tech) => <Badge key={tech}>{tech}</Badge>)
              ) : (
                <span className="text-sm text-gray-500">
                  {locale === "en" ? "No technologies selected" : "Sin tecnologías seleccionadas"}
                </span>
              )}
            </div>
          </div>
        </div>

        <EditProfileForm profile={profile} />
      </SectionCard>

      <UserTimelineCard events={timeline} locale={locale} />

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Activity streaks" : "Rachas de actividad"}
          description={
            locale === "en"
              ? "Your consistency over time."
              : "Tu consistencia en el tiempo."
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            label={locale === "en" ? "Current streak" : "Racha actual"}
            value={`${streaks.currentStreakDays} ${locale === "en" ? "days" : "días"}`}
          />
          <StatCard
            label={locale === "en" ? "Longest streak" : "Mejor racha"}
            value={`${streaks.longestStreakDays} ${locale === "en" ? "days" : "días"}`}
          />
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Verified contributions" : "Contribuciones verificadas"}
          description={
            locale === "en"
              ? "Validated through merged PRs and synced task completion."
              : "Validadas mediante PRs mergeados y finalización de tareas sincronizada."
          }
        />
        {verifiedContributions.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No verified contributions yet" : "Sin contribuciones verificadas todavía"}
            description={
              locale === "en"
                ? "Your merged PRs will appear here."
                : "Tus PRs mergeados aparecerán aquí."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {verifiedContributions.map((item) => (
              <article key={item.taskId} className="rounded-xl border border-white/15 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">{item.taskTitle}</p>
                <p className="mt-1 text-xs text-gray-400">{item.projectName}</p>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}
