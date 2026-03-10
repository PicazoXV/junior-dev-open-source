import Badge from "@/components/ui/badge";

type Difficulty = "beginner" | "intermediate" | "advanced" | null;

const labels: Record<Exclude<Difficulty, null>, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const tones: Record<Exclude<Difficulty, null>, "success" | "warning" | "danger"> = {
  beginner: "success",
  intermediate: "warning",
  advanced: "danger",
};

type DifficultyBadgeProps = {
  difficulty: Difficulty;
};

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  if (!difficulty) {
    return <Badge tone="default">No especificada</Badge>;
  }

  return <Badge tone={tones[difficulty]}>{labels[difficulty]}</Badge>;
}
