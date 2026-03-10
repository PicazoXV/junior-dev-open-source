export const PROFILE_ROLE_OPTIONS = [
  "Frontend",
  "Backend",
  "Fullstack",
  "UX/UI",
  "Mobile",
  "DevOps",
  "Data Analyst",
  "Data Engineer",
  "AI / ML",
  "QA",
  "Product Designer",
  "Product Manager",
  "Cybersecurity",
  "Cloud Engineer",
  "Game Developer",
  "Embedded",
  "Blockchain",
  "Technical Writer",
];

export const TECH_STACK_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Django",
  "FastAPI",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "TailwindCSS",
  "Figma",
  "Git",
  "GitHub",
  "AWS",
  "Azure",
  "GCP",
  "Firebase",
  "Supabase",
  "GraphQL",
  "REST API",
  "Java",
  "Spring Boot",
  "C#",
  ".NET",
  "Flutter",
  "Swift",
  "Kotlin",
  "TensorFlow",
  "PyTorch",
  "Linux",
  "Redis",
  "Prisma",
  "Vue",
  "Angular",
  "Svelte",
];

export function parseTechStack(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

