import { cookies } from "next/headers";
import type { AppLocale } from "@/lib/i18n/types";
import { DEFAULT_LOCALE, getMessages, LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";

export async function getCurrentLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return normalizeLocale(cookieLocale || DEFAULT_LOCALE);
}

export async function getCurrentMessages() {
  const locale = await getCurrentLocale();
  return {
    locale,
    messages: getMessages(locale),
  };
}
