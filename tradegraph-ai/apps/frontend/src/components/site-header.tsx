"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Network } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PageContainer } from "@/components/page-container"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { authApi } from "@/lib/api"
import { cn } from "@/lib/utils"

const primaryLinks = [
  ["Overview", "/"],
  ["Explorer", "/explorer"],
  ["Map", "/map"],
  ["Countries", "/countries"],
  ["Products", "/products"],
  ["Anomalies", "/anomalies"],
  ["Forecast", "/forecast"],
  ["Supplier Finder", "/supplier-finder"],
  ["Compare", "/compare"],
] as const

const resourceLinks = [["Methodology", "/methodology"], ["Data Sources", "/data-sources"], ["Glossary", "/glossary"]] as const

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isLoading, refresh } = useAuth()
  async function logout() {
    await authApi.logout()
    await refresh()
  }
  const linkClass = (href: string) => cn(
    "rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground",
    pathname === href || (href !== "/" && pathname.startsWith(href)) ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
  )
  const navigation = <>{primaryLinks.map(([label, href]) => <Link key={href} href={href} className={linkClass(href)} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
    {resourceLinks.map(([label, href]) => <Link key={href} href={href} className={linkClass(href)} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}
    {user && <Link href="/workspace" className={linkClass("/workspace")}>Workspace</Link>}</>

  return <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
    <PageContainer className="flex min-h-16 items-center gap-3">
      <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Network className="size-4" /></span><span className="hidden sm:inline">TradeGraph AI</span></Link>
      <nav aria-label="Primary navigation" className="ml-4 hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto xl:flex">{navigation}</nav>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        {!isLoading && (user ? <><span className="hidden max-w-40 truncate text-sm text-muted-foreground lg:inline">{user.first_name || user.email}</span><Button variant="ghost" onClick={logout}>Log out</Button></> : <><Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">Log in</Link></Button><Button asChild className="hidden sm:inline-flex"><Link href="/register">Get started</Link></Button></>)}
        <Sheet><SheetTrigger asChild><Button variant="outline" size="icon" className="xl:hidden" aria-label="Open navigation"><Menu /></Button></SheetTrigger>
          <SheetContent side="right" className="w-[min(90vw,360px)] p-0"><SheetHeader className="border-b p-5"><SheetTitle className="flex items-center gap-2"><Network className="size-5 text-primary" />TradeGraph AI</SheetTitle></SheetHeader>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1 p-4">{primaryLinks.map(([label, href]) => <SheetClose asChild key={href}><Link href={href} className={linkClass(href)}>{label}</Link></SheetClose>)}
              <Separator className="my-2" />{resourceLinks.map(([label, href]) => <SheetClose asChild key={href}><Link href={href} className={linkClass(href)}>{label}</Link></SheetClose>)}
              {user?.role === "admin" && <><Separator className="my-2" /><p className="px-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Administration</p><SheetClose asChild><Link href="/admin/data-health" className={linkClass("/admin/data-health")}>Data health</Link></SheetClose></>}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </PageContainer>
    {user?.role === "admin" && <div className="hidden border-t bg-muted/35 xl:block"><PageContainer className="flex h-9 items-center gap-3 text-xs"><span className="font-medium text-muted-foreground">Admin</span><Link href="/admin/data-health" className={cn("hover:underline", pathname.startsWith("/admin") && "font-medium text-primary")}>Data health</Link></PageContainer></div>}
  </header>
}
