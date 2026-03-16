import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/footer/site-footer";

type PublicLayoutProps = {
  children: ReactNode;
  containerClassName?: string;
};

export default async function PublicLayout({
  children,
  containerClassName = "mx-auto max-w-5xl",
}: PublicLayoutProps) {
  return (
    <main className="app-bg min-h-screen overflow-x-clip px-4 pt-14 pb-24 sm:px-6 lg:px-8 lg:pt-16 lg:pb-16 lg:pr-10 xl:pr-14 2xl:pr-24">
      <Navbar variant="public" />
      <div className={`min-w-0 ${containerClassName}`}>{children}</div>
      <div className="mx-auto max-w-6xl">
        <SiteFooter />
      </div>
    </main>
  );
}
