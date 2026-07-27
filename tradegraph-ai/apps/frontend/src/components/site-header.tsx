"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Menu, Network } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LandingHeader } from "@/components/landing-header"
import { PageContainer } from "@/components/page-container"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { authApi } from "@/lib/api"
import { type TranslationKey, useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const primaryLinks = [
  ["nav.overview", "/"],
  ["nav.explorer", "/explorer"],
  ["nav.map", "/map"],
  ["nav.countries", "/countries"],
  ["nav.products", "/products"],
] as const

const analysisLinks = [
  ["nav.anomalies", "/anomalies"],
  ["nav.forecast", "/forecast"],
  ["nav.suppliers", "/supplier-finder"],
  ["nav.compare", "/compare"],
] as const

const resourceLinks: readonly [TranslationKey, string][] = [["nav.methodology", "/methodology"], ["nav.dataSources", "/data-sources"], ["nav.glossary", "/glossary"]]

export function SiteHeader() {
  const pathname = usePathname()
  const { user, isLoading, refresh } = useAuth()
  const { t } = useI18n()
  async function logout() {
    await authApi.logout()
    await refresh()
  }
  const linkClass = (href: string) => cn(
    "rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground",
    pathname === href || (href !== "/" && pathname.startsWith(href)) ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
  )
  const secondaryLinks = [...analysisLinks, ...resourceLinks]
  const moreIsActive = secondaryLinks.some(([, href]) => pathname.startsWith(href)) || pathname.startsWith("/workspace")

  if (pathname === "/") return <LandingHeader />

  return <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
    <PageContainer className="flex min-h-16 items-center gap-3">
      <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Network className="size-4" /></span><span className="hidden sm:inline">TradeGraph AI</span></Link>
      <nav aria-label={t("nav.primary")} className="ml-2 hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
        {primaryLinks.map(([label, href]) => <Link key={href} href={href} className={linkClass(href)} aria-current={pathname === href ? "page" : undefined}>{t(label)}</Link>)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("gap-1 px-2.5 text-sm font-normal text-muted-foreground", moreIsActive && "bg-muted font-medium text-foreground")}>
              {t("nav.more")}<ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            {analysisLinks.map(([label, href]) => <DropdownMenuItem asChild key={href}><Link href={href} aria-current={pathname === href ? "page" : undefined}>{t(label)}</Link></DropdownMenuItem>)}
            <DropdownMenuSeparator />
            {resourceLinks.map(([label, href]) => <DropdownMenuItem asChild key={href}><Link href={href} aria-current={pathname === href ? "page" : undefined}>{t(label)}</Link></DropdownMenuItem>)}
            {user && <><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/workspace">{t("nav.workspace")}</Link></DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        {!isLoading && (user ? <><span className="hidden max-w-40 truncate text-sm text-muted-foreground lg:inline">{user.first_name || user.email}</span><Button variant="ghost" onClick={logout}>{t("auth.logout")}</Button></> : <><Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">{t("auth.login")}</Link></Button><Button asChild className="hidden sm:inline-flex"><Link href="/register">{t("auth.getStarted")}</Link></Button></>)}
        <Sheet><SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label={t("nav.open")}><Menu /></Button></SheetTrigger>
          <SheetContent side="right" className="w-[min(90vw,360px)] p-0"><SheetHeader className="border-b p-5"><SheetTitle className="flex items-center gap-2"><Network className="size-5 text-primary" />TradeGraph AI</SheetTitle></SheetHeader>
            <nav aria-label={t("nav.mobile")} className="flex flex-col gap-1 p-4">{primaryLinks.map(([label, href]) => <SheetClose asChild key={href}><Link href={href} className={linkClass(href)}>{t(label)}</Link></SheetClose>)}
              {analysisLinks.map(([label, href]) => <SheetClose asChild key={href}><Link href={href} className={linkClass(href)}>{t(label)}</Link></SheetClose>)}
              <Separator className="my-2" />{resourceLinks.map(([label, href]) => <SheetClose asChild key={href}><Link href={href} className={linkClass(href)}>{t(label)}</Link></SheetClose>)}
              {user?.role === "admin" && <><Separator className="my-2" /><p className="px-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("nav.administration")}</p><SheetClose asChild><Link href="/admin/data-health" className={linkClass("/admin/data-health")}>{t("nav.dataHealth")}</Link></SheetClose></>}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </PageContainer>
    {user?.role === "admin" && <div className="hidden border-t bg-muted/35 xl:block"><PageContainer className="flex h-9 items-center gap-3 text-xs"><span className="font-medium text-muted-foreground">{t("nav.administration")}</span><Link href="/admin/data-health" className={cn("hover:underline", pathname.startsWith("/admin") && "font-medium text-primary")}>{t("nav.dataHealth")}</Link></PageContainer></div>}
  </header>
}
