import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Braces,
  Cloud,
  Database,
  GitPullRequest,
  Layers,
  Search,
  Send,
  Server,
  Settings,
  Wrench,
} from "lucide-react";
import GitHubLoginButton from "@/components/github-login-button";
import SectionCard from "@/components/ui/section-card";
import Badge from "@/components/ui/badge";
import type { AppLocale } from "@/lib/i18n/types";

type NewHomeContentProps = {
  locale: AppLocale;
  isAuthenticated: boolean;
};

type TechCategory = "frontend" | "backend" | "database" | "cloud" | "devops" | "ai" | "tools";

type TechItem = {
  name: string;
  category: TechCategory;
};

const TECH_ITEMS: TechItem[] = [
  { name: "React", category: "frontend" },
  { name: "Next.js", category: "frontend" },
  { name: "TypeScript", category: "frontend" },
  { name: "TailwindCSS", category: "frontend" },
  { name: "Node.js", category: "backend" },
  { name: "Python", category: "backend" },
  { name: "Java", category: "backend" },
  { name: "Spring", category: "backend" },
  { name: "Go", category: "backend" },
  { name: "Rust", category: "backend" },
  { name: "PostgreSQL", category: "database" },
  { name: "MongoDB", category: "database" },
  { name: "Redis", category: "database" },
  { name: "Firebase", category: "database" },
  { name: "AWS", category: "cloud" },
  { name: "Kubernetes", category: "cloud" },
  { name: "Supabase", category: "cloud" },
  { name: "Docker", category: "devops" },
  { name: "GraphQL", category: "tools" },
  { name: "TensorFlow", category: "ai" },
  { name: "PyTorch", category: "ai" },
];

const CATEGORY_ORDER: TechCategory[] = [
  "frontend",
  "database",
  "cloud",
  "backend",
  "devops",
  "ai",
  "tools",
];

function distributeTechnologies(items: TechItem[]) {
  const grouped = new Map<TechCategory, TechItem[]>();

  for (const category of CATEGORY_ORDER) {
    grouped.set(category, []);
  }

  for (const item of items) {
    grouped.get(item.category)?.push(item);
  }

  const result: TechItem[] = [];
  let added = true;

  while (added) {
    added = false;
    for (const category of CATEGORY_ORDER) {
      const bucket = grouped.get(category);
      if (bucket && bucket.length > 0) {
        result.push(bucket.shift() as TechItem);
        added = true;
      }
    }
  }

  return result;
}

function getTechIcon(category: TechCategory) {
  if (category === "frontend") return Braces;
  if (category === "backend") return Server;
  if (category === "database") return Database;
  if (category === "cloud") return Cloud;
  if (category === "devops") return Settings;
  if (category === "ai") return Brain;
  return Wrench;
}

