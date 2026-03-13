import type { ReactNode } from "react";
import SectionCard from "@/components/ui/section-card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <SectionCard className="surface-subcard relative isolate overflow-hidden border-dashed p-10 text-center">
      <span className="pointer-events-none absolute left-1/2 top-2 z-0 h-24 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.18)_0%,rgba(251,146,60,0.08)_35%,transparent_72%)] blur-sm" />
      <div className="relative z-10">
        <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
        <p className="mt-2 text-sm text-gray-400">{description}</p>
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </SectionCard>
  );
}
