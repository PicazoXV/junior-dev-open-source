"use client";

import { useMemo, useState } from "react";
import TaskCard from "@/components/task-card";
import EmptyState from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n/client";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "assigned" | "in_review" | "completed" | "closed";
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  estimated_minutes?: number | null;
  labels: string[] | null;
  github_issue_url?: string | null;
};

type TaskFilterPanelProps = {
  tasks: TaskItem[];
};

export default function TaskFilterPanel({ tasks }: TaskFilterPanelProps) {
  const { locale } = useI18n();
  const [difficulty, setDifficulty] = useState<string>("all");
  const [label, setLabel] = useState<string>("all");

  const labels = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((task) => {
      (task.labels || []).forEach((value) => set.add(value));
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const matchDifficulty = difficulty === "all" || task.difficulty === difficulty;
      const matchLabel = label === "all" || (task.labels || []).includes(label);
      return matchDifficulty && matchLabel;
    });
  }, [difficulty, label, tasks]);

  return (
    <div className="space-y-4">
      <div className="surface-subcard grid gap-3 rounded-xl p-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-gray-500">
            {locale === "en" ? "Difficulty" : "Dificultad"}
          </label>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="form-control form-select"
          >
            <option value="all">{locale === "en" ? "All" : "Todas"}</option>
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.12em] text-gray-500">
            {locale === "en" ? "Label" : "Etiqueta"}
          </label>
          <select
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="form-control form-select"
          >
            <option value="all">{locale === "en" ? "All" : "Todas"}</option>
            {labels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={locale === "en" ? "No tasks for these filters" : "No hay tareas para estos filtros"}
          description={
            locale === "en"
              ? "Try a different combination of difficulty or labels."
              : "Prueba otra combinación de dificultad o etiqueta."
          }
        />
      )}
    </div>
  );
}
