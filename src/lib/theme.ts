export type AppTheme = "dark" | "light";

export const THEME_COOKIE_NAME = "miprimerissue_theme";
export const THEME_STORAGE_KEY = "miprimerissue_theme";
export const DEFAULT_THEME: AppTheme = "dark";

export function normalizeTheme(value: string | null | undefined): AppTheme {
  return value === "light" ? "light" : "dark";
}
