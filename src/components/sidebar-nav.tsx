"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SidebarNavProps = {
  isAuthenticated: boolean;
  isReviewer: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  reviewerOnly?: boolean;
};

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

export default function SidebarNav({ isAuthenticated, isReviewer }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const items: NavItem[] = [
    { href: "/", label: "Inicio", icon: <NavIcon path="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5" /> },
    { href: "/projects", label: "Proyectos", icon: <NavIcon path="M4 5h16M4 12h16M4 19h10" /> },
    {
      href: "/dashboard/my-tasks",
      label: "Mis tareas",
      icon: <NavIcon path="M5 12.5 9 16l10-10M4 4h16v16H4z" />,
    },
    {
      href: "/dashboard/my-requests",
      label: "Mis solicitudes",
      icon: <NavIcon path="M12 3v18M3 12h18" />,
    },
    { href: "/dashboard", label: "Dashboard", icon: <NavIcon path="M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z" /> },
    {
      href: "/dashboard/requests",
      label: "Ver solicitudes",
      icon: <NavIcon path="M4 6h16M7 12h10M10 18h4" />,
      reviewerOnly: true,
    },
    {
      href: "/dashboard/projects/new",
      label: "Nuevo proyecto",
      icon: <NavIcon path="M12 5v14M5 12h14" />,
      reviewerOnly: true,
    },
    {
      href: "/dashboard/tasks/new",
      label: "Nueva tarea",
      icon: <NavIcon path="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
      reviewerOnly: true,
    },
    {
      href: "/dashboard/projects",
      label: "Gestionar proyectos",
      icon: <NavIcon path="M3 7h18M3 12h18M3 17h18" />,
      reviewerOnly: true,
    },
    {
      href: "/dashboard/tasks",
      label: "Gestionar tareas",
      icon: <NavIcon path="M6 4h15M6 12h15M6 20h15M3 4h.01M3 12h.01M3 20h.01" />,
      reviewerOnly: true,
    },
  ];

  const visibleItems = items.filter((item) => !item.reviewerOnly || isReviewer);

  const baseItemClass =
    "flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300";

  return (
    <aside className="fixed right-3 top-1/2 z-40 w-[250px] -translate-y-1/2 md:right-8">
      <nav className="sidebar-shell rounded-2xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Navigation</p>
          <span className="accent-dot" />
        </div>

        <div className="space-y-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${baseItemClass} ${
                  isActive
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                    : "hover:bg-orange-500/10 hover:text-orange-400"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className={`${baseItemClass} w-full justify-center hover:bg-orange-500/10 hover:text-orange-400`}
            >
              <NavIcon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              <span>Logout</span>
            </button>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}

