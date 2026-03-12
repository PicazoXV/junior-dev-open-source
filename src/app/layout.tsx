import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { getCurrentMessages } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { getSiteUrl } from "@/lib/site-url";
import { DEFAULT_THEME, normalizeTheme, THEME_COOKIE_NAME } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "MiPrimerIssue",
  description:
    "MiPrimerIssue conecta developers junior con proyectos open source reales para ganar experiencia demostrable.",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.svg?v=2", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getCurrentMessages();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE_NAME)?.value;
  const theme = normalizeTheme(themeCookie || DEFAULT_THEME);
  const browserEnvPayload = JSON.stringify({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  }).replace(/</g, "\\u003c");

  return (
    <html lang={locale} data-theme={theme}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          id="miprimerissue-runtime-env"
          dangerouslySetInnerHTML={{
            __html: `window.__MIPRIMERISSUE_ENV=${browserEnvPayload};`,
          }}
        />
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
