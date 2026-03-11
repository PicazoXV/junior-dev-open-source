import type { ReactNode } from "react";
import RightSidebar from "@/components/right-sidebar";

type PublicLayoutProps = {
  children: ReactNode;
  containerClassName?: string;
};

export default function PublicLayout({
  children,
  containerClassName = "mx-auto max-w-5xl",
}: PublicLayoutProps) {
  return (
    <main className="app-bg min-h-screen p-6 pb-28 lg:pb-6 lg:pr-72">
      <RightSidebar isAuthenticated={false} isReviewer={false} unreadNotifications={0} />
      <div className={containerClassName}>{children}</div>
    </main>
  );
}
