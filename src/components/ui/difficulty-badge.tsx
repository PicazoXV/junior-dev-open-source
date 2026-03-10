"use client";

import Badge from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/client";
import { getDifficultyLabel } from "@/lib/i18n/labels";

type Difficulty = "beginner" | "intermediate" | "advanced" | null;

const tones: Record<Exclude<Difficulty, null>, "success" | "warning" | "danger"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
};

type DifficultyBadgeProps = {
  difficulty: Difficulty;
};

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const { locale } = useI18n();

  if (!difficulty) {
    return <Badge tone="default">{getDifficultyLabel(difficulty, locale)}</Badge>;
  }

  return <Badge tone={tones[difficulty]}>{getDifficultyLabel(difficulty, locale)}</Badge>;
}
