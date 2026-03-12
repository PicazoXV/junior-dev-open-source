import type { AppLocale } from "@/lib/i18n/types";

export type CertificationCategory =
  | "english"
  | "programming"
  | "design"
  | "database"
  | "cloud"
  | "data"
  | "ai"
  | "security";
export type CertificationLevel = "beginner" | "intermediate";

export type CertificationCourse = {
  id: string;
  title: string;
  platform: string;
  category: CertificationCategory;
  level: CertificationLevel;
  duration: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  url: string | null;
};

export const certificationCourses: CertificationCourse[] = [
  {
    id: "english-remote-work",
    title: "Inglés para el trabajo remoto",
    platform: "LinkedIn Learning",
    category: "english",
    level: "beginner",
    duration: { es: "2-4 horas", en: "2-4 hours" },
    description: {
      es: "Comunicación en equipos distribuidos, reuniones y colaboración en remoto.",
      en: "Communication for distributed teams, meetings, and remote collaboration.",
    },
    url: "https://lnkd.in/d6FzXtxs",
  },
  {
    id: "english-it-professionals",
    title: "Inglés para desarrolladores y profesionales de IT",
    platform: "LinkedIn Learning",
    category: "english",
    level: "beginner",
    duration: { es: "3-6 horas", en: "3-6 hours" },
    description: {
      es: "Vocabulario técnico y frases clave para proyectos, PRs y documentación.",
      en: "Technical vocabulary and key expressions for projects, PRs, and documentation.",
    },
    url: "https://lnkd.in/eW3sKAtN",
  },
  {
    id: "english-tech-writing",
    title: "Technical English for Developers",
    platform: "OpenLearn",
    category: "english",
    level: "beginner",
    duration: { es: "8 horas", en: "8 hours" },
    description: {
      es: "Mejora vocabulario técnico y comunicación escrita en entornos de desarrollo.",
      en: "Improve technical vocabulary and written communication in developer contexts.",
    },
    url: "https://www.open.edu/openlearn/",
  },

  {
    id: "web-intro-route-a",
    title: "Introducción al desarrollo web (Ruta A)",
    platform: "LinkedIn Learning",
    category: "programming",
    level: "beginner",
    duration: { es: "4-8 horas", en: "4-8 hours" },
    description: {
      es: "Fundamentos de web, estructura de páginas y flujo de trabajo inicial.",
      en: "Web fundamentals, page structure, and beginner workflow.",
    },
    url: "https://lnkd.in/dwmkt9Gb",
  },
  {
    id: "web-intro-route-b",
    title: "Introducción al desarrollo web (Ruta B)",
    platform: "LinkedIn Learning",
    category: "programming",
    level: "beginner",
    duration: { es: "4-8 horas", en: "4-8 hours" },
    description: {
      es: "Segunda ruta de introducción para reforzar bases de frontend y web moderna.",
      en: "Alternative intro route to reinforce frontend and modern web basics.",
    },
    url: "https://lnkd.in/etFAzev6",
  },
  {
    id: "javascript-interactive",
    title: "JavaScript Interactivo",
    platform: "LinkedIn Learning",
    category: "programming",
    level: "beginner",
    duration: { es: "3-5 horas", en: "3-5 hours" },
    description: {
      es: "Eventos, DOM y dinámicas interactivas para interfaces frontend.",
      en: "Events, DOM, and interactive frontend behaviors.",
    },
    url: "https://lnkd.in/egUsBUzC",
  },
  {
    id: "javascript-from-zero",
    title: "JavaScript desde 0",
    platform: "LinkedIn Learning",
    category: "programming",
    level: "beginner",
    duration: { es: "6-10 horas", en: "6-10 hours" },
    description: {
      es: "Variables, funciones, control de flujo y lógica esencial en JavaScript.",
      en: "Variables, functions, control flow, and core JavaScript logic.",
    },
    url: "https://lnkd.in/eMdjGA3P",
  },
  {
    id: "css-advanced",
    title: "CSS Avanzado",
    platform: "LinkedIn Learning",
    category: "programming",
    level: "intermediate",
    duration: { es: "3-6 horas", en: "3-6 hours" },
    description: {
      es: "Layouts avanzados, responsive design y técnicas modernas de estilo.",
      en: "Advanced layouts, responsive design, and modern styling techniques.",
    },
    url: "https://lnkd.in/e-HYwETu",
  },
  {
    id: "freecodecamp-certs",
    title: "freeCodeCamp Certifications",
    platform: "freeCodeCamp",
    category: "programming",
    level: "beginner",
    duration: { es: "Flexible", en: "Flexible" },
    description: {
      es: "Rutas en HTML, CSS, JavaScript, Python y Data Science.",
      en: "Learning paths in HTML, CSS, JavaScript, Python, and Data Science.",
    },
    url: "https://lnkd.in/ekGXnwmF",
  },
  {
    id: "codecademy-free-courses",
    title: "Codecademy Free Courses",
    platform: "Codecademy",
    category: "programming",
    level: "beginner",
    duration: { es: "Flexible", en: "Flexible" },
    description: {
      es: "Cursos gratuitos de programación y fundamentos de desarrollo.",
      en: "Free programming courses and software development fundamentals.",
    },
    url: "https://lnkd.in/e697yX6d",
  },
  {
    id: "arte-en-el-codigo",
    title: "Arte en el código",
    platform: "LinkedIn Learning",
    category: "programming",
    level: "beginner",
    duration: { es: "2-4 horas", en: "2-4 hours" },
    description: {
      es: "Buenas prácticas de código limpio, estructura y legibilidad.",
      en: "Code quality principles focused on clean structure and readability.",
    },
    url: "https://lnkd.in/eSHrv2pY",
  },
  {
    id: "cs50x-edx",
    title: "CS50x: Introduction to Computer Science",
    platform: "Harvard · edX",
    category: "programming",
    level: "beginner",
    duration: { es: "10-12 semanas", en: "10-12 weeks" },
    description: {
      es: "Fundamentos sólidos de programación, algoritmos y resolución de problemas.",
      en: "Solid programming fundamentals, algorithms, and problem-solving skills.",
    },
    url: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science",
  },

  {
    id: "figma-workshop",
    title: "Taller de Figma",
    platform: "LinkedIn Learning",
    category: "design",
    level: "beginner",
    duration: { es: "2-5 horas", en: "2-5 hours" },
    description: {
      es: "Prototipado y diseño de interfaces con un flujo práctico de producto.",
      en: "UI prototyping and product-focused interface design workflow.",
    },
    url: "https://lnkd.in/eqtmkFn7",
  },

  {
    id: "sql-interactive",
    title: "SQL Interactivo",
    platform: "LinkedIn Learning",
    category: "database",
    level: "beginner",
    duration: { es: "3-6 horas", en: "3-6 hours" },
    description: {
      es: "Consultas SQL esenciales, filtrado, joins y operaciones básicas.",
      en: "Core SQL querying, filters, joins, and essential operations.",
    },
    url: "https://lnkd.in/eHqiQqkW",
  },
  {
    id: "sql-resource-extra",
    title: "Recurso adicional SQL",
    platform: "LinkedIn Learning",
    category: "database",
    level: "beginner",
    duration: { es: "2-4 horas", en: "2-4 hours" },
    description: {
      es: "Práctica extra de consultas y modelado relacional para consolidar bases.",
      en: "Extra SQL practice focused on querying and relational modeling.",
    },
    url: "https://lnkd.in/deefVQ68",
  },
  {
    id: "sql-server-course",
    title: "Curso de SQL Server",
    platform: "LinkedIn Learning",
    category: "database",
    level: "intermediate",
    duration: { es: "6-10 horas", en: "6-10 hours" },
    description: {
      es: "Consultas SQL, gestión de tablas y registros, procedimientos, funciones y administración básica para entornos empresariales.",
      en: "SQL queries, table and record management, procedures, functions, and basic administration for enterprise environments.",
    },
    url: "https://lnkd.in/dCnBxbfe",
  },
  {
    id: "mysql-course-pending-url",
    title: "Curso de MySQL",
    platform: "MySQL Learning Path",
    category: "database",
    level: "beginner",
    duration: { es: "5-8 horas", en: "5-8 hours" },
    description: {
      es: "Bases relacionales, consultas con joins, optimización y estructura para aplicaciones web. URL pendiente de confirmar.",
      en: "Relational databases, join queries, optimization, and structure for web apps. URL pending confirmation.",
    },
    url: null,
  },

  {
    id: "google-cloud-skills-boost",
    title: "Google Cloud Skills Boost",
    platform: "Google Cloud",
    category: "cloud",
    level: "beginner",
    duration: { es: "Variable", en: "Variable" },
    description: {
      es: "Rutas de cloud, despliegue y arquitectura en el ecosistema de Google Cloud.",
      en: "Cloud, deployment, and architecture learning paths on Google Cloud.",
    },
    url: "https://lnkd.in/eH4heTng",
  },
  {
    id: "aws-training-certification",
    title: "AWS Training & Certification",
    platform: "AWS",
    category: "cloud",
    level: "beginner",
    duration: { es: "Variable", en: "Variable" },
    description: {
      es: "Capacitación oficial en servicios AWS y rutas de certificación cloud.",
      en: "Official AWS training content and cloud certification paths.",
    },
    url: "https://www.aws.training",
  },
  {
    id: "aws-cloud-practitioner",
    title: "AWS Cloud Practitioner Essentials",
    platform: "AWS Skill Builder",
    category: "cloud",
    level: "beginner",
    duration: { es: "6 horas", en: "6 hours" },
    description: {
      es: "Base de cloud en AWS para entender servicios y arquitectura.",
      en: "AWS cloud fundamentals to understand services and architecture.",
    },
    url: "https://explore.skillbuilder.aws/",
  },

  {
    id: "data-analysis-from-zero",
    title: "Data Analysis desde cero",
    platform: "LinkedIn Learning",
    category: "data",
    level: "beginner",
    duration: { es: "4-8 horas", en: "4-8 hours" },
    description: {
      es: "Fundamentos de análisis de datos, limpieza y lectura de resultados.",
      en: "Data analysis fundamentals, data cleaning, and result interpretation.",
    },
    url: "https://lnkd.in/dXAhVCzQ",
  },
  {
    id: "data-analysis-path",
    title: "Data Analysis",
    platform: "LinkedIn Learning",
    category: "data",
    level: "beginner",
    duration: { es: "4-8 horas", en: "4-8 hours" },
    description: {
      es: "Ruta complementaria de análisis para reforzar práctica y reporting.",
      en: "Complementary analytics path to reinforce practice and reporting.",
    },
    url: "https://lnkd.in/e4DCszjM",
  },
  {
    id: "ibm-skillsbuild",
    title: "IBM SkillsBuild",
    platform: "IBM",
    category: "data",
    level: "intermediate",
    duration: { es: "Variable", en: "Variable" },
    description: {
      es: "Rutas en datos, IA y habilidades técnicas con certificados verificables.",
      en: "Learning tracks in data, AI, and technical skills with verifiable certificates.",
    },
    url: "https://skillsbuild.org",
  },
  {
    id: "microsoft-learn",
    title: "Microsoft Learn (IA, Data, Azure)",
    platform: "Microsoft Learn",
    category: "data",
    level: "beginner",
    duration: { es: "Variable", en: "Variable" },
    description: {
      es: "Rutas en IA, datos y Azure para crecer en un stack enterprise moderno.",
      en: "Learning paths in AI, data, and Azure for modern enterprise growth.",
    },
    url: "https://lnkd.in/euR4bHMc",
  },
  {
    id: "kaggle-microcourses",
    title: "Kaggle Micro-courses",
    platform: "Kaggle",
    category: "data",
    level: "beginner",
    duration: { es: "2-6 horas", en: "2-6 hours" },
    description: {
      es: "Cursos rápidos de Python, pandas, visualización y machine learning.",
      en: "Short courses in Python, pandas, visualization, and machine learning.",
    },
    url: "https://www.kaggle.com/learn",
  },
  {
    id: "sql-data-analytics",
    title: "Data Analytics with SQL",
    platform: "IBM Skills Network",
    category: "data",
    level: "intermediate",
    duration: { es: "12 horas", en: "12 hours" },
    description: {
      es: "Consultas SQL, análisis y bases para reporting de datos.",
      en: "SQL querying, analysis, and foundations for data reporting.",
    },
    url: "https://skills.network/",
  },

  {
    id: "google-ai-for-everyone",
    title: "Introduction to Generative AI",
    platform: "Google Cloud Skills Boost",
    category: "ai",
    level: "beginner",
    duration: { es: "1-2 horas", en: "1-2 hours" },
    description: {
      es: "Introducción práctica a la IA generativa y sus casos de uso.",
      en: "Practical introduction to generative AI and real use cases.",
    },
    url: "https://www.cloudskillsboost.google/",
  },
  {
    id: "deep-learning-ai",
    title: "AI for Everyone",
    platform: "DeepLearning.AI · Coursera",
    category: "ai",
    level: "beginner",
    duration: { es: "10 horas", en: "10 hours" },
    description: {
      es: "Curso claro para entender conceptos clave de IA sin perfil experto.",
      en: "Clear AI course to understand key concepts without an expert background.",
    },
    url: "https://www.coursera.org/learn/ai-for-everyone",
  },

  {
    id: "cisco-networking-academy",
    title: "Cisco Networking Academy",
    platform: "Cisco",
    category: "security",
    level: "beginner",
    duration: { es: "Variable", en: "Variable" },
    description: {
      es: "Fundamentos de redes, routing, switching y principios de ciberseguridad.",
      en: "Networking fundamentals, routing, switching, and cybersecurity basics.",
    },
    url: "https://www.netacad.com",
  },
  {
    id: "tryhackme-cybersecurity",
    title: "TryHackMe · Ciberseguridad práctica",
    platform: "TryHackMe",
    category: "security",
    level: "beginner",
    duration: { es: "Flexible", en: "Flexible" },
    description: {
      es: "Laboratorios prácticos para aprender seguridad ofensiva y defensiva paso a paso.",
      en: "Hands-on labs to learn offensive and defensive security step by step.",
    },
    url: "https://tryhackme.com",
  },
];

export function getCertificationCategoriesOrder(): CertificationCategory[] {
  return ["english", "programming", "design", "database", "cloud", "data", "ai", "security"];
}

export function getCoursesByCategory(category: CertificationCategory) {
  return certificationCourses.filter((course) => course.category === category);
}

export function getLocalizedText(value: { es: string; en: string }, locale: AppLocale) {
  return locale === "en" ? value.en : value.es;
}
