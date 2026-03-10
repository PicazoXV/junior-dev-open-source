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

export default function HardModeToggle() {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const [isPending, startTransition] = useTransition();

  const isHardMode = locale === "en";

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
      title={messages.hardMode.title}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
        isHardMode
          ? "border-orange-500/40 bg-orange-500/15 text-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.15)]"
          : "border-white/10 text-gray-300 hover:border-orange-500/30 hover:bg-white/5 hover:text-orange-200"
      } ${isPending ? "cursor-not-allowed opacity-80" : ""}`}
    >
      <Skull className="h-5 w-5 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-semibold uppercase tracking-[0.12em] text-yellow-300 opacity-0 transition-all duration-300 group-hover:max-w-[200px] group-hover:opacity-100">
        {messages.hardMode.title}
      </span>
    </button>
  );
}
