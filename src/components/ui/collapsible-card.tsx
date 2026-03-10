"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type CollapsibleCardProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export default function CollapsibleCard({
  title,
  description,
  defaultOpen = false,
  children,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-white/20 bg-neutral-900/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_0_20px_rgba(255,255,255,0.06)]">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-gray-400">{description}</p> : null}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-300 transition-transform duration-200 ${isOpen ? "rotate-180 text-orange-300" : ""}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 p-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

