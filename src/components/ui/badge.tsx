import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  accent?: boolean;
};

export default function Badge({ children, accent = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        accent
          ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
          : "border-white/20 bg-white/5 text-gray-300"
      }`}
    >
      {children}
    </span>
  );
}
