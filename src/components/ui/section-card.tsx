import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ children, className = "" }: SectionCardProps) {
  const hasCustomSurface =
    className.includes("surface-accent") || className.includes("surface-subcard") || className.includes("surface-card");
  const surfaceClass = hasCustomSurface ? "" : "surface-card";

  return (
    <section
      className={`${surfaceClass} rounded-2xl p-6 ${className}`}
    >
      {children}
    </section>
  );
}
