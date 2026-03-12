import Link from "next/link";
import SectionCard from "@/components/ui/section-card";
import type { TimelineEvent } from "@/lib/user-timeline";

type UserTimelineCardProps = {
  events: TimelineEvent[];
  locale: "es" | "en";
  title?: string;
  description?: string;
  maxVisible?: number;
  withContainer?: boolean;
  showHeader?: boolean;
  containerClassName?: string;
};

export default function UserTimelineCard({
  events,
  locale,
  title,
  description,
  maxVisible,
  withContainer = true,
  showHeader = true,
  containerClassName,
}: UserTimelineCardProps) {
  const visibleEvents = typeof maxVisible === "number" ? events.slice(0, maxVisible) : events;
  const hiddenEvents = events.length - visibleEvents.length;
  const resolvedContainerClassName = containerClassName ?? (withContainer ? "p-6" : "");
  const headingTitle = title || (locale === "en" ? "Contribution timeline" : "Timeline de contribuciones");

  const content = (
    <>
      {showHeader ? <h3 className="text-lg font-semibold text-white">{headingTitle}</h3> : null}
      {showHeader && description ? <p className="mt-1 text-sm text-gray-400">{description}</p> : null}

      {events.length === 0 ? (
        <p className={`surface-subcard rounded-xl border-dashed p-4 text-sm text-gray-400 ${showHeader ? "mt-3" : ""}`}>
          {locale === "en"
            ? "No timeline events yet."
            : "Todavía no hay eventos en el timeline."}
        </p>
      ) : (
        <div className={`space-y-3 ${showHeader ? "mt-4" : ""}`}>
          {visibleEvents.map((event) => (
            <article key={event.id} className="surface-subcard rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-gray-300">{event.description}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(event.createdAt).toLocaleString(locale === "en" ? "en-US" : "es-ES")}
                  </p>
                </div>
                {event.link ? (
                  <Link
                    href={event.link}
                    className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-2.5 py-1 text-xs text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
                  >
                    {locale === "en" ? "Open" : "Abrir"}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
          {hiddenEvents > 0 ? (
            <p className="text-xs text-gray-500">
              {locale === "en"
                ? `Showing ${visibleEvents.length} of ${events.length} events.`
                : `Mostrando ${visibleEvents.length} de ${events.length} eventos.`}
            </p>
          ) : null}
        </div>
      )}
    </>
  );

  if (!withContainer) {
    return <div className={resolvedContainerClassName}>{content}</div>;
  }

  return <SectionCard className={resolvedContainerClassName}>{content}</SectionCard>;
}
