import type { ReactNode } from "react";
import Navbar from "@/components/navbar";

type AppLayoutProps = {
  children: ReactNode;
  containerClassName?: string;
};

export default function AppLayout({
  children,
  containerClassName = "mx-auto max-w-5xl",
}: AppLayoutProps) {
  return (
    <main className="app-bg min-h-screen px-6 pt-10 pb-32 lg:px-8 lg:pt-12 lg:pb-12 lg:pr-72">
      <Navbar />
      <div className={containerClassName}>{children}</div>
    </main>
  );
}
