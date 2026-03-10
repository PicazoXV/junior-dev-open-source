import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <section
      className={`rounded-2xl border border-white/20 bg-neutral-900/85 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_26px_rgba(255,255,255,0.07),0_0_28px_rgba(249,115,22,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}
