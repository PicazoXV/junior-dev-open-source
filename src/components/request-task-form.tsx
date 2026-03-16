"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { requestTaskAction, type RequestTaskResult } from "@/app/tasks/[id]/actions";
import { useI18n } from "@/lib/i18n/client";
import GitHubLoginButton from "@/components/github-login-button";

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
  const requiresLogin =
    state.status === "error" &&
    /(iniciar sesión|sign in)/i.test(state.message);

  return (
    <form action={formAction} className="surface-subcard rounded-2xl border border-orange-500/30 p-6">
      <input type="hidden" name="taskId" value={taskId} />

      <p className="mb-4 text-sm text-gray-300">
        {locale === "en"
          ? "Claim this task now and let a maintainer review your request."
          : "Solicita esta tarea ahora y deja que un maintainer revise tu solicitud."}
      </p>

      {state.message ? (
        <p
          className={`mb-3 text-sm ${
            state.status === "success"
              ? "text-emerald-300"
              : requiresLogin
                ? "text-orange-200"
                : "text-gray-300"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {requiresLogin ? (
        <div className="mb-4">
          <GitHubLoginButton
            label={locale === "en" ? "Sign in to continue" : "Inicia sesión para continuar"}
            className="w-full rounded-xl px-5 py-3 text-sm font-semibold"
            nextPath={`/tasks/${taskId}`}
          />
        </div>
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
          className="cta-primary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold tracking-[0.01em] transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Send className="h-4.5 w-4.5" />
          {pending
            ? locale === "en"
              ? "Sending..."
              : "Enviando..."
            : locale === "en"
              ? "Request this task"
              : "Solicitar esta tarea"}
        </button>
      ) : null}
    </form>
  );
}
