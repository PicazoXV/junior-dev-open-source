"use client";

import { Github, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

const GITHUB_ORG_URL = "https://github.com/MiPrimerIssue";
const CONTACT_EMAIL = "info@miprimerissue.com";

export default function SiteFooter() {
  const { messages } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-white/10 pt-6 pb-3">
      <div className="surface-card rounded-2xl p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-2 md:items-center">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              {messages.footer.contactLabel}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-base font-semibold text-gray-100 transition hover:text-orange-300 md:text-lg"
            >
              <Mail className="h-4.5 w-4.5 text-orange-300" />
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="space-y-2 md:justify-self-end md:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
              {messages.footer.githubLabel}
            </p>
            <a
              href={GITHUB_ORG_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-base font-semibold text-gray-100 transition hover:text-orange-300 md:text-lg"
            >
              <Github className="h-4.5 w-4.5 text-orange-300" />
              github.com/MiPrimerIssue
            </a>
          </div>
        </div>

        <p className="mt-5 text-sm font-medium text-gray-400">
          © {currentYear} MiPrimerIssue. {messages.footer.rights}
        </p>
      </div>
    </footer>
  );
}
