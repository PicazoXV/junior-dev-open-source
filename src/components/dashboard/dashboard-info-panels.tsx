"use client";

import type { ReactNode } from "react";
import CollapsibleCard from "@/components/ui/collapsible-card";
import { useI18n } from "@/lib/i18n/client";

type DashboardInfoPanelsProps = {
  primerIssuePanel: ReactNode;
  onboardingPanel: ReactNode;
  roadmapPanel: ReactNode;
};

export default function DashboardInfoPanels({
  primerIssuePanel,
  onboardingPanel,
  roadmapPanel,
}: DashboardInfoPanelsProps) {
  const { messages } = useI18n();

  return (
    <div className="space-y-3">
      <CollapsibleCard
        title={messages.dashboardPanels.primerIssueTitle}
        description={messages.dashboardPanels.primerIssueDesc}
      >
        {primerIssuePanel}
      </CollapsibleCard>

      <CollapsibleCard
        title={messages.dashboardPanels.onboardingTitle}
        description={messages.dashboardPanels.onboardingDesc}
      >
        {onboardingPanel}
      </CollapsibleCard>

      <CollapsibleCard
        title={messages.dashboardPanels.roadmapTitle}
        description={messages.dashboardPanels.roadmapDesc}
      >
        {roadmapPanel}
      </CollapsibleCard>
    </div>
  );
}