export default function NewHomeContent({ locale, isAuthenticated }: NewHomeContentProps) {
  const isEn = locale === "en";
  const flow = ["Find issue", "Request task", "Open PR", "Get merged", "Build portfolio"];
  const techGrid = distributeTechnologies(TECH_ITEMS);

  const sampleIssues = [
    { title: "Fix login validation", project: "Auth Starter", level: "beginner" },
    { title: "Add loading spinner", project: "UI Kit", level: "beginner" },
    { title: "Improve API docs", project: "Docs Hub", level: "beginner" },
    { title: "Refactor component", project: "Design System", level: "intermediate" },
  ];

  return (
    <div className="space-y-8">
      <SectionCard className="surface-accent relative overflow-hidden p-8 md:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.2),transparent_45%)]" />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
            {isEn
              ? "Make your first open source contribution even if you're junior."
              : "Haz tu primera contribución open source aunque seas junior."}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-gray-300 md:text-lg">
            {isEn
              ? "MiPrimerIssue connects junior developers with real open source tasks so they can build demonstrable experience."
              : "MiPrimerIssue conecta developers junior con tareas reales en proyectos open source para que construyan experiencia demostrable."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl border border-orange-500/40 bg-orange-500/10 px-7 py-3 text-sm font-semibold text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
              >
                {isEn ? "Go to dashboard" : "Ir al dashboard"}
              </Link>
            ) : (
              <GitHubLoginButton
                label={isEn ? "Sign in with GitHub" : "Entrar con GitHub"}
                className="rounded-xl px-7 py-3 text-sm font-semibold"
              />
            )}
            <Link
              href="/buena-primera-issue"
              className="inline-flex items-center rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
            >
              {isEn ? "View First Good Issue" : "Ver Buena Primera Issue"}
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {flow.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs text-gray-300">
                  {step}
                </span>
                {index < flow.length - 1 ? <ArrowRight className="h-3.5 w-3.5 text-orange-300" /> : null}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {isEn ? "How MiPrimerIssue works" : "Cómo funciona MiPrimerIssue"}
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: Search,
              title: isEn ? "Find a task" : "Encuentra una tarea",
              desc: isEn
                ? "Explore open source projects with tasks aligned to your level."
                : "Explora proyectos open source con tareas adecuadas a tu nivel.",
            },
            {
              icon: Send,
              title: isEn ? "Request to work on it" : "Solicita trabajar en ella",
              desc: isEn
                ? "Send a request to the project maintainer."
                : "Envía una solicitud al maintainer del proyecto.",
            },
            {
              icon: GitPullRequest,
              title: isEn ? "Contribute on GitHub" : "Contribuye en GitHub",
              desc: isEn
                ? "Work in the repository and open your pull request."
                : "Trabaja en el repositorio y abre tu Pull Request.",
            },
            {
              icon: BadgeCheck,
              title: isEn ? "Build real experience" : "Construye experiencia real",
              desc: isEn
                ? "Your contribution is recorded in your profile."
                : "Tu contribución queda registrada en tu perfil.",
            },
          ].map((item) => (
            <article key={item.title} className="surface-subcard rounded-xl p-4">
              <item.icon className="h-6 w-6 text-orange-300" />
              <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {isEn ? "Technologies you can contribute with" : "Tecnologías con las que puedes contribuir"}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {techGrid.map((tech) => {
            const Icon = getTechIcon(tech.category);
            return (
              <article key={tech.name} className="surface-subcard rounded-xl p-4 transition hover:border-orange-500/35">
                <Icon className="h-7 w-7 text-orange-300" />
                <p className="mt-3 text-sm font-medium text-gray-100">{tech.name}</p>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {isEn ? "Start your first contribution" : "Empieza con tu primera contribución"}
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sampleIssues.map((issue) => (
            <article key={issue.title} className="surface-subcard rounded-xl p-4">
              <p className="text-sm font-semibold text-white">{issue.title}</p>
              <p className="mt-1 text-xs text-gray-400">{issue.project}</p>
              <div className="mt-3">
                <Badge>{issue.level}</Badge>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5">
          <Link
            href="/buena-primera-issue"
            className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
          >
            {isEn ? "View all First Good Issues" : "Ver tareas de Buena Primera Issue"}
          </Link>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {isEn ? "Build your developer profile" : "Construye tu perfil como developer"}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-2 text-sm text-gray-300">
            <p>• {isEn ? "Completed tasks" : "Tareas completadas"}</p>
            <p>• {isEn ? "Merged PRs" : "PRs merged"}</p>
            <p>• {isEn ? "Contributed projects" : "Proyectos contribuidos"}</p>
            <p>• {isEn ? "Badges and achievements" : "Badges y logros"}</p>
            <p>• {isEn ? "Technologies" : "Tecnologías"}</p>
            <p>• {isEn ? "Public shareable profile" : "Perfil público compartible"}</p>
          </div>
          <article className="surface-subcard rounded-xl p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-gray-500">Developer profile</p>
            <p className="mt-2 text-sm font-semibold text-white">@junior-dev</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="surface-subcard rounded-lg p-2 text-gray-300">12 tasks</div>
              <div className="surface-subcard rounded-lg p-2 text-gray-300">9 PRs</div>
              <div className="surface-subcard rounded-lg p-2 text-gray-300">4 projects</div>
              <div className="surface-subcard rounded-lg p-2 text-gray-300">8 badges</div>
            </div>
          </article>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {isEn ? "Improve your skills" : "Mejora tus habilidades"}
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          {isEn
            ? "MiPrimerIssue also gives access to free certificate courses."
            : "MiPrimerIssue también ofrece acceso a cursos gratuitos con certificados."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Programación", "Cloud", "IA", "Inglés técnico"].map((item) => (
            <Badge key={item}>{item}</Badge>
          ))}
        </div>
        <div className="mt-5">
          {isAuthenticated ? (
            <Link
              href="/certificaciones"
              className="inline-flex rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              {isEn ? "View certifications" : "Ver certificaciones"}
            </Link>
          ) : (
            <GitHubLoginButton
              label={isEn ? "View certifications" : "Ver certificaciones"}
              className="rounded-lg px-3 py-2 text-sm font-medium"
            />
          )}
        </div>
      </SectionCard>

      <SectionCard className="surface-accent p-8 text-center md:p-10">
        <Layers className="mx-auto h-7 w-7 text-orange-300" />
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
          {isEn ? "Start your first open source contribution today." : "Empieza tu primera contribución open source hoy."}
        </h2>
        <div className="mt-6 flex justify-center">
          {isAuthenticated ? (
            <Link
              href="/buena-primera-issue"
              className="inline-flex rounded-xl border border-orange-500/40 bg-orange-500/10 px-8 py-3 text-sm font-semibold text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              {isEn ? "Explore tasks" : "Explorar tareas"}
            </Link>
          ) : (
            <GitHubLoginButton
              label={isEn ? "Sign in with GitHub" : "Entrar con GitHub"}
              className="rounded-xl px-8 py-3 text-sm font-semibold"
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
