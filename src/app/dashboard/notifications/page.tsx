import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  GitPullRequest,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import EmptyState from "@/components/ui/empty-state";
import Badge from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { getCurrentLocale } from "@/lib/i18n/server";
import {
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/dashboard/notifications/actions";
import type { NotificationRow } from "@/lib/notifications";

type NotificationTone = "success" | "warning" | "danger" | "info" | "default";

function getNotificationTone(type: string): NotificationTone {
  if (type === "request_approved" || type === "issue_created" || type === "repo_access_ready") {
    return "success";
  }

  if (type === "request_rejected" || type === "github_sync_failed") {
    return "danger";
  }

  if (type === "request_sent" || type === "new_task_request" || type === "repo_access_invited") {
    return "warning";
  }

  if (type === "repo_access_pending") {
    return "info";
  }

  return "default";
}

function getNotificationIcon(type: string) {
  if (type === "request_approved" || type === "repo_access_ready") return CheckCircle2;
  if (type === "request_rejected") return XCircle;
  if (type === "issue_created") return GitPullRequest;
  if (type === "new_task_request" || type === "request_sent") return MessageSquare;
  if (type === "repo_access_invited") return ShieldCheck;
  if (type === "github_sync_failed" || type === "repo_access_pending") return AlertTriangle;
  return BellRing;
}

function getNotificationAccentClass(tone: NotificationTone, isRead: boolean) {
  if (tone === "success") {
    return isRead ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-emerald-400/35 bg-emerald-500/12";
  }

  if (tone === "warning") {
    return isRead ? "border-orange-500/20 bg-orange-500/[0.06]" : "border-orange-400/35 bg-orange-500/12";
  }

  if (tone === "danger") {
    return isRead ? "border-red-500/20 bg-red-500/[0.06]" : "border-red-400/35 bg-red-500/12";
  }

  if (tone === "info") {
    return isRead ? "border-white/15 bg-white/[0.03]" : "border-orange-500/30 bg-orange-500/10";
  }

  return isRead ? "border-white/10 bg-white/[0.02]" : "border-orange-500/30 bg-orange-500/10";
}

export default async function NotificationsPage() {
  const locale = await getCurrentLocale();
  const user = await createProfileIfNeeded();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, link, metadata, is_read, created_at, read_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("Error loading notifications:", error.message);
  }

  const notifications = (data || []) as NotificationRow[];
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const readCount = notifications.length - unreadCount;

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="surface-accent relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.2),transparent_48%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-gray-300">
                <BellRing className="h-3.5 w-3.5 text-orange-300" />
                {locale === "en" ? "Activity center" : "Centro de actividad"}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                {locale === "en" ? "Notifications" : "Notificaciones"}
              </h1>
              <p className="mt-2 text-sm text-gray-200/90 md:text-base">
                {locale === "en"
                  ? "Updates about your requests, assignments, GitHub sync, and contribution progress."
                  : "Actualizaciones sobre tus solicitudes, asignaciones, sincronización con GitHub y tu progreso."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <form action={markAllNotificationsRead}>
                <button
                  type="submit"
                  className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  {locale === "en" ? "Mark all as read" : "Marcar todo como leído"}
                </button>
              </form>
              <Link
                href="/dashboard"
                className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-300"
              >
                {locale === "en" ? "Back to dashboard" : "Volver al dashboard"}
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="surface-subcard rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                {locale === "en" ? "Total events" : "Eventos totales"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{notifications.length}</p>
            </div>
            <div className="surface-subcard rounded-xl border-orange-500/30 bg-orange-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-orange-200/90">
                {locale === "en" ? "Unread" : "Sin leer"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-orange-200">{unreadCount}</p>
            </div>
            <div className="surface-subcard rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-gray-500">
                {locale === "en" ? "Read" : "Leídas"}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{readCount}</p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-6 md:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {locale === "en" ? "Recent events" : "Eventos recientes"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {locale === "en"
                ? "Everything that happened around your contribution flow."
                : "Todo lo que ha pasado alrededor de tu flujo de contribución."}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Badge tone="warning">
              {locale === "en" ? `${unreadCount} unread` : `${unreadCount} sin leer`}
            </Badge>
          ) : (
            <Badge tone="success">{locale === "en" ? "All read" : "Todo leído"}</Badge>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No notifications yet" : "Todavía no tienes notificaciones"}
            description={
              locale === "en"
                ? "When your requests are reviewed or your tasks move forward, this activity center will update automatically."
                : "Cuando revisen tus solicitudes o avancen tus tareas, este centro de actividad se actualizará automáticamente."
            }
            action={
              <Link
                href="/dashboard/my-requests"
                className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {locale === "en" ? "View my requests" : "Ver mis solicitudes"}
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const tone = getNotificationTone(notification.type);
              const accentClass = getNotificationAccentClass(tone, notification.is_read);
              const Icon = getNotificationIcon(notification.type);

              return (
                <article
                  key={notification.id}
                  className={`surface-subcard rounded-2xl border p-4 transition hover:border-orange-500/30 ${accentClass}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                          notification.is_read
                            ? "border-white/15 bg-white/[0.04] text-gray-300"
                            : "border-orange-500/35 bg-orange-500/14 text-orange-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{notification.title}</p>
                          <Badge tone={notification.is_read ? "default" : "warning"}>
                            {notification.is_read
                              ? locale === "en"
                                ? "Read"
                                : "Leída"
                              : locale === "en"
                                ? "Unread"
                                : "No leída"}
                          </Badge>
                        </div>
                        {notification.body ? (
                          <p className="mt-1 text-sm text-gray-300">{notification.body}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleString(
                            locale === "en" ? "en-US" : "es-ES"
                          )}
                        </p>
                      </div>
                    </div>

                    {!notification.is_read ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/35 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-200">
                        <Sparkles className="h-3 w-3" />
                        {locale === "en" ? "New" : "Nuevo"}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
                      >
                        {locale === "en" ? "Open" : "Abrir"}
                      </Link>
                    ) : null}
                    {!notification.is_read ? (
                      <form action={markNotificationRead.bind(null, notification.id)}>
                        <button
                          type="submit"
                          className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
                        >
                          {locale === "en" ? "Mark as read" : "Marcar como leída"}
                        </button>
                      </form>
                    ) : null}
                    <form action={deleteNotification.bind(null, notification.id)}>
                      <button
                        type="submit"
                        className="inline-flex rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition hover:border-red-400 hover:bg-red-500/15"
                      >
                        {locale === "en" ? "Delete" : "Borrar"}
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}
