"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import Button from "@/components/ui/button";
import RoadmapModal from "@/components/roadmap/roadmap-modal";
import { useI18n } from "@/lib/i18n/client";

type DashboardRoadmapGuideProps = {
  userId: string;
  onboardingCompleted: boolean;
};

export default function DashboardRoadmapGuide({
  userId,
  onboardingCompleted,
}: DashboardRoadmapGuideProps) {
  const { messages } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const storageKey = useMemo(() => `primerissue:roadmap-guide-dismissed:${userId}`, [userId]);

  useEffect(() => {
    const hasClosedBefore = localStorage.getItem(storageKey) === "1";

    if (!hasClosedBefore) {
      const timeout = window.setTimeout(() => setIsOpen(true), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        localStorage.setItem(storageKey, "1");
        setShowToast(true);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, storageKey]);

  useEffect(() => {
    if (!showToast) {
      return;
    }

    const timeout = window.setTimeout(() => setShowToast(false), 3600);
    return () => window.clearTimeout(timeout);
  }, [showToast]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(storageKey, "1");
    setShowToast(true);
  };

  return (
    <>
      <div
        className={`rounded-xl border p-4 ${
          onboardingCompleted
            ? "border-white/15 bg-neutral-900/55"
            : "border-orange-500/35 bg-orange-500/5"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-orange-300">MiPrimerIssue</p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
              <BookOpen className="h-4 w-4 text-orange-300" />
              {messages.roadmapGuide.cardTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-300">{messages.roadmapGuide.cardDescription}</p>
          </div>
          <Button variant="accent" onClick={() => setIsOpen(true)}>
            {messages.roadmapGuide.cardCta}
          </Button>
        </div>
      </div>

      <RoadmapModal open={isOpen} onClose={handleClose} />

      {showToast ? (
        <div className="fixed bottom-6 left-1/2 z-[90] w-[min(92vw,680px)] -translate-x-1/2 rounded-xl border border-white/20 bg-neutral-900/95 px-4 py-3 text-sm text-gray-100 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_20px_rgba(255,255,255,0.08)]">
          {messages.roadmapGuide.toastReminder}
        </div>
      ) : null}
    </>
  );
}
