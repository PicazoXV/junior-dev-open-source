"use client";

import { useActionState } from "react";
import { requestTaskAction, type RequestTaskResult } from "@/app/tasks/[id]/actions";

type RequestTaskFormProps = {
  taskId: string;
  isTaskOpen: boolean;
};

const initialState: RequestTaskResult = {
  status: "idle",
  message: "",
};

export default function RequestTaskForm({ taskId, isTaskOpen }: RequestTaskFormProps) {
  const [state, formAction, pending] = useActionState(requestTaskAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="taskId" value={taskId} />

      {state.message ? (
        <p
          className={`mb-3 text-sm ${
            state.status === "success" ? "text-green-700" : "text-gray-600"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {!isTaskOpen && !state.message ? (
        <p className="mb-3 text-sm text-gray-600">Esta tarea ya no está disponible.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !isTaskOpen}
        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
      >
        {pending ? "Enviando..." : "Solicitar tarea"}
      </button>
    </form>
  );
}
