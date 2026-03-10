import type { AppLocale } from "@/lib/i18n/types";

export type CertificationCategory = "english" | "programming" | "ai" | "cloud" | "data";
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
  url: string;
};

export const certificationCourses: CertificationCourse[] = [
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
    id: "freecodecamp-certs",
    title: "freeCodeCamp Certifications",
    platform: "freeCodeCamp",
    category: "programming",
    level: "beginner",
    duration: { es: "Flexible", en: "Flexible" },
    description: {
      es: "Certificaciones gratuitas en web, JavaScript, APIs y testing.",
      en: "Free certifications in web development, JavaScript, APIs, and testing.",
    },
    url: "https://www.freecodecamp.org/learn",
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
    id: "microsoft-learn",
    title: "Microsoft Learn Paths",
    platform: "Microsoft Learn",
    category: "cloud",
    level: "beginner",
    duration: { es: "Variable", en: "Variable" },
    description: {
      es: "Rutas en Azure, desarrollo y datos con logros verificables.",
      en: "Learning paths in Azure, development, and data with verified achievements.",
    },
    url: "https://learn.microsoft.com/training/",
  },
  {
    id: "ibm-skillsbuild",
    title: "IBM SkillsBuild",
    platform: "IBM",
    category: "ai",
    level: "intermediate",
    duration: { es: "Variable", en: "Variable" },
    description: {
      es: "Formación en IA, ciberseguridad y habilidades tecnológicas con certificado.",
      en: "Training in AI, cybersecurity, and tech skills with certificates.",
    },
    url: "https://skillsbuild.org/",
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
];

export function getCertificationCategoriesOrder(): CertificationCategory[] {
  return ["english", "programming", "ai", "cloud", "data"];
}

export function getCoursesByCategory(category: CertificationCategory) {
  return certificationCourses.filter((course) => course.category === category);
}

export function getLocalizedText(value: { es: string; en: string }, locale: AppLocale) {
  return locale === "en" ? value.en : value.es;
}

