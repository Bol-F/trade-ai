import Link from "next/link"
import { Network } from "lucide-react"
import { PageContainer } from "@/components/page-container"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
const links = [["Explorer", "/explorer"], ["Methodology", "/methodology"], ["Data sources", "/data-sources"]]
export function SiteHeader() {
  return <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur"><PageContainer className="flex h-16 items-center">
    <Link href="/" className="flex items-center gap-2 font-semibold"><Network className="size-5 text-primary" />TradeGraph AI</Link>
    <nav className="ml-10 hidden gap-6 md:flex">{links.map(([label, href]) => <Link key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>)}</nav>
    <div className="ml-auto flex items-center gap-1"><ThemeToggle /><Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">Log in</Link></Button><Button asChild><Link href="/register">Get started</Link></Button></div>
  </PageContainer></header>
}
