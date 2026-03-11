import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Brain,
  Braces,
  Cloud,
  Database,
  Flame,
  GitPullRequest,
  Layers2,
  Layers,
  Rocket,
  Search,
  Send,
  Server,
  Sparkles,
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
  { name: "JavaScript", category: "frontend" },
  { name: "TailwindCSS", category: "frontend" },
  { name: "Vue", category: "frontend" },
  { name: "Nuxt", category: "frontend" },
  { name: "Angular", category: "frontend" },
  { name: "Svelte", category: "frontend" },
  { name: "Astro", category: "frontend" },
  { name: "Vite", category: "frontend" },
  { name: "Redux", category: "frontend" },
  { name: "Zustand", category: "frontend" },
  { name: "Node.js", category: "backend" },
  { name: "Express", category: "backend" },
  { name: "NestJS", category: "backend" },
  { name: "Python", category: "backend" },
  { name: "FastAPI", category: "backend" },
  { name: "Django", category: "backend" },
  { name: "Flask", category: "backend" },
  { name: "Java", category: "backend" },
  { name: "Spring", category: "backend" },
  { name: "Kotlin", category: "backend" },
  { name: "Go", category: "backend" },
  { name: "Rust", category: "backend" },
  { name: "PHP", category: "backend" },
  { name: "Laravel", category: "backend" },
  { name: "Ruby on Rails", category: "backend" },
  { name: "C#", category: "backend" },
  { name: ".NET", category: "backend" },
  { name: "PostgreSQL", category: "database" },
  { name: "MySQL", category: "database" },
  { name: "MongoDB", category: "database" },
  { name: "Redis", category: "database" },
  { name: "SQLite", category: "database" },
  { name: "MariaDB", category: "database" },
  { name: "Firebase", category: "database" },
  { name: "Supabase", category: "database" },
  { name: "Elasticsearch", category: "database" },
  { name: "DynamoDB", category: "database" },
  { name: "AWS", category: "cloud" },
  { name: "GCP", category: "cloud" },
  { name: "Azure", category: "cloud" },
  { name: "Cloudflare", category: "cloud" },
  { name: "Vercel", category: "cloud" },
  { name: "Netlify", category: "cloud" },
  { name: "Kubernetes", category: "cloud" },
  { name: "Docker", category: "devops" },
  { name: "Linux", category: "devops" },
  { name: "Nginx", category: "devops" },
  { name: "Terraform", category: "devops" },
  { name: "GitHub Actions", category: "devops" },
  { name: "CI/CD", category: "devops" },
  { name: "GraphQL", category: "tools" },
  { name: "REST API", category: "tools" },
  { name: "Postman", category: "tools" },
  { name: "Prisma", category: "tools" },
  { name: "Jest", category: "tools" },
  { name: "Playwright", category: "tools" },
  { name: "Cypress", category: "tools" },
  { name: "Figma", category: "tools" },
  { name: "WebSockets", category: "tools" },
  { name: "OpenAI API", category: "ai" },
  { name: "LangChain", category: "ai" },
  { name: "TensorFlow", category: "ai" },
  { name: "PyTorch", category: "ai" },
  { name: "Hugging Face", category: "ai" },
  { name: "scikit-learn", category: "ai" },
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
  const flow = isEn
    ? ["Find issue", "Request task", "Open PR", "Get merged", "Build portfolio"]
    : ["Encuentra tarea", "Solicita tarea", "Abre PR", "Mergea", "Construye portfolio"];
  const techGrid = distributeTechnologies(TECH_ITEMS);
  const flowSteps = [
    {
      icon: Search,
      title: isEn ? "Find a task" : "Encuentra una tarea",
      desc: isEn
        ? "Browse beginner-friendly issues aligned with your stack and level."
        : "Explora tareas beginner-friendly alineadas a tu stack y nivel.",
    },
    {
      icon: Send,
      title: isEn ? "Request assignment" : "Solicita asignación",
      desc: isEn
        ? "Send your request so the maintainer can approve you quickly."
        : "Envía tu solicitud para que el maintainer pueda aprobarte rápido.",
    },
    {
      icon: GitPullRequest,
      title: isEn ? "Work on GitHub" : "Trabaja en GitHub",
      desc: isEn
        ? "Contribute in the repository and open your pull request with confidence."
        : "Contribuye en el repositorio y abre tu pull request con confianza.",
    },
    {
      icon: BadgeCheck,
      title: isEn ? "Grow your profile" : "Haz crecer tu perfil",
      desc: isEn
        ? "Get visible progress, achievements, and public proof of your experience."
        : "Consigue progreso visible, logros y prueba pública de tu experiencia.",
    },
  ];
  const techCategoryCount = CATEGORY_ORDER.map((category) => ({
    category,
    count: TECH_ITEMS.filter((item) => item.category === category).length,
    label: isEn
      ? {
          frontend: "Frontend",
          backend: "Backend",
          database: "Data",
          cloud: "Cloud",
          devops: "DevOps",
          ai: "AI",
          tools: "Tools",
        }[category]
      : {
          frontend: "Frontend",
          backend: "Backend",
          database: "Datos",
          cloud: "Cloud",
          devops: "DevOps",
          ai: "IA",
          tools: "Tools",
        }[category],
  }));

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

      <SectionCard className="surface-card relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(251,146,60,0.16),transparent_52%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <Badge>{isEn ? "Guided workflow" : "Flujo guiado"}</Badge>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                {isEn ? "How MiPrimerIssue works" : "Cómo funciona MiPrimerIssue"}
              </h2>
              <p className="mt-2 text-sm text-gray-300 md:text-base">
                {isEn
                  ? "A clear and practical route from your first task request to your first merged PR."
                  : "Una ruta clara y práctica desde tu primera solicitud hasta tu primer PR mergeado."}
              </p>
            </div>

            <Link
              href="/buena-primera-issue"
              className="inline-flex items-center gap-2 rounded-xl border border-orange-500/35 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
            >
              {isEn ? "Start now" : "Empezar ahora"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {flowSteps.map((item, index) => (
              <article key={item.title} className="surface-subcard rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/12 text-xs font-semibold text-orange-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <item.icon className="h-5 w-5 text-orange-300" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-gray-400">{item.desc}</p>
              </article>
            ))}
          </div>

          <div className="surface-accent mt-5 rounded-xl px-4 py-3 text-sm text-gray-200">
            {isEn
              ? "You do not need to be an expert. Start with small tasks, build momentum, and let your progress become visible."
              : "No necesitas ser experto. Empieza por tareas pequeñas, gana ritmo y haz visible tu progreso."}
          </div>
        </div>
      </SectionCard>

      <SectionCard className="p-8">
        <h2 className="text-2xl font-semibold text-white md:text-3xl">
          {isEn ? "Technologies you can contribute with" : "Tecnologías con las que puedes contribuir"}
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          {isEn
            ? "Explore many of the most used stacks in real-world junior-friendly projects."
            : "Explora muchas de las tecnologías más usadas en proyectos reales para perfiles junior."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {techCategoryCount.map((category) => (
            <span
              key={category.category}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-gray-300"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-orange-300" />
              {category.label}
              <span className="text-gray-500">({category.count})</span>
            </span>
          ))}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {techGrid.map((tech) => {
            const Icon = getTechIcon(tech.category);
            return (
              <article
                key={tech.name}
                className="surface-subcard flex items-center gap-2 rounded-lg px-3 py-2 transition hover:border-orange-500/35"
              >
                <Icon className="h-4 w-4 shrink-0 text-orange-300" />
                <p className="truncate text-xs font-medium text-gray-100">{tech.name}</p>
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

      <SectionCard className="surface-card relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(251,146,60,0.14),transparent_50%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <Badge>{isEn ? "Learning boost" : "Impulso de aprendizaje"}</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              {isEn ? "Improve your skills with practical routes" : "Mejora tus habilidades con rutas prácticas"}
            </h2>
            <p className="mt-2 text-sm text-gray-300 md:text-base">
              {isEn
                ? "MiPrimerIssue combines real tasks with free certification paths so your learning has visible outcomes."
                : "MiPrimerIssue combina tareas reales con rutas de certificación gratuitas para que tu aprendizaje tenga resultados visibles."}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                {
                  icon: Rocket,
                  text: isEn ? "Learning by doing in real repos" : "Aprendes haciendo en repos reales",
                },
                {
                  icon: Flame,
                  text: isEn ? "Beginner-to-intermediate progression" : "Progresión de junior a nivel intermedio",
                },
                {
                  icon: Layers2,
                  text: isEn ? "Curated paths by tech and role" : "Rutas curadas por tecnología y rol",
                },
                {
                  icon: Sparkles,
                  text: isEn ? "Public proof of your growth" : "Prueba pública de tu crecimiento",
                },
              ].map((item) => (
                <article key={item.text} className="surface-subcard flex items-center gap-2 rounded-lg px-3 py-2">
                  <item.icon className="h-4 w-4 text-orange-300" />
                  <p className="text-xs text-gray-200">{item.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(isEn
                ? ["Programming", "Cloud", "AI", "Technical English", "Git/GitHub", "Testing"]
                : ["Programación", "Cloud", "IA", "Inglés técnico", "Git/GitHub", "Testing"]
              ).map((item) => (
                <Badge key={item}>{item}</Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: Braces,
                title: isEn ? "Frontend & UX Track" : "Track Frontend & UX",
                desc: isEn
                  ? "React, Next.js, accessibility and UI polish."
                  : "React, Next.js, accesibilidad y pulido de interfaz.",
              },
              {
                icon: Database,
                title: isEn ? "Backend & Data Track" : "Track Backend & Datos",
                desc: isEn
                  ? "APIs, SQL, auth and scalable architecture basics."
                  : "APIs, SQL, auth y bases de arquitectura escalable.",
              },
              {
                icon: BookOpen,
                title: isEn ? "Contribution Mastery Track" : "Track de Contribución Open Source",
                desc: isEn
                  ? "Git workflow, PR quality and maintainer communication."
                  : "Flujo Git, calidad de PR y comunicacion con maintainers.",
              },
            ].map((track) => (
              <article key={track.title} className="surface-subcard rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <track.icon className="h-5 w-5 text-orange-300" />
                  <p className="text-sm font-semibold text-white">{track.title}</p>
                </div>
                <p className="mt-1 text-sm text-gray-400">{track.desc}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
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
          <Link
            href="/buena-primera-issue"
            className="inline-flex rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm font-medium text-gray-200 transition hover:border-orange-500/35 hover:text-orange-300"
          >
            {isEn ? "Practice with real tasks" : "Practicar con tareas reales"}
          </Link>
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
