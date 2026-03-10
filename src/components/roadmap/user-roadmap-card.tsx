import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";
import type { UserRoadmap } from "@/lib/roadmap";

type UserRoadmapCardProps = {
  roadmap: UserRoadmap;
  locale: "es" | "en";
};

export default function UserRoadmapCard({ roadmap, locale }: UserRoadmapCardProps) {
  return (
    <SectionCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-orange-300">
            {locale === "en" ? "Roadmap" : "Roadmap"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {locale === "en" ? "Your path in MiPrimerIssue" : "Tu camino en MiPrimerIssue"}
          </h3>
        </div>
        <Badge tone="info">
          {roadmap.completed}/{roadmap.total}
        </Badge>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-orange-400 transition-all"
          style={{ width: `${roadmap.progressPercent}%` }}
        />
      </div>

      <div className="mt-5 grid gap-2">
        {roadmap.milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
              milestone.completed
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-white/15 bg-black/20"
            }`}
          >
            <span className="text-sm text-gray-200">{milestone.label}</span>
            <span className="text-xs">
              {milestone.completed
                ? locale === "en"
                  ? "Completed"
                  : "Completado"
                : locale === "en"
                  ? "Pending"
                  : "Pendiente"}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
