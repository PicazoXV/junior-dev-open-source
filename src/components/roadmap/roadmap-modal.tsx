"use client";

import { X, GitPullRequest, CheckCircle2, FolderKanban, ListChecks, ClipboardCheck, UserCheck } from "lucide-react";
import Button from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

type RoadmapModalProps = {
  open: boolean;
  onClose: () => void;
};

const stepIcons = [
  FolderKanban,
  ListChecks,
  ClipboardCheck,
  UserCheck,
  CheckCircle2,
  GitPullRequest,
  CheckCircle2,
];

export default function RoadmapModal({ open, onClose }: RoadmapModalProps) {
  const { messages } = useI18n();

  if (!open) {
    return null;
  }

  const steps = [
    { title: messages.roadmapGuide.step1Title, description: messages.roadmapGuide.step1Desc },
    { title: messages.roadmapGuide.step2Title, description: messages.roadmapGuide.step2Desc },
    { title: messages.roadmapGuide.step3Title, description: messages.roadmapGuide.step3Desc },
    { title: messages.roadmapGuide.step4Title, description: messages.roadmapGuide.step4Desc },
    { title: messages.roadmapGuide.step5Title, description: messages.roadmapGuide.step5Desc },
    { title: messages.roadmapGuide.step6Title, description: messages.roadmapGuide.step6Desc },
    { title: messages.roadmapGuide.step7Title, description: messages.roadmapGuide.step7Desc },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-2xl border border-white/20 bg-neutral-900/95 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_36px_rgba(255,255,255,0.09),0_0_32px_rgba(249,115,22,0.1)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={messages.roadmapGuide.title}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-orange-300">MiPrimerIssue</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{messages.roadmapGuide.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">{messages.roadmapGuide.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-black/30 p-2 text-gray-300 transition hover:border-orange-500/40 hover:text-orange-300"
            aria-label={messages.roadmapGuide.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];

            return (
              <article key={step.title} className="rounded-xl border border-white/15 bg-black/25 p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-orange-500/35 bg-orange-500/10 text-xs font-semibold text-orange-300">
                    {index + 1}
                  </span>
                  <Icon className="mt-0.5 h-4 w-4 text-gray-300" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm text-gray-300">{step.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-5 text-sm text-gray-400">{messages.roadmapGuide.note}</p>

        <div className="mt-5 flex justify-end">
          <Button onClick={onClose}>{messages.roadmapGuide.close}</Button>
        </div>
      </section>
    </div>
  );
}

