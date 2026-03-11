"use client";

import Link from "next/link";
import type { UserOnboardingState } from "@/lib/onboarding";
import OnboardingStepCard from "@/components/onboarding-step-card";
import { useI18n } from "@/lib/i18n/client";

type OnboardingChecklistProps = {
  onboarding: UserOnboardingState;
};

export default function OnboardingChecklist({ onboarding }: OnboardingChecklistProps) {
  const { messages, locale } = useI18n();

  return (
    <section
      className={`rounded-2xl p-6 ${
        onboarding.isCompleted
          ? "surface-outline-accent border-emerald-500/25 bg-emerald-500/5"
          : "surface-card"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-orange-300">{messages.onboarding.label}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{messages.onboarding.title}</h2>
          <p className="mt-1 text-sm text-gray-300">{onboarding.motivationMessage}</p>
        </div>

        <div className="surface-subcard rounded-xl px-3 py-2 text-right">
          <p className="text-xs text-gray-400">{messages.onboarding.progress}</p>
          <p className="text-sm font-semibold text-white">
            {onboarding.completedSteps}/{onboarding.totalSteps} {locale === "en" ? "steps" : "pasos"}
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-orange-400/80 transition-all duration-500"
          style={{ width: `${onboarding.completionPercent}%` }}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {onboarding.steps.map((step) => (
          <OnboardingStepCard key={step.id} step={step} />
        ))}
      </div>

      {onboarding.isCompleted ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/dashboard/my-tasks"
            className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
          >
            {messages.onboarding.completedCtaTasks}
          </Link>
          <Link
            href="/developers"
            className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
          >
            {messages.onboarding.completedCtaLeaderboard}
          </Link>
          <Link
            href="/buena-primera-issue"
            className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
          >
            {messages.onboarding.completedCtaExplore}
          </Link>
        </div>
      ) : onboarding.nextStep ? (
        <div className="surface-subcard mt-5 rounded-xl p-3 text-sm text-gray-300">
          {messages.onboarding.nextStep} <span className="font-semibold text-white">{onboarding.nextStep.title}</span>
        </div>
      ) : null}
    </section>
  );
}
