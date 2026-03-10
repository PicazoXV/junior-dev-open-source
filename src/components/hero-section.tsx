import Link from "next/link";
import GitHubLoginButton from "@/components/github-login-button";
import SectionCard from "@/components/ui/section-card";

type HeroSectionProps = {
  isAuthenticated: boolean;
};

export default function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <SectionCard className="p-8 md:p-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-gray-500">
          Junior Dev Open Source
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Contribuye a proyectos open source reales
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 md:text-lg">
          Descubre proyectos open source, solicita tareas y colabora con maintainers
          para ganar experiencia real como desarrollador.
        </p>

        <div className="mt-8 flex justify-center">
          {isAuthenticated ? (
            <Link
              href="/projects"
              className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-5 py-3 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              Explorar proyectos
            </Link>
          ) : (
            <GitHubLoginButton />
          )}
        </div>
      </div>
    </SectionCard>
  );
}
