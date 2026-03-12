import type { Metadata } from "next";
import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { getCurrentLocale } from "@/lib/i18n/server";
import AppLayout from "@/components/layout/app-layout";
import NewHomeContent from "@/components/home/new-home-content";
import PostLoginRoadmap from "@/components/roadmap/post-login-roadmap";

export const metadata: Metadata = {
  title: "MiPrimerIssue | Primera experiencia open source para developers junior",
  description:
    "Descubre proyectos open source, encuentra good first issues, solicita tareas y construye un perfil público con progreso real en GitHub con MiPrimerIssue.",
};

export default async function HomePage() {
  const locale = await getCurrentLocale();
  const user = await createProfileIfNeeded();

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl">
      {user ? <PostLoginRoadmap userId={user.id} /> : null}
      <NewHomeContent locale={locale} isAuthenticated={!!user} />
    </AppLayout>
  );
}
