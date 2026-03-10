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
  Sparkles,
  ShieldCheck,
  SquarePen,
  LogOut,
  Bell,
  BarChart3,
  Users,
  UserRound,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import HardModeToggle from "@/components/language/hard-mode-toggle";

type RightSidebarProps = {
  isAuthenticated: boolean;
  isReviewer: boolean;
  unreadNotifications: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  reviewerOnly?: boolean;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export default function RightSidebar({
  isAuthenticated,
  isReviewer,
  unreadNotifications,
}: RightSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { messages } = useI18n();

  const navGroups: NavGroup[] = [
    {
      id: "explore",
      label: messages.sidebarGroups.explore,
      items: [
        { href: "/", label: messages.sidebar.home, icon: Home },
        { href: "/good-first-issues", label: messages.sidebar.goodFirstIssues, icon: Sparkles },
        { href: "/projects", label: messages.sidebar.projects, icon: FolderKanban },
        { href: "/certificaciones", label: messages.sidebar.certifications, icon: GraduationCap },
        { href: "/first-contribution", label: messages.sidebar.firstContribution, icon: SquarePen },
      ],
    },
    {
      id: "progress",
      label: messages.sidebarGroups.progress,
      items: [
        { href: "/dashboard", label: messages.sidebar.dashboard, icon: LayoutDashboard },
        { href: "/dashboard/my-tasks", label: messages.sidebar.myTasks, icon: Briefcase },
        { href: "/dashboard/my-requests", label: messages.sidebar.myRequests, icon: ClipboardList },
        { href: "/profile/edit", label: messages.sidebar.profile, icon: UserRound },
        { href: "/dashboard/notifications", label: messages.sidebar.notifications, icon: Bell },
      ],
    },
    {
      id: "community",
      label: messages.sidebarGroups.community,
      items: [
        { href: "/activity", label: messages.sidebar.activity, icon: ClipboardList },
        { href: "/developers", label: messages.sidebar.developers, icon: Users },
        { href: "/developers/tech", label: messages.sidebar.techRanking, icon: BarChart3 },
        { href: "/stats", label: messages.sidebar.stats, icon: ListTodo },
        { href: "/for-maintainers", label: messages.sidebar.forMaintainers, icon: Users },
      ],
    },
    {
      id: "manage",
      label: messages.sidebarGroups.manage,
      items: [
        {
          href: "/dashboard/requests",
          label: messages.sidebar.reviewRequests,
          icon: ShieldCheck,
          reviewerOnly: true,
        },
        {
          href: "/dashboard/projects/new",
          label: messages.sidebar.newProject,
          icon: PlusSquare,
          reviewerOnly: true,
        },
        {
          href: "/projects/new",
          label: messages.sidebar.registerProject,
          icon: PlusSquare,
          reviewerOnly: true,
        },
        {
          href: "/dashboard/tasks/new",
          label: messages.sidebar.newTask,
          icon: SquarePen,
          reviewerOnly: true,
        },
        {
          href: "/dashboard/projects",
          label: messages.sidebar.manageProjects,
          icon: FolderKanban,
          reviewerOnly: true,
        },
        {
          href: "/dashboard/tasks",
          label: messages.sidebar.manageTasks,
          icon: ListTodo,
          reviewerOnly: true,
        },
      ],
    },
  ];

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.reviewerOnly || isReviewer),
    }))
    .filter((group) => group.items.length > 0);
  const visibleItems = visibleGroups.flatMap((group) => group.items);

  const normalizePath = (value: string) => {
    if (!value) return "/";
    return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
  };

  const normalizedPathname = normalizePath(pathname ?? "/");

  const activeItem = visibleItems.reduce<NavItem | null>((winner, item) => {
    const normalizedHref = normalizePath(item.href);
    const isMatch =
      normalizedPathname === normalizedHref ||
      (normalizedHref !== "/" && normalizedPathname.startsWith(`${normalizedHref}/`));

    if (!isMatch) return winner;
    if (!winner) return item;

    return normalizePath(item.href).length > normalizePath(winner.href).length ? item : winner;
  }, null);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="group fixed right-3 top-1/2 z-40 -translate-y-1/2 md:right-8">
      <nav className="sidebar-shell w-20 max-h-[92vh] overflow-hidden overflow-y-auto rounded-3xl p-3 backdrop-blur transition-all duration-300 group-hover:w-72">
        <div className="mb-4 flex items-center justify-center px-1 group-hover:justify-between">
          <div className="hidden group-hover:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">
              {messages.brand.name}
            </p>
            <p className="text-[10px] text-gray-500">{messages.brand.domain}</p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 group-hover:hidden">
            PI
          </p>
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.7)]" />
        </div>

        <div className="mb-3">
          <HardModeToggle />
        </div>

        <div className="space-y-3 [@media(max-height:860px)]:grid [@media(max-height:860px)]:grid-cols-2 [@media(max-height:860px)]:gap-3 [@media(max-height:860px)]:space-y-0">
          {visibleGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="max-w-0 overflow-hidden whitespace-nowrap px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 opacity-0 transition-all duration-300 group-hover:max-w-[220px] group-hover:opacity-100">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = activeItem?.href === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                      isActive
                        ? "border-orange-500/40 bg-orange-500/15 text-orange-300 shadow-[0_0_18px_rgba(251,146,60,0.15)]"
                        : "border-white/10 text-gray-300 hover:border-orange-500/30 hover:bg-white/5 hover:text-orange-200"
                    }`}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.href === "/dashboard/notifications" && unreadNotifications > 0 ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-black">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    ) : null}
                    <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[200px] group-hover:opacity-100">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-gray-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300"
              title={messages.sidebar.logout}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[200px] group-hover:opacity-100">
                {messages.sidebar.logout}
              </span>
            </button>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
