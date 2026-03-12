"use client";

import { useTransition } from "react";
import { Skull } from "lucide-react";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";

function setLocaleCookie(value: "es" | "en") {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; samesite=lax`;
}

type HardModeToggleProps = {
  forceExpanded?: boolean;
};

export default function HardModeToggle({ forceExpanded = false }: HardModeToggleProps) {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const [isPending, startTransition] = useTransition();

  const isHardMode = locale === "en";
  const desktopRevealTextClass = forceExpanded
    ? "lg:max-w-[200px] lg:opacity-100"
    : "lg:max-w-0 lg:opacity-0 lg:group-hover:max-w-[200px] lg:group-hover:opacity-100 lg:group-focus-within:max-w-[200px] lg:group-focus-within:opacity-100";

  const toggle = () => {
    const nextLocale = isHardMode ? DEFAULT_LOCALE : "en";
    setLocaleCookie(nextLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={isHardMode}
      aria-label={messages.hardMode.title}
      title={messages.hardMode.title}
      data-hard-mode-toggle="true"
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
        isHardMode
          ? "border-orange-500/40 bg-orange-500/15 text-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.15)]"
          : "border-white/10 text-gray-300 hover:border-orange-500/30 hover:bg-white/5 hover:text-orange-200"
      } ${isPending ? "cursor-not-allowed opacity-80" : ""} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
    >
      <Skull className="h-5 w-5 shrink-0" />
      <span
        data-hard-mode-toggle-label="true"
        className={`max-w-[200px] overflow-hidden whitespace-nowrap font-semibold uppercase tracking-[0.12em] text-yellow-300 opacity-100 transition-all duration-300 ${desktopRevealTextClass}`}
      >
        {messages.hardMode.title}
      </span>
    </button>
  );
}
