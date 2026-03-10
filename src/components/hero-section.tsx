import Link from "next/link";
import GitHubLoginButton from "@/components/github-login-button";
import SectionCard from "@/components/ui/section-card";

type HeroSectionProps = {
  isAuthenticated: boolean;
};

export default function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <SectionCard className="p-8 md:p-12">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.22em] text-gray-500">
          MiPrimerIssue · miprimerissue.dev
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
          Únete a nosotros y gana experiencia demostrable
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base text-gray-300 md:text-lg">
          MiPrimerIssue conecta developers junior con proyectos open source reales para
          transformar tareas guiadas en contribuciones visibles, progreso medible y
          portfolio real en GitHub.
        </p>

        <div className="mt-10 flex justify-center">
          {isAuthenticated ? (
            <Link
              href="/projects"
              className="inline-flex rounded-xl border border-orange-500/40 bg-orange-500/10 px-8 py-3.5 text-base font-semibold text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              Explorar proyectos
            </Link>
          ) : (
            <GitHubLoginButton
              label="Empezar con GitHub"
              className="rounded-xl px-8 py-3.5 text-base font-semibold"
            />
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Empieza por tareas adaptadas a tu nivel y conecta tu progreso con GitHub real.
        </p>
      </div>
    </SectionCard>
  );
}
