import { createBrowserClient } from "@supabase/ssr";

declare global {
  interface Window {
    __MIPRIMERISSUE_ENV?: {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    };
  }
}

function getRuntimeEnvConfig() {
  if (typeof window === "undefined") return null;

  const config = window.__MIPRIMERISSUE_ENV;
  if (!config) return null;

  const supabaseUrl = config.supabaseUrl?.trim();
  const supabaseAnonKey = config.supabaseAnonKey?.trim();

  if (!supabaseUrl || !supabaseAnonKey) return null;

  return { supabaseUrl, supabaseAnonKey };
}

export function createClient() {
  const runtimeConfig = getRuntimeEnvConfig();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || runtimeConfig?.supabaseUrl;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || runtimeConfig?.supabaseAnonKey;

  return createBrowserClient(
    supabaseUrl!,
    supabaseAnonKey!
  );
}
