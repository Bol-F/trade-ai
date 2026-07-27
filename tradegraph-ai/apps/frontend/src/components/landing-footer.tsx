import Link from "next/link"
import { Activity } from "lucide-react"

import { PageContainer } from "@/components/page-container"

const groups = [
  {
    title: "Product",
    links: [["Features", "#features"], ["AI Analysis", "#ai-analysis"], ["Pricing", "#pricing"], ["Dashboard", "/explorer"]],
  },
  {
    title: "Company",
    links: [["About", "#about"], ["Contact", "mailto:hello@trade-ai.example"], ["Security", "#security"], ["Methodology", "/methodology"]],
  },
  {
    title: "Legal",
    links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Risk Disclaimer", "#risk-disclaimer"]],
  },
] as const

export function LandingFooter() {
  return (
    <footer className="bg-background">
      <PageContainer className="py-12">
        <div className="grid gap-10 border-b pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-semibold">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Activity aria-hidden="true" className="size-4" />
              </span>
              Trade AI
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              AI-assisted market analysis with transparent risk context for disciplined research teams.
            </p>
            <div className="mt-5 flex gap-4 text-sm">
              <a className="text-muted-foreground hover:text-foreground" href="https://github.com/Bol-F/trade-ai" rel="noreferrer">GitHub</a>
              <a className="text-muted-foreground hover:text-foreground" href="mailto:hello@trade-ai.example">Email</a>
            </div>
          </div>
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div id="risk-disclaimer" className="scroll-mt-20 pt-8">
          <p className="text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">Financial risk disclaimer:</strong> Trade AI provides analytical information only. Results are not guaranteed, financial markets involve risk, and users remain responsible for their decisions. The product does not replace professional financial, investment, legal, or tax advice.
          </p>
          <p className="mt-5 text-xs text-muted-foreground">© {new Date().getFullYear()} Trade AI. All rights reserved.</p>
        </div>
      </PageContainer>
    </footer>
  )
}
