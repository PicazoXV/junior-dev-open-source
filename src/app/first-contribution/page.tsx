import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";

const STEPS = [
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
    title: "Cómo te ayuda MiPrimerIssue",
    description:
      "Aquí puedes descubrir proyectos, solicitar tareas, colaborar con maintainers y construir experiencia demostrable conectada a GitHub.",
  },
];

export default function FirstContributionPage() {
  return (
    <AppLayout containerClassName="mx-auto max-w-5xl space-y-6">
      <SectionCard className="p-8">
        <PageHeader
          title="How to make your first open source contribution"
          description="Guía rápida para pasar de cero a tu primer aporte real."
        />

        <div className="grid gap-3 md:grid-cols-2">
          {STEPS.map((step, index) => (
            <article key={step.title} className="rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-orange-300">
                Paso {index + 1}
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

