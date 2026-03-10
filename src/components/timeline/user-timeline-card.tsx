import Link from "next/link";
import SectionCard from "@/components/ui/section-card";
import type { TimelineEvent } from "@/lib/user-timeline";

type UserTimelineCardProps = {
  events: TimelineEvent[];
  locale: "es" | "en";
  title?: string;
};

export default function UserTimelineCard({
  events,
  locale,
  title,
}: UserTimelineCardProps) {
  return (
    <SectionCard className="p-6">
      <h3 className="text-lg font-semibold text-white">
        {title || (locale === "en" ? "Contribution timeline" : "Timeline de contribuciones")}
      </h3>

      {events.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-white/20 bg-black/20 p-4 text-sm text-gray-400">
          {locale === "en"
            ? "No timeline events yet."
            : "Todavía no hay eventos en el timeline."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-xl border border-white/15 bg-black/20 p-4">
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
        </div>
      )}
    </SectionCard>
  );
}
