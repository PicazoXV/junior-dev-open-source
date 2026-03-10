import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  accent?: boolean;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  default: "border-white/20 bg-white/5 text-gray-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  warning: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  danger: "border-rose-500/35 bg-rose-500/10 text-rose-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

export default function Badge({ children, accent = false, tone = "default" }: BadgeProps) {
  const classes = accent
    ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
    : toneClasses[tone];

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>
      {children}
    </span>
  );
}
