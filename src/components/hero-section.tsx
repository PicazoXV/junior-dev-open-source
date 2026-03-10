import Link from "next/link";
import GitHubLoginButton from "@/components/github-login-button";
import SectionCard from "@/components/ui/section-card";
import { getCurrentMessages } from "@/lib/i18n/server";

type HeroSectionProps = {
  isAuthenticated: boolean;
};

export default async function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const { messages } = await getCurrentMessages();

  return (
    <SectionCard className="relative overflow-hidden p-8 md:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.16),transparent_46%)]" />
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.22em] text-gray-500">
          {messages.brand.name} · {messages.brand.domain}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
          {messages.hero.heading}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base text-gray-300 md:text-lg">
          {messages.hero.description}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/projects"
                className="inline-flex rounded-xl border border-orange-500/40 bg-orange-500/10 px-8 py-3.5 text-base font-semibold text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {messages.hero.ctaAuth}
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <GitHubLoginButton
              label={messages.hero.ctaGuest}
              className="rounded-xl px-8 py-3.5 text-base font-semibold"
            />
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          {messages.hero.footnote}
        </p>
      </div>
    </SectionCard>
  );
}
