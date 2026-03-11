"use client";

import Link from "next/link";
import CollapsibleCard from "@/components/ui/collapsible-card";
import { useI18n } from "@/lib/i18n/client";

export default function DashboardFlowSteps() {
  const { locale } = useI18n();

  const isEn = locale === "en";

  const steps = [
    {
      id: "step-1",
      title: isEn ? "Step 1 - Find a task" : "Paso 1 - Encuentra una tarea",
      description: isEn
        ? "Explore projects and find tasks that match your current level and technologies."
        : "Explora proyectos y encuentra tareas que encajen con tu nivel y tecnologías actuales.",
      cta: isEn ? "Explore good first issues" : "Explorar good first issues",
      href: "/good-first-issues",
    },
    {
      id: "step-2",
      title: isEn ? "Step 2 - Request a task" : "Paso 2 - Solicita una tarea",
      description: isEn
        ? "When you find the right task, send your request so a maintainer can review and approve it."
        : "Cuando encuentres una tarea adecuada, envía tu solicitud para que un maintainer la revise y la apruebe.",
      cta: isEn ? "Go to my requests" : "Ir a mis solicitudes",
      href: "/dashboard/my-requests",
    },
    {
      id: "step-3",
      title: isEn ? "Step 3 - Work on GitHub" : "Paso 3 - Trabaja en GitHub",
      description: isEn
        ? "If assigned, start working in the repository and open your Pull Request with clear progress."
        : "Si te asignan la tarea, empieza a trabajar en el repositorio y abre tu Pull Request con progreso claro.",
      cta: isEn ? "Go to my tasks" : "Ir a mis tareas",
      href: "/dashboard/my-tasks",
    },
    {
      id: "step-4",
      title: isEn ? "Step 4 - Complete your contribution" : "Paso 4 - Completa tu contribución",
      description: isEn
        ? "When your PR is merged, your contribution appears in your progress timeline and public profile."
        : "Cuando tu PR se mergea, tu contribución queda reflejada en tu progreso y en tu perfil público.",
      cta: isEn ? "Review my progress" : "Revisar mi progreso",
      href: "/dashboard",
    },
  ];

  return (
    <section className="space-y-3">
      {steps.map((step, index) => (
        <CollapsibleCard
          key={step.id}
          title={step.title}
          description={step.description}
          accent={index === 0}
          defaultOpen={index === 0}
          headingAs="h3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-300">
              {isEn ? "Recommended next action:" : "Siguiente acción recomendada:"}
            </p>
            <Link
              href={step.href}
              className="inline-flex rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              {step.cta}
            </Link>
          </div>
        </CollapsibleCard>
      ))}
    </section>
  );
}
