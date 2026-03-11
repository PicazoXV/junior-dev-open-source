import type { ReactNode } from "react";
import SectionCard from "@/components/ui/section-card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <SectionCard className="surface-subcard relative overflow-hidden border-dashed p-10 text-center">
      <span className="pointer-events-none absolute left-1/2 top-0 h-20 w-56 -translate-x-1/2 bg-[radial-gradient(circle,rgba(251,146,60,0.2)_0%,transparent_70%)]" />
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </SectionCard>
  );
}
