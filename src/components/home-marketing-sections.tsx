import Link from "next/link";
import GitHubLoginButton from "@/components/github-login-button";
import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";

type HomeMarketingSectionsProps = {
  isAuthenticated: boolean;
};

const WORKFLOW_STEPS = [
  "Descubre un proyecto open source real",
  "Explora tareas alineadas a tu nivel",
  "Solicita una tarea y recibe feedback de maintainers",
  "Contribuye en GitHub con flujo profesional",
  "Construye experiencia demostrable y portfolio real",
];

const TECH_STACK = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C#",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Dart",
  "Flutter",
  "HTML",
  "CSS",
  "TailwindCSS",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST APIs",
  "Supabase",
  "Firebase",
  "Git",
  "GitHub",
  "GitLab",
  "Vercel",
  "Netlify",
  "AWS",
  "Azure",
  "GCP",
  "Prisma",
  "Jest",
  "Cypress",
  "Vitest",
  "Linux",
  "Bash",
  "Figma",
  "Postman",
  "Nginx",
  "Terraform",
  "FastAPI",
  "Django",
  "Express",
  "NestJS",
  "Vue",
  "Angular",
  "Svelte",
];

export default function HomeMarketingSections({ isAuthenticated }: HomeMarketingSectionsProps) {
  return (
    <>
      <SectionCard className="p-8">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">Cómo trabajamos</h2>
        <p className="mt-2 text-sm text-gray-400 md:text-base">
          Un flujo claro para que juniors pasen de “quiero contribuir” a experiencia real.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {WORKFLOW_STEPS.map((step, index) => (
            <article
              key={step}
              className="rounded-xl border border-white/15 bg-black/20 p-4 transition hover:border-orange-500/35 hover:bg-orange-500/5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                Paso {index + 1}
              </p>
              <p className="mt-2 text-sm text-gray-200">{step}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Qué es MiPrimerIssue</p>
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
          No es solo otra web de tareas: es una ruta real hacia experiencia open source
        </h2>
        <div className="mt-4 space-y-3 text-gray-300">
          <p>
            MiPrimerIssue existe para resolver el salto más difícil de un developer junior:
            conseguir experiencia demostrable cuando todavía no tiene historial en proyectos
            reales.
          </p>
          <p>
            Aquí descubres proyectos activos, solicitas tareas con contexto, colaboras en
            repositorios reales y conviertes cada contribución en una señal visible de progreso.
          </p>
          <p>
            El foco está en aprendizaje práctico, colaboración con maintainers y crecimiento
            continuo con métricas y logros conectados a tu trabajo en GitHub.
          </p>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tecnologías</p>
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
          Gana experiencia con un stack moderno y amplio
        </h2>
        <p className="mt-2 text-sm text-gray-400 md:text-base">
          Desde frontend hasta backend, cloud y tooling: prepara tu perfil para contribuir en
          equipos reales.
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {TECH_STACK.map((tech) => (
            <div
              key={tech}
              className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-gray-200 transition hover:border-orange-500/35 hover:bg-orange-500/10 hover:text-orange-200"
            >
              {tech}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="p-8 text-center">
        <Badge accent>MiPrimerIssue</Badge>
        <h2 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
          Convierte contribuciones en experiencia real
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-300">
          Empieza hoy con tu primer issue y construye un portfolio que demuestre lo que sabes
          hacer en proyectos open source.
        </p>
        <div className="mt-6 flex justify-center">
          {isAuthenticated ? (
            <Link
              href="/projects"
              className="inline-flex rounded-xl border border-orange-500/40 bg-orange-500/10 px-7 py-3 text-sm font-semibold text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              Ver oportunidades en MiPrimerIssue
            </Link>
          ) : (
            <GitHubLoginButton
              label="Únete a MiPrimerIssue con GitHub"
              className="rounded-xl px-7 py-3 font-semibold"
            />
          )}
        </div>
      </SectionCard>
    </>
  );
}

