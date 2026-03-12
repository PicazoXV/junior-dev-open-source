"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import {
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "@/lib/theme";

function persistTheme(theme: AppTheme) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${maxAge}; samesite=lax`;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}

type ThemeModeToggleProps = {
  initialTheme: AppTheme;
  forceExpanded?: boolean;
};

export default function ThemeModeToggle({ initialTheme, forceExpanded = false }: ThemeModeToggleProps) {
  const { messages } = useI18n();
  const [theme, setTheme] = useState<AppTheme>(initialTheme);

  const isLightMode = theme === "light";
  const desktopRevealTextClass = forceExpanded
    ? "lg:max-w-[200px] lg:opacity-100"
    : "lg:max-w-0 lg:opacity-0 lg:group-hover:max-w-[200px] lg:group-hover:opacity-100 lg:group-focus-within:max-w-[200px] lg:group-focus-within:opacity-100";

  const toggleTheme = () => {
    const nextTheme: AppTheme = isLightMode ? "dark" : "light";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    persistTheme(nextTheme);
  };

  return (
    <button
      type="button"
      aria-pressed={isLightMode}
      onClick={toggleTheme}
      title={isLightMode ? messages.themeMode.light : messages.themeMode.dark}
      data-theme-mode-toggle="true"
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
        isLightMode
          ? "border-orange-500/45 bg-orange-500/15 text-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.15)]"
          : "border-white/10 text-gray-300 hover:border-orange-500/30 hover:bg-white/5 hover:text-orange-200"
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
    >
      {isLightMode ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
      <span
        data-theme-mode-toggle-label="true"
        className={`max-w-[200px] overflow-hidden whitespace-nowrap font-semibold uppercase tracking-[0.12em] opacity-100 transition-all duration-300 ${desktopRevealTextClass}`}
      >
        {isLightMode ? messages.themeMode.light : messages.themeMode.dark}
      </span>
    </button>
  );
}
