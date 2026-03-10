import { createProfileIfNeeded } from "@/lib/create-profile-if-needed";
import { getCurrentLocale } from "@/lib/i18n/server";
import AppLayout from "@/components/layout/app-layout";
import NewHomeContent from "@/components/home/new-home-content";
import PostLoginRoadmap from "@/components/roadmap/post-login-roadmap";

export default async function HomePage() {
  const locale = await getCurrentLocale();
  const user = await createProfileIfNeeded();

  if (!user) {
    return (
      <main className="app-bg min-h-screen p-6">
        <div className="mx-auto w-full max-w-6xl">
          <NewHomeContent locale={locale} isAuthenticated={false} />
        </div>
      </main>
    );
  }

  return (
    <AppLayout containerClassName="mx-auto max-w-6xl">
      <PostLoginRoadmap userId={user.id} />
      <NewHomeContent locale={locale} isAuthenticated />
    </AppLayout>
  );
}
