import Navbar from "@/components/navbar";

type AppShellProps = {
  children: React.ReactNode;
  maxWidth?: string;
};

export default function AppShell({ children, maxWidth = "max-w-4xl" }: AppShellProps) {
  return (
    <main className="app-bg min-h-screen px-4 py-6 md:px-8 md:py-8 lg:pr-72">
      <Navbar />
      <div className={`app-shell mx-auto w-full rounded-2xl p-8 ${maxWidth}`}>{children}</div>
    </main>
  );
}

