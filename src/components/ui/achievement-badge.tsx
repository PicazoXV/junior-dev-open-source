import Badge from "@/components/ui/badge";
import type { UserBadge } from "@/lib/user-badges";

type AchievementBadgeProps = {
  badge: UserBadge;
};

export default function AchievementBadge({ badge }: AchievementBadgeProps) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        badge.unlocked
          ? "border-orange-500/35 bg-orange-500/10"
          : "border-white/15 bg-black/20 opacity-80"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">{badge.title}</h4>
        <Badge tone={badge.unlocked ? "warning" : "default"}>
          {badge.unlocked ? "Desbloqueado" : "Bloqueado"}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-gray-400">{badge.description}</p>
    </article>
  );
}

