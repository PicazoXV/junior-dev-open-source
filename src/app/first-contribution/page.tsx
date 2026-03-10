import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import { getCurrentLocale } from "@/lib/i18n/server";

const STEPS_ES = [
  {
    title: "Qué es open source",
    description:
      "Open source es colaboración pública sobre software real. Puedes aprender contribuyendo con cambios pequeños y útiles.",
  },
  {
    title: "Cómo elegir tu primera tarea",
    description:
      "Empieza por tareas con etiquetas como good first issue, documentation, testing o frontend básico.",
  },
  {
    title: "Haz fork del repositorio",
    description:
      "Crea tu copia del proyecto en GitHub para trabajar con seguridad y sin afectar directamente la rama principal.",
  },
  {
    title: "Crea una branch por tarea",
    description:
      "Usa nombres claros como fix/login-error o docs/api-guide para mantener ordenado tu trabajo.",
  },
  {
    title: "Abre tu Pull Request",
    description:
      "Describe qué cambiaste, por qué y cómo probarlo. Pide revisión y responde feedback de maintainers.",
  },
  {
    title: "Cómo te ayuda PrimerIssue",
    description:
      "Aquí puedes descubrir proyectos, solicitar tareas, colaborar con maintainers y construir experiencia demostrable conectada a GitHub.",
  },
];

const STEPS_EN = [
  {
    title: "What open source is",
    description:
      "Open source means public collaboration on real software. You can learn by contributing small and useful changes.",
  },
  {
    title: "How to choose your first task",
    description:
      "Start with tasks labeled good first issue, documentation, testing, or basic frontend.",
  },
  {
    title: "Fork the repository",
    description:
      "Create your own copy of the project on GitHub to work safely without affecting the main branch directly.",
  },
  {
    title: "Create one branch per task",
    description:
      "Use clear names like fix/login-error or docs/api-guide to keep your work organized.",
  },
  {
    title: "Open your Pull Request",
    description:
      "Describe what changed, why, and how to test it. Request review and respond to maintainer feedback.",
  },
  {
    title: "How PrimerIssue helps you",
    description:
      "Here you can discover projects, request tasks, collaborate with maintainers, and build demonstrable experience connected to GitHub.",
  },
];

export default async function FirstContributionPage() {
  const locale = await getCurrentLocale();
  const steps = locale === "en" ? STEPS_EN : STEPS_ES;

  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title={
            locale === "en"
              ? "How to make your first open source contribution"
              : "Cómo hacer tu primera contribución open source"
          }
          description={
            locale === "en"
              ? "Quick guide to go from zero to your first real contribution."
              : "Guía rápida para pasar de cero a tu primer aporte real."
          }
        />

        <div className="grid gap-3 md:grid-cols-2">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-orange-300">
                {locale === "en" ? "Step" : "Paso"} {index + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-300">{step.description}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppLayout>
  );
}
