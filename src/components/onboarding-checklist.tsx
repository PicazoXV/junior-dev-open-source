import Link from "next/link";
import type { UserOnboardingState } from "@/lib/onboarding";
import OnboardingStepCard from "@/components/onboarding-step-card";

type OnboardingChecklistProps = {
  onboarding: UserOnboardingState;
};

export default function OnboardingChecklist({ onboarding }: OnboardingChecklistProps) {
  return (
    <section
      className={`rounded-2xl border p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_22px_rgba(255,255,255,0.05)] ${
        onboarding.isCompleted
          ? "border-emerald-500/25 bg-emerald-500/5"
          : "border-white/20 bg-black/20"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-orange-300">Onboarding</p>
          <h2 className="mt-1 text-xl font-semibold text-white">🚀 Empieza en PrimerIssue</h2>
          <p className="mt-1 text-sm text-gray-300">{onboarding.motivationMessage}</p>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-right">
          <p className="text-xs text-gray-400">Progreso</p>
          <p className="text-sm font-semibold text-white">
            {onboarding.completedSteps}/{onboarding.totalSteps} pasos
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
            Ver mis tareas
          </Link>
          <Link
            href="/developers"
            className="inline-flex rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-gray-200 hover:border-orange-500/35 hover:text-orange-300"
          >
            Ver leaderboard
          </Link>
          <Link
            href="/good-first-issues"
            className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 hover:border-orange-400"
          >
            Explorar nuevas tareas
          </Link>
        </div>
      ) : onboarding.nextStep ? (
        <div className="mt-5 rounded-xl border border-white/15 bg-black/20 p-3 text-sm text-gray-300">
          Siguiente paso recomendado: <span className="font-semibold text-white">{onboarding.nextStep.title}</span>
        </div>
      ) : null}
    </section>
  );
}
