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
    <main className="app-bg min-h-screen overflow-x-clip px-4 pt-14 pb-24 sm:px-6 lg:px-8 lg:pt-16 lg:pb-16 lg:pr-10 xl:pr-14 2xl:pr-24">
      <Navbar />
      <div className={`min-w-0 ${containerClassName}`}>{children}</div>
    </main>
  );
}
