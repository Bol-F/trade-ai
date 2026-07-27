"use client"

import Link from "next/link"

import { dashboardNavigation } from "@/components/dashboard/dashboard-nav"
import { SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

function active(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href)
}

export function DashboardNavigation({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return (
    <nav aria-label="Dashboard navigation" className="flex flex-col gap-1">
      {dashboardNavigation.map(({ label, href, icon: Icon }) => {
        const link = (
          <Link
            href={href}
            aria-current={active(pathname, href) ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active(pathname, href) && "bg-primary/10 text-primary",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        )
        return mobile ? <SheetClose asChild key={href}>{link}</SheetClose> : <span key={href}>{link}</span>
      })}
    </nav>
  )
}
