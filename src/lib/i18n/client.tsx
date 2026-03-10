"use client";

import { createContext, useContext, useMemo } from "react";
import type { AppLocale, MessageDictionary } from "@/lib/i18n/types";

type I18nContextValue = {
  locale: AppLocale;
  messages: MessageDictionary;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  locale: AppLocale;
  messages: MessageDictionary;
  children: React.ReactNode;
};

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n debe usarse dentro de I18nProvider");
  }

  return context;
}
