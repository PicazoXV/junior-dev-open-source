import type { ReactNode } from "react";

type SectionCardVariant = "default" | "subtle" | "accent" | "hero";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
  variant?: SectionCardVariant;
  id?: string;
};

const variantClassMap: Record<SectionCardVariant, string> = {
  default: "surface-card",
  subtle: "surface-subcard",
  accent: "surface-accent",
  hero: "surface-hero",
};

export default function SectionCard({
  children,
  className = "",
  variant = "default",
  id,
}: SectionCardProps) {
  const hasCustomSurface =
    className.includes("surface-accent") ||
    className.includes("surface-subcard") ||
    className.includes("surface-card") ||
    className.includes("surface-hero");
  const surfaceClass = hasCustomSurface ? "" : variantClassMap[variant];

  return (
    <section
      id={id}
      className={`${surfaceClass} rounded-2xl p-6 ${className}`}
    >
      {children}
    </section>
  );
}
