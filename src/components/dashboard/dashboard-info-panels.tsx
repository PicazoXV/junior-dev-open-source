"use client";

import type { ReactNode } from "react";
import CollapsibleCard from "@/components/ui/collapsible-card";
import { useI18n } from "@/lib/i18n/client";

type DashboardInfoPanelsProps = {
  primerIssuePanel: ReactNode;
  onboardingPanel: ReactNode;
  roadmapPanel: ReactNode;
  priorityPanel?: "primerIssue" | "onboarding" | "roadmap";
};

export default function DashboardInfoPanels({
  primerIssuePanel,
  onboardingPanel,
  roadmapPanel,
  priorityPanel = "primerIssue",
}: DashboardInfoPanelsProps) {
  const { messages } = useI18n();

  return (
    <div className="space-y-3">
      <CollapsibleCard
        title={messages.dashboardPanels.primerIssueTitle}
        description={messages.dashboardPanels.primerIssueDesc}
        accent={priorityPanel === "primerIssue"}
        defaultOpen={priorityPanel === "primerIssue"}
        headingAs="h3"
      >
        {primerIssuePanel}
      </CollapsibleCard>

      <CollapsibleCard
        title={messages.dashboardPanels.onboardingTitle}
        description={messages.dashboardPanels.onboardingDesc}
        accent={priorityPanel === "onboarding"}
        defaultOpen={priorityPanel === "onboarding"}
        headingAs="h3"
      >
        {onboardingPanel}
      </CollapsibleCard>

      <CollapsibleCard
        title={messages.dashboardPanels.roadmapTitle}
        description={messages.dashboardPanels.roadmapDesc}
        accent={priorityPanel === "roadmap"}
        defaultOpen={priorityPanel === "roadmap"}
        headingAs="h3"
      >
        {roadmapPanel}
      </CollapsibleCard>
    </div>
  );
}
