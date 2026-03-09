import Link from "next/link";

type TaskCardProps = {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: "open" | "assigned" | "in_review" | "completed" | "closed";
    difficulty: "beginner" | "intermediate" | "advanced" | null;
  };
};

function getPreview(text: string | null, maxLength = 140) {
  if (!text) {
    return "Sin descripción disponible.";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <article className="rounded-xl border p-5">
      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>

      <p className="mt-2 text-sm text-gray-600">{getPreview(task.description)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          Estado: {task.status}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          Dificultad: {task.difficulty || "No especificada"}
        </span>
      </div>

      <Link
        href={`/tasks/${task.id}`}
        className="mt-5 inline-flex rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-100"
      >
        Ver tarea
      </Link>
    </article>
  );
}
