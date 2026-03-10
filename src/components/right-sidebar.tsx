"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  FolderKanban,
  Home,
  LayoutDashboard,
  ListTodo,
  PlusSquare,
  ShieldCheck,
  SquarePen,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RightSidebarProps = {
  isAuthenticated: boolean;
  isReviewer: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  reviewerOnly?: boolean;
};

export default function RightSidebar({ isAuthenticated, isReviewer }: RightSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items: NavItem[] = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/projects", label: "Proyectos", icon: FolderKanban },
    { href: "/developers", label: "Developers", icon: Briefcase },
    { href: "/activity", label: "Actividad", icon: ClipboardList },
    { href: "/stats", label: "Stats", icon: ListTodo },
    { href: "/dashboard/my-tasks", label: "Mis tareas", icon: Briefcase },
    { href: "/dashboard/my-requests", label: "Mis solicitudes", icon: ClipboardList },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/first-contribution", label: "Primera contribución", icon: SquarePen },
    {
      href: "/dashboard/requests",
      label: "Ver solicitudes",
      icon: ShieldCheck,
      reviewerOnly: true,
    },
    {
      href: "/dashboard/projects/new",
      label: "Nuevo proyecto",
      icon: PlusSquare,
      reviewerOnly: true,
    },
    {
      href: "/projects/new",
      label: "Registrar proyecto",
      icon: PlusSquare,
      reviewerOnly: true,
    },
    {
      href: "/dashboard/tasks/new",
      label: "Nueva tarea",
      icon: SquarePen,
      reviewerOnly: true,
    },
    {
      href: "/dashboard/projects",
      label: "Gestionar proyectos",
      icon: FolderKanban,
      reviewerOnly: true,
    },
    {
      href: "/dashboard/tasks",
      label: "Gestionar tareas",
      icon: ListTodo,
      reviewerOnly: true,
    },
  ];

  const visibleItems = items.filter((item) => !item.reviewerOnly || isReviewer);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="group fixed right-3 top-1/2 z-40 -translate-y-1/2 md:right-8">
      <nav className="w-20 overflow-hidden rounded-3xl border border-white/20 bg-neutral-900/95 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_24px_rgba(255,255,255,0.07),0_0_34px_rgba(249,115,22,0.09)] backdrop-blur transition-all duration-300 group-hover:w-72">
        <div className="mb-4 flex items-center justify-center px-1 group-hover:justify-between">
          <div className="hidden group-hover:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">
              MiPrimerIssue
            </p>
            <p className="text-[10px] text-gray-500">miprimerissue.dev</p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 group-hover:hidden">
            PI
          </p>
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.7)]" />
        </div>

        <div className="space-y-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                    : "border-white/10 text-gray-300 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300"
                }`}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[200px] group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-gray-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300"
              title="Logout"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[200px] group-hover:opacity-100">
                Logout
              </span>
            </button>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
