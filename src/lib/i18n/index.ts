import type { AppLocale, MessageDictionary } from "@/lib/i18n/types";
import { esMessages } from "@/messages/es";
import { enMessages } from "@/messages/en";

export const LOCALE_COOKIE_NAME = "primerissue_locale";
export const DEFAULT_LOCALE: AppLocale = "es";

export const allMessages: Record<AppLocale, MessageDictionary> = {
  es: esMessages,
  en: enMessages,
};

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return value === "en" ? "en" : "es";
}

export function getMessages(locale: AppLocale) {
  return allMessages[locale] || allMessages[DEFAULT_LOCALE];
}
