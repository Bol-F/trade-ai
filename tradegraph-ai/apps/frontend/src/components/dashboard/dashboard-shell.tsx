"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronsUpDown,
  LogOut,
  Menu,
  Network,
  Search,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { dashboardNavigation } from "@/components/dashboard/dashboard-nav";
import { DashboardNavigation } from "@/components/dashboard/dashboard-navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authApi } from "@/lib/api";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, refresh } = useAuth();
  const [search, setSearch] = useState("");

  async function logout() {
    await authApi.logout();
    await refresh();
    router.push("/");
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim().toLowerCase();
    if (!query) return;
    const page = dashboardNavigation.find((item) =>
      item.label.toLowerCase().includes(query),
    );
    router.push(
      page?.href ??
        `/dashboard/market?asset=${encodeURIComponent(search.trim().toUpperCase())}`,
    );
    setSearch("");
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="grid min-h-screen place-items-center text-sm text-muted-foreground"
      >
        Loading secure workspace…
      </div>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
          <Network aria-hidden="true" className="mx-auto size-8 text-primary" />
          <h1 className="mt-5 text-2xl font-semibold">
            Sign in to open the dashboard
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Portfolio-style demo analytics and your private workspace are only
            available after authentication.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-surface-sunken">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background lg:flex lg:flex-col">
        <Link
          href="/dashboard"
          className="flex h-16 items-center gap-2 border-b px-5 font-semibold"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Network aria-hidden="true" className="size-4" />
          </span>
          Trade AI
        </Link>
        <div className="flex-1 overflow-y-auto p-3">
          <DashboardNavigation pathname={pathname} />
        </div>
        <div className="border-t p-3">
          <p className="truncate px-3 text-sm font-medium">
            {user.first_name || user.email}
          </p>
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="lg:hidden"
                aria-label="Open dashboard navigation"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,320px)] p-0">
              <SheetHeader className="border-b p-5">
                <SheetTitle className="flex items-center gap-2">
                  <Network aria-hidden="true" className="size-5 text-primary" />
                  Trade AI
                </SheetTitle>
              </SheetHeader>
              <div className="p-3">
                <DashboardNavigation pathname={pathname} mobile />
              </div>
            </SheetContent>
          </Sheet>
          <form
            role="search"
            className="relative hidden min-w-0 max-w-xl flex-1 md:block"
            onSubmit={submitSearch}
          >
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="h-9 pl-9"
              type="search"
              aria-label="Search dashboard"
              placeholder="Search assets, signals, or pages…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Open notifications"
                  className="relative"
                >
                  <Bell aria-hidden="true" />
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-warning">
                    <span className="sr-only">3 unread notifications</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>
                  Notifications{" "}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    Demo data
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="items-start py-3">
                  <div>
                    <p className="font-medium">Risk threshold changed</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      EUR/USD volatility moved above your watch level.
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/alerts">View all alerts</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="max-w-44 gap-2 px-2"
                  aria-label={`Open account menu for ${user.first_name || user.email}`}
                >
                  <span className="grid size-8 place-items-center rounded-full bg-muted">
                    <UserRound aria-hidden="true" className="size-4" />
                  </span>
                  <span className="hidden truncate text-sm sm:inline">
                    {user.first_name || user.email}
                  </span>
                  <ChevronsUpDown
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <UserRound />
                    Profile & settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={logout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="dashboard-content" className="min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
