import AppLayout from "@/components/layout/app-layout";
import SectionCard from "@/components/ui/section-card";
import PageHeader from "@/components/ui/page-header";
import CourseCard from "@/components/certifications/course-card";
import {
  getCertificationCategoriesOrder,
  getCoursesByCategory,
  type CertificationCategory,
} from "@/lib/certifications";
import { getCurrentMessages } from "@/lib/i18n/server";

function getCategoryCopy(category: CertificationCategory, messages: Awaited<ReturnType<typeof getCurrentMessages>>["messages"]) {
  if (category === "english") {
    return {
      title: messages.certifications.categoryEnglish,
      description: messages.certifications.categoryEnglishDesc,
    };
  }

  if (category === "programming") {
    return {
      title: messages.certifications.categoryProgramming,
      description: messages.certifications.categoryProgrammingDesc,
    };
  }

  if (category === "ai") {
    return {
      title: messages.certifications.categoryAi,
      description: messages.certifications.categoryAiDesc,
    };
  }

  if (category === "cloud") {
    return {
      title: messages.certifications.categoryCloud,
      description: messages.certifications.categoryCloudDesc,
    };
  }

  return {
    title: messages.certifications.categoryData,
    description: messages.certifications.categoryDataDesc,
  };
}

export default async function CertificationsPage() {
  const { locale, messages } = await getCurrentMessages();
  const categories = getCertificationCategoriesOrder();

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl space-y-6">
      <SectionCard className="surface-accent p-8 md:p-10">
        <PageHeader title={messages.certifications.title} description={messages.certifications.subtitle} />
        <p className="max-w-4xl text-sm text-gray-300 md:text-base">{messages.certifications.intro}</p>
      </SectionCard>

      {categories.map((category) => {
        const copy = getCategoryCopy(category, messages);
        const courses = getCoursesByCategory(category);

        return (
          <SectionCard key={category} className="p-8">
            <h2 className="text-xl font-semibold text-white">{copy.title}</h2>
            <p className="mt-1 text-sm text-gray-400">{copy.description}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} locale={locale} messages={messages} />
              ))}
            </div>
          </SectionCard>
        );
      })}
    </AppLayout>
  );
}
