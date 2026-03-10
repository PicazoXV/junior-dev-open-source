"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import LogoutButton from "@/components/logout-button";

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

  const items: NavItem[] = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/projects", label: "Proyectos", icon: FolderKanban },
    { href: "/dashboard/my-tasks", label: "Mis tareas", icon: Briefcase },
    { href: "/dashboard/my-requests", label: "Mis solicitudes", icon: ClipboardList },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  return (
    <aside className="fixed right-3 top-1/2 z-40 w-[248px] -translate-y-1/2 md:right-8">
      <nav className="rounded-2xl border border-white/20 bg-neutral-900/95 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_20px_rgba(255,255,255,0.06),0_0_26px_rgba(249,115,22,0.08)] backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Navegación</p>
          <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.7)]" />
        </div>

        <div className="space-y-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  isActive
                    ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                    : "border-white/10 text-gray-300 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAuthenticated ? (
            <LogoutButton className="w-full justify-center border-white/10 bg-transparent px-3 py-2 text-sm text-gray-300 hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300" />
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
