import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Cloud,
  Code2,
  Languages,
  BarChart3,
  Brain,
  Palette,
  Database,
  Shield,
} from "lucide-react";
import type { AppLocale, MessageDictionary } from "@/lib/i18n/types";
import type { CertificationCourse } from "@/lib/certifications";
import { getLocalizedText } from "@/lib/certifications";
import Badge from "@/components/ui/badge";

type CourseCardProps = {
  course: CertificationCourse;
  locale: AppLocale;
  messages: MessageDictionary;
};

function getCategoryIcon(category: CertificationCourse["category"]) {
  if (category === "english") return <Languages className="h-5 w-5 text-orange-300" />;
  if (category === "programming") return <Code2 className="h-5 w-5 text-orange-300" />;
  if (category === "design") return <Palette className="h-5 w-5 text-orange-300" />;
  if (category === "database") return <Database className="h-5 w-5 text-orange-300" />;
  if (category === "ai") return <Brain className="h-5 w-5 text-orange-300" />;
  if (category === "cloud") return <Cloud className="h-5 w-5 text-orange-300" />;
  if (category === "data") return <BarChart3 className="h-5 w-5 text-orange-300" />;
  if (category === "security") return <Shield className="h-5 w-5 text-orange-300" />;
  return <BookOpen className="h-5 w-5 text-orange-300" />;
}

export default function CourseCard({ course, locale, messages }: CourseCardProps) {
  return (
    <article className="surface-subcard rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{course.title}</p>
          <p className="mt-1 text-xs text-gray-400">
            {messages.certifications.platformLabel}: {course.platform}
          </p>
        </div>
        {getCategoryIcon(course.category)}
      </div>

      <p className="mt-3 text-sm text-gray-300">{getLocalizedText(course.description, locale)}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="info">{messages.certifications.includedBadge}</Badge>
        <Badge>
          {messages.certifications.levelLabel}:{" "}
          {course.level === "beginner"
            ? messages.certifications.levelBeginner
            : messages.certifications.levelIntermediate}
        </Badge>
        <Badge>
          {messages.certifications.durationLabel}: {getLocalizedText(course.duration, locale)}
        </Badge>
      </div>

      <div className="mt-4">
        {course.url ? (
          <Link
            href={course.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-orange-500/35 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/15"
          >
            {messages.certifications.viewCourse}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-gray-300">
            <AlertCircle className="h-3.5 w-3.5 text-orange-300" />
            {messages.certifications.urlPending}
          </span>
        )}
      </div>
    </article>
  );
}
