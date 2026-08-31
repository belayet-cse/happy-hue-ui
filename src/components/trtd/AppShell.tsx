import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Files,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Ship,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/trtd/format";
import {
  markAllRead,
  markNotificationRead,
  resetDemoData,
  signOut,
  useTrtdStore,
} from "@/lib/trtd/store";
import type { Role } from "@/lib/trtd/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROLE_DESC: Record<Role, string> = {
  RM: "Relationship / Branch Management",
  MFIS: "MTB Financial Institutions & Syndications",
  MITS: "MTB International Trade Services",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { session, notifications } = useTrtdStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!session) return <>{children}</>;

  const mine = notifications.filter((n) => n.toRole === session.role);
  const unread = mine.filter((n) => !n.read);

  const nav: {
    to: string;
    label: string;
    icon: typeof Files;
    children?: { to: string; label: string; params?: Record<string, string> }[];
  }[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      to: "/import",
      label: "Import",
      icon: Ship,
      children: [
        { to: "/import/mtb", label: "MTB Transaction Request" },
        { to: "/import/other-bank", label: "Other Bank Transaction Request" },
        { to: "/import/non-designated", label: "Non-Designated Presentation" },
      ],
    },
    { to: "/export", label: "Export", icon: PackageCheck },
    { to: "/guarantee", label: "Guarantee", icon: ShieldCheck },
    { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
    { to: "/requests", label: "Transactions", icon: Files },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ];

  const isActive = (to: string) =>
    to === "/requests"
      ? pathname === "/requests" || pathname.startsWith("/requests/txn")
      : to === "/dashboard" || to === "/notifications"
        ? pathname === to
        : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">TRTD</p>
            <p className="text-[11px] text-sidebar-foreground/70">
              Trade Transaction Digitalization
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = isActive(item.to);
            return (
              <div key={item.to}>
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={item.to as any}
                  className={cn(
                    "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                  {item.to === "/notifications" && unread.length > 0 ? (
                    <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 text-[10px] font-semibold text-sidebar-primary-foreground">
                      {unread.length}
                    </span>
                  ) : null}
                </Link>
                {item.children && active ? (
                  <div className="mt-1 ml-6 space-y-0.5 border-l border-sidebar-border pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.to}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        to={child.to as any}
                        className={cn(
                          "block rounded-sm px-2 py-1.5 text-xs transition-colors",
                          pathname === child.to || pathname.startsWith(`${child.to}/`)
                            ? "bg-sidebar-accent/70 font-medium text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 text-[11px] text-sidebar-foreground/60">
          <p className="font-medium text-sidebar-foreground/80">{ROLE_DESC[session.role]}</p>
          <p className="mt-1">Frontend prototype — data stored in this browser.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              Trade Transaction Digitalization
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session.name} · {session.role} · {ROLE_DESC[session.role]}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="size-4" />
                  {unread.length > 0 ? (
                    <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                      {unread.length}
                    </span>
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unread.length > 0 ? (
                    <button
                      className="text-xs font-normal text-primary hover:underline"
                      onClick={() => markAllRead(session.role)}
                    >
                      Mark all read
                    </button>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {mine.slice(0, 6).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex-col items-start gap-0.5 py-2"
                    onClick={() => {
                      markNotificationRead(n.id);
                      navigate({ to: "/requests/$id", params: { id: n.transactionId } });
                    }}
                  >
                    <span className="flex w-full items-center gap-2 text-xs font-semibold">
                      {!n.read ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                      {n.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{n.body}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTime(n.at)}
                    </span>
                  </DropdownMenuItem>
                ))}
                {mine.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    No notifications yet.
                  </p>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/notifications" })}>
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetDemoData();
                toast.success("Demo data reset");
              }}
            >
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">Reset demo</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={item.to as any}

              className="rounded-sm px-3 py-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
