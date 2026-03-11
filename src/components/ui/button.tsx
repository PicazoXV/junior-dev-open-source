import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "accent" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "border-white/25 bg-neutral-900/90 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] hover:border-orange-400/70 hover:bg-neutral-900 hover:text-orange-300",
  accent:
    "border-orange-500/40 bg-orange-500/12 text-orange-200 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_18px_rgba(249,115,22,0.15)] hover:border-orange-400 hover:bg-orange-500/18 hover:text-orange-100",
  ghost:
    "border-white/15 bg-transparent text-gray-300 hover:border-orange-500/35 hover:bg-orange-500/10 hover:text-orange-300",
};

export default function Button({
  variant = "default",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-65 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
