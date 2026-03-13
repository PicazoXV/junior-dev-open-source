import type { ReactNode } from "react";
import Navbar from "@/components/navbar";

type PublicLayoutProps = {
  children: ReactNode;
  containerClassName?: string;
};

export default async function PublicLayout({
  children,
  containerClassName = "mx-auto max-w-5xl",
}: PublicLayoutProps) {
  return (
    <main className="app-bg min-h-screen px-6 pt-14 pb-36 lg:px-8 lg:pt-16 lg:pb-16 lg:pr-28 xl:pr-32">
      <Navbar variant="public" />
      <div className={containerClassName}>{children}</div>
    </main>
  );
}
