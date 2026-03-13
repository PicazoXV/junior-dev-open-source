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
    <main className="app-bg min-h-screen px-6 pt-14 pb-36 lg:px-8 lg:pt-16 lg:pb-16 lg:pr-28 xl:pr-32">
      <Navbar />
      <div className={containerClassName}>{children}</div>
    </main>
  );
}
