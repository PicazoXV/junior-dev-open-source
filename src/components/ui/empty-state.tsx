import type { ReactNode } from "react";
import SectionCard from "@/components/ui/section-card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <SectionCard className="surface-subcard border-dashed p-10 text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </SectionCard>
  );
}
