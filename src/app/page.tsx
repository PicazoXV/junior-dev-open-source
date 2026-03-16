import type { Metadata } from "next";
import { cookies } from "next/headers";
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

type HomePageProps = {
  searchParams?: Promise<{
    notice?: string;
    next?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = await getCurrentLocale();
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));

  const user = hasAuthCookie ? await createProfileIfNeeded() : null;
  const resolvedSearchParams = await searchParams;
  const authNotice = resolvedSearchParams?.notice === "login-required";
  const rawNextPath = resolvedSearchParams?.next || "";
  const nextPath =
    rawNextPath.startsWith("/") && !rawNextPath.startsWith("//") ? rawNextPath : undefined;

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl">
      {user ? <PostLoginRoadmap userId={user.id} /> : null}
      <NewHomeContent
        locale={locale}
        isAuthenticated={!!user}
        authNotice={authNotice}
        loginNextPath={nextPath}
      />
    </AppLayout>
  );
}
