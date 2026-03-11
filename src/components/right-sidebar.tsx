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
  requiresAuth?: boolean;
  items: NavItem[];
};

export default function RightSidebar({
  isAuthenticated,
  isReviewer,
  unreadNotifications,
}: RightSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { messages, locale } = useI18n();

  const navGroups: NavGroup[] = [
    {
      id: "explore",
      label: messages.sidebarGroups.explore,
      items: [
        { href: "/", label: messages.sidebar.home, icon: Home },
        { href: "/buena-primera-issue", label: messages.sidebar.goodFirstIssues, icon: Sparkles },
        { href: "/projects", label: messages.sidebar.projects, icon: FolderKanban },
        { href: "/certificaciones", label: messages.sidebar.certifications, icon: GraduationCap },
      ],
    },
    {
      id: "progress",
      label: messages.sidebarGroups.progress,
      requiresAuth: true,
      items: [
        { href: "/dashboard", label: messages.sidebar.dashboard, icon: LayoutDashboard },
        { href: "/dashboard/my-tasks", label: messages.sidebar.myTasks, icon: Briefcase },
        { href: "/dashboard/my-requests", label: messages.sidebar.myRequests, icon: ClipboardList },
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
      requiresAuth: true,
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
    .filter((group) => group.items.length > 0 && (!group.requiresAuth || isAuthenticated));
  const visibleItems = visibleGroups.flatMap((group) => group.items);

  const normalizePath = (value: string) => {
    if (!value) return "/";
    const [withoutHash] = value.split("#");
    const [withoutQuery] = withoutHash.split("?");
    return withoutQuery.length > 1 && withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
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

  const desktopWidthClass = "lg:w-20 lg:hover:w-72 lg:focus-within:w-72";

  const desktopRevealTextClass =
    "lg:max-w-0 lg:opacity-0 lg:group-hover:max-w-[220px] lg:group-hover:opacity-100 lg:group-focus-within:max-w-[220px] lg:group-focus-within:opacity-100";

  const desktopCollapsedOnlyClass = "hidden lg:block lg:group-hover:hidden lg:group-focus-within:hidden";

  const desktopExpandedOnlyClass = "block lg:hidden lg:group-hover:block lg:group-focus-within:block";

  return (
    <aside className="group fixed bottom-3 right-3 z-40 lg:right-8 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2">
      <nav
        aria-label={locale === "en" ? "Main navigation" : "Navegación principal"}
        className={`sidebar-shell sidebar-scroll w-[min(92vw,20rem)] max-h-[70vh] overflow-hidden overflow-y-auto rounded-3xl p-3 backdrop-blur transition-all duration-300 lg:max-h-[92vh] ${desktopWidthClass}`}
      >
        <div className="mb-4 flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <div className={`min-w-0 ${desktopExpandedOnlyClass}`}>
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">
                {messages.brand.name}
              </p>
              <p className="truncate text-[10px] text-gray-500">{messages.brand.domain}</p>
            </div>
            <p
              className={`text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 ${desktopCollapsedOnlyClass}`}
            >
              MI
            </p>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_14px_rgba(251,146,60,0.7)]" />
          </div>
        </div>

        <div className="mb-3">
          <HardModeToggle />
        </div>

        <div className="space-y-3 [@media(max-height:860px)]:grid [@media(max-height:860px)]:grid-cols-2 [@media(max-height:860px)]:gap-3 [@media(max-height:860px)]:space-y-0">
          {visibleGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <p
                className={`max-w-[220px] overflow-hidden whitespace-nowrap px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 opacity-100 transition-all duration-300 ${desktopRevealTextClass}`}
              >
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
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.href === "/dashboard/notifications" && unreadNotifications > 0 ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-black">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    ) : null}
                    <span
                      className={`max-w-[200px] overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 ${desktopRevealTextClass}`}
                    >
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
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-gray-300 transition hover:border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              title={messages.sidebar.logout}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span
                className={`max-w-[200px] overflow-hidden whitespace-nowrap opacity-100 transition-all duration-300 ${desktopRevealTextClass}`}
              >
                {messages.sidebar.logout}
              </span>
            </button>
          ) : null}
        </div>
      </nav>
    </aside>
  );
}
