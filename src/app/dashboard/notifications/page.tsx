import Link from "next/link";
import { redirect } from "next/navigation";
import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
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

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl">
      <SectionCard className="p-8">
        <PageHeader
          title={locale === "en" ? "Notifications" : "Notificaciones"}
          description={
            locale === "en"
              ? "Updates about your requests, tasks, GitHub sync, and achievements."
              : "Actualizaciones sobre tus solicitudes, tareas, sync con GitHub y logros."
          }
          actions={
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
          }
        />

        {notifications.length === 0 ? (
          <EmptyState
            title={locale === "en" ? "No notifications yet" : "Todavía no tienes notificaciones"}
            description={
              locale === "en"
                ? "When requests are reviewed or tasks move forward, you will see updates here."
                : "Cuando se revisen solicitudes o avancen tus tareas, verás actualizaciones aquí."
            }
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-xl border p-4 ${
                  notification.is_read
                    ? "border-white/10 bg-black/20"
                    : "border-orange-500/35 bg-orange-500/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{notification.title}</p>
                    {notification.body ? (
                      <p className="mt-1 text-sm text-gray-300">{notification.body}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString(
                        locale === "en" ? "en-US" : "es-ES"
                      )}
                    </p>
                  </div>
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

                <div className="mt-3 flex flex-wrap gap-2">
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
            ))}
          </div>
        )}
      </SectionCard>
    </AppLayout>
  );
}
