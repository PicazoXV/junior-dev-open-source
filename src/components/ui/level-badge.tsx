import Badge from "@/components/ui/badge";
import type { UserLevel } from "@/lib/user-progress";

type LevelBadgeProps = {
  level: UserLevel;
};

const levelLabel: Record<UserLevel, string> = {
  beginner: "Beginner",
  junior: "Junior",
  contributor: "Contributor",
  maintainer: "Maintainer",
};

const levelTone: Record<UserLevel, "default" | "info" | "warning" | "success"> = {
  beginner: "default",
  junior: "info",
  contributor: "warning",
  maintainer: "success",
};

export default function LevelBadge({ level }: LevelBadgeProps) {
  return <Badge tone={levelTone[level]}>{levelLabel[level]}</Badge>;
}
