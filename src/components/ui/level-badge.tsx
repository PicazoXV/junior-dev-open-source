"use client";

import Badge from "@/components/ui/badge";
import type { UserLevel } from "@/lib/user-progress";
import { useI18n } from "@/lib/i18n/client";
import { getLevelLabel } from "@/lib/i18n/labels";

type LevelBadgeProps = {
  level: UserLevel;
};

const levelTone: Record<UserLevel, "default" | "info" | "warning" | "success"> = {
  beginner: "default",
  junior: "info",
  contributor: "warning",
  maintainer: "success",
};

export default function LevelBadge({ level }: LevelBadgeProps) {
  const { locale } = useI18n();

  return <Badge tone={levelTone[level]}>{getLevelLabel(level, locale)}</Badge>;
}
