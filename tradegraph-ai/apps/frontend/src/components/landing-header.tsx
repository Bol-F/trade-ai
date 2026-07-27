"use client"

import Link from "next/link"
import { Menu, Network } from "lucide-react"

import { LanguageSwitcher } from "@/components/language-switcher"
import { PageContainer } from "@/components/page-container"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const links = [
  ["Features", "#features"],
  ["AI Analysis", "#ai-analysis"],
  ["Security", "#security"],
  ["Pricing", "#pricing"],
  ["About", "#about"],
] as const

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/92 backdrop-blur-sm">
      <PageContainer className="flex min-h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold" aria-label="Trade AI home">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Network aria-hidden="true" className="size-4" />
          </span>
          <span>Trade AI</span>
        </Link>
        <nav aria-label="Landing page" className="ml-auto hidden items-center gap-1 lg:flex">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 lg:ml-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">Get Started</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open landing navigation">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(90vw,360px)] p-0">
              <SheetHeader className="border-b p-5">
                <SheetTitle className="flex items-center gap-2">
                  <Network aria-hidden="true" className="size-5 text-primary" />
                  Trade AI
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile landing page" className="flex flex-col gap-1 p-4">
                {links.map(([label, href]) => (
                  <SheetClose asChild key={href}>
                    <Link href={href} className="rounded-md px-3 py-3 text-sm hover:bg-muted">
                      {label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-4 grid gap-2 border-t pt-4">
                  <SheetClose asChild>
                    <Button variant="outline" asChild><Link href="/login">Sign In</Link></Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild><Link href="/register">Get Started</Link></Button>
                  </SheetClose>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </PageContainer>
    </header>
  )
}
