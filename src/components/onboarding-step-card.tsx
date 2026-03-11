"use client";

import Link from "next/link";
import type { OnboardingStep } from "@/lib/onboarding";
import type { MessageDictionary } from "@/lib/i18n/types";
import { useI18n } from "@/lib/i18n/client";

type OnboardingStepCardProps = {
  step: OnboardingStep;
};

function getStepIcon(status: OnboardingStep["status"]) {
  if (status === "completed") {
    return "✅";
  }

  if (status === "in_progress") {
    return "🟠";
  }

  return "⚪";
}

function getStatusLabel(status: OnboardingStep["status"], messages: MessageDictionary) {
  if (status === "completed") return messages.onboarding.stateCompleted;
  if (status === "in_progress") return messages.onboarding.stateInProgress;
  return messages.onboarding.statePending;
}

export default function OnboardingStepCard({ step }: OnboardingStepCardProps) {
  const { messages } = useI18n();

  return (
    <article className="surface-subcard rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {getStepIcon(step.status)} {step.title}
          </p>
          <p className="mt-1 text-xs text-gray-400">{step.description}</p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${
            step.status === "completed"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : step.status === "in_progress"
                ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                : "border-white/20 bg-white/5 text-gray-400"
          }`}
        >
          {getStatusLabel(step.status, messages)}
        </span>
      </div>

      {step.status !== "completed" ? (
        <div className="mt-3">
          <Link
            href={step.href}
            className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
          >
            {step.ctaLabel}
          </Link>
        </div>
      ) : null}
    </article>
  );
}
