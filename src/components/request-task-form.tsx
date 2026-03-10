"use client";

import { useActionState } from "react";
import { requestTaskAction, type RequestTaskResult } from "@/app/tasks/[id]/actions";
import { useI18n } from "@/lib/i18n/client";

type RequestTaskFormProps = {
  taskId: string;
  isTaskOpen: boolean;
};

const initialState: RequestTaskResult = {
  status: "idle",
  message: "",
};

export default function RequestTaskForm({ taskId, isTaskOpen }: RequestTaskFormProps) {
  const { locale } = useI18n();
  const [state, formAction, pending] = useActionState(requestTaskAction, initialState);

  return (
    <form action={formAction} className="rounded-2xl border border-white/20 bg-black/20 p-6">
      <input type="hidden" name="taskId" value={taskId} />

      {state.message ? (
        <p
          className={`mb-3 text-sm ${
            state.status === "success" ? "text-emerald-300" : "text-gray-300"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {!isTaskOpen && !state.message ? (
        <p className="mb-3 text-sm text-gray-300">
          {locale === "en" ? "This task is no longer available." : "Esta tarea ya no está disponible."}
        </p>
      ) : null}

      {isTaskOpen ? (
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending
            ? locale === "en"
              ? "Sending..."
              : "Enviando..."
            : locale === "en"
              ? "Request task"
              : "Solicitar tarea"}
        </button>
      ) : null}
    </form>
  );
}
