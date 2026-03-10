import Link from "next/link";
import type { ComponentType } from "react";
import {
  Braces,
  Database,
  Cloud,
  Code2,
  Server,
  Boxes,
  GitBranch,
  ShieldCheck,
} from "lucide-react";
import GitHubLoginButton from "@/components/github-login-button";
import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";
import { getCurrentMessages } from "@/lib/i18n/server";

type HomeMarketingSectionsProps = {
  isAuthenticated: boolean;
};

const WORKFLOW_STEPS_ES = [
  "Descubre un proyecto open source real",
  "Explora tareas alineadas a tu nivel",
  "Solicita una tarea y recibe feedback de maintainers",
  "Contribuye en GitHub con flujo profesional",
  "Construye experiencia demostrable y portfolio real",
];

const WORKFLOW_STEPS_EN = [
  "Discover a real open source project",
  "Explore tasks aligned to your level",
  "Request a task and get maintainer feedback",
  "Contribute on GitHub with a professional flow",
  "Build demonstrable experience and a real portfolio",
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

type TechVisual = {
  icon: ComponentType<{ className?: string }>;
  category: string;
  iconClass: string;
  cardClass: string;
};

function getTechVisual(tech: string): TechVisual {
  const value = tech.toLowerCase();

  if (
    value.includes("postgres") ||
    value.includes("mysql") ||
    value.includes("mongo") ||
    value.includes("redis") ||
    value.includes("firebase") ||
    value.includes("supabase")
  ) {
    return {
      icon: Database,
      category: "Data",
      iconClass: "text-cyan-300",
      cardClass: "hover:border-cyan-400/40 hover:bg-cyan-500/5",
    };
  }

  if (
    value.includes("aws") ||
    value.includes("azure") ||
    value.includes("gcp") ||
    value.includes("vercel") ||
    value.includes("netlify")
  ) {
    return {
      icon: Cloud,
      category: "Cloud",
      iconClass: "text-sky-300",
      cardClass: "hover:border-sky-400/40 hover:bg-sky-500/5",
    };
  }

  if (
    value.includes("docker") ||
    value.includes("kubernetes") ||
    value.includes("terraform")
  ) {
    return {
      icon: Boxes,
      category: "DevOps",
      iconClass: "text-violet-300",
      cardClass: "hover:border-violet-400/40 hover:bg-violet-500/5",
    };
  }

  if (value.includes("git")) {
    return {
      icon: GitBranch,
      category: "Collab",
      iconClass: "text-amber-300",
      cardClass: "hover:border-amber-400/40 hover:bg-amber-500/5",
    };
  }

  if (value.includes("jest") || value.includes("cypress") || value.includes("vitest")) {
    return {
      icon: ShieldCheck,
      category: "Testing",
      iconClass: "text-emerald-300",
      cardClass: "hover:border-emerald-400/40 hover:bg-emerald-500/5",
    };
  }

  if (
    value.includes("node") ||
    value.includes("express") ||
    value.includes("nestjs") ||
    value.includes("django") ||
    value.includes("fastapi")
  ) {
    return {
      icon: Server,
      category: "Backend",
      iconClass: "text-orange-300",
      cardClass: "hover:border-orange-400/40 hover:bg-orange-500/5",
    };
  }

  if (
    value.includes("react") ||
    value.includes("next") ||
    value.includes("vue") ||
    value.includes("angular") ||
    value.includes("svelte")
  ) {
    return {
      icon: Braces,
      category: "Frontend",
      iconClass: "text-pink-300",
      cardClass: "hover:border-pink-400/40 hover:bg-pink-500/5",
    };
  }

  return {
    icon: Code2,
    category: "General",
    iconClass: "text-gray-300",
    cardClass: "hover:border-white/30 hover:bg-white/5",
  };
}

export default async function HomeMarketingSections({ isAuthenticated }: HomeMarketingSectionsProps) {
  const { locale, messages } = await getCurrentMessages();
  const workflowSteps = locale === "en" ? WORKFLOW_STEPS_EN : WORKFLOW_STEPS_ES;

  return (
    <>
      <SectionCard className="p-8">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">{messages.marketing.howWeWork}</h2>
        <p className="mt-2 text-sm text-gray-400 md:text-base">
          {messages.marketing.howWeWorkDesc}
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {workflowSteps.map((step, index) => (
            <article
              key={step}
              className="rounded-xl border border-white/15 bg-black/20 p-4 transition hover:border-orange-500/35 hover:bg-orange-500/5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                {messages.marketing.stepLabel} {index + 1}
              </p>
              <p className="mt-2 text-sm text-gray-200">{step}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{messages.marketing.aboutLabel}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
          {messages.marketing.aboutTitle}
        </h2>
        <div className="mt-4 space-y-3 text-gray-300">
          <p>{messages.marketing.aboutP1}</p>
          <p>{messages.marketing.aboutP2}</p>
          <p>{messages.marketing.aboutP3}</p>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{messages.marketing.techLabel}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
          {messages.marketing.techTitle}
        </h2>
        <p className="mt-2 text-sm text-gray-400 md:text-base">
          {messages.marketing.techDesc}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {TECH_STACK.map((tech) => {
            const visual = getTechVisual(tech);
            const Icon = visual.icon;

            return (
              <article
                key={tech}
                className={`group rounded-2xl border border-white/15 bg-neutral-900/80 p-4 transition ${visual.cardClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon className={`h-8 w-8 transition group-hover:scale-105 ${visual.iconClass}`} />
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-gray-400">
                    {visual.category}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-gray-100">{tech}</p>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard className="p-8 text-center">
        <Badge accent>{messages.brand.name}</Badge>
        <h2 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
          {messages.marketing.finalTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-gray-300">
          {messages.marketing.finalDesc}
        </p>
        <div className="mt-6 flex justify-center">
          {isAuthenticated ? (
            <Link
              href="/projects"
              className="inline-flex rounded-xl border border-orange-500/40 bg-orange-500/10 px-7 py-3 text-sm font-semibold text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              {messages.marketing.finalAuthCta}
            </Link>
          ) : (
            <GitHubLoginButton
              label={messages.marketing.finalGuestCta}
              className="rounded-xl px-7 py-3 font-semibold"
            />
          )}
        </div>
      </SectionCard>
    </>
  );
}
