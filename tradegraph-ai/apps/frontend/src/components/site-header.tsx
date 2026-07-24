"use client"

import Link from "next/link"
import { Network } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PageContainer } from "@/components/page-container"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api"

const links = [["Countries", "/countries"], ["Products", "/products"], ["Explorer", "/explorer"]]

export function SiteHeader() {
  const { user, isLoading, refresh } = useAuth()
  async function logout() {
    await authApi.logout()
    await refresh()
  }
  return <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur"><PageContainer className="flex min-h-16 flex-wrap items-center gap-3 py-3">
    <Link href="/" className="flex items-center gap-2 font-semibold"><Network className="size-5 text-primary" />TradeGraph AI</Link>
    <nav className="order-3 flex w-full gap-5 overflow-x-auto md:order-none md:ml-8 md:w-auto">{links.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap text-sm text-muted-foreground hover:text-foreground">{label}</Link>)}{user && <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">Account</Link>}</nav>
    <div className="ml-auto flex items-center gap-1"><ThemeToggle />{!isLoading && (user ? <><span className="hidden max-w-40 truncate text-sm text-muted-foreground lg:inline">{user.first_name || user.email}</span><Button variant="ghost" onClick={logout}>Log out</Button></> : <><Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">Log in</Link></Button><Button asChild><Link href="/register">Get started</Link></Button></>)}</div>
  </PageContainer></header>
}
