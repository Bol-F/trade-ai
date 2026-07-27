import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Database,
  Eye,
  Gauge,
  History,
  LineChart,
  ListChecks,
  LockKeyhole,
  Radar,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

import { LandingDashboardPreview } from "@/components/landing-dashboard-preview"
import { LandingFooter } from "@/components/landing-footer"
import { PageContainer } from "@/components/page-container"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const metrics = [
  ["190+", "Markets covered", "Illustrative coverage"],
  ["5,000+", "Assets monitored", "Demo platform metric"],
  ["12", "Active AI models", "Illustrative model set"],
  ["2.4 sec", "Average analysis", "Illustrative response time"],
] as const

const features = [
  [BrainCircuit, "AI Market Analysis", "Combine market history, momentum, and context into an explainable research view."],
  [Target, "Smart Trading Signals", "Surface rule-based opportunities with confidence, timing, and supporting factors."],
  [BriefcaseBusiness, "Portfolio Intelligence", "Monitor allocation, exposure, performance, and concentration from one workspace."],
  [Gauge, "Risk Management", "Track volatility and downside exposure before acting on an analytical signal."],
  [BellRing, "Real-Time Alerts", "Receive focused notifications when monitored conditions materially change."],
  [Radar, "Market Sentiment", "Compare market tone with measured price and volume behavior."],
  [History, "Historical Backtesting", "Evaluate how a strategy would have behaved across prior market conditions."],
  [ListChecks, "Custom Watchlists", "Organize the assets, markets, and signals that matter to your workflow."],
] as const

const steps = [
  [Database, "Market data collection", "Normalize the selected market and historical inputs."],
  [LineChart, "Technical and fundamental analysis", "Evaluate trends, fundamentals, liquidity, and context."],
  [BrainCircuit, "AI model evaluation", "Compare model outputs and retain their supporting factors."],
  [ShieldCheck, "Risk scoring", "Measure volatility, concentration, and uncertainty."],
  [SearchCheck, "Actionable insight generation", "Present a clear, reviewable research summary."],
] as const

const security = [
  [LockKeyhole, "Encrypted data", "Sensitive traffic and account data are protected by the application’s secure transport and storage configuration."],
  [ShieldCheck, "Secure authentication", "Cookie-based sessions, CSRF controls, and protected account workflows reduce common authentication risks."],
  [Eye, "Privacy protection", "Account access is scoped and personal data is limited to what the product needs."],
  [BarChart3, "Transparent analytics", "Forecasts include confidence, inputs, lineage, and limitations rather than unexplained certainty."],
  [Users, "Controlled account access", "Role-aware application areas keep administrative capabilities separate."],
  [CircleDollarSign, "Risk disclosures", "Every analytical output remains decision support—not a promise of performance."],
] as const

const plans = [
  {
    name: "Starter",
    description: "For users beginning with AI market analysis.",
    price: "$0",
    suffix: "to explore",
    features: ["3 watchlists", "Daily market summaries", "Core AI analysis", "Community support"],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Professional",
    description: "For active traders and analysts.",
    price: "$49",
    suffix: "per user / month",
    features: ["Unlimited watchlists", "Real-time signals", "Portfolio risk views", "Backtesting tools", "Priority support"],
    cta: "Start Professional",
    featured: true,
  },
  {
    name: "Institutional",
    description: "For teams and professional organizations.",
    price: "Custom",
    suffix: "based on requirements",
    features: ["Team workspaces", "Controlled access", "Higher usage limits", "Data export", "Implementation support"],
    cta: "Contact Sales",
    featured: false,
  },
] as const

export function LandingPage() {
  return (
    <div className="overflow-clip">
      <section className="relative border-b">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_34%)]" />
        <PageContainer className="relative grid gap-12 py-16 sm:py-20 lg:grid-cols-[.82fr_1.18fr] lg:items-center lg:py-28">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-6 gap-2 border-primary/30 bg-primary/5 text-primary">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Explainable AI for market research
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Smarter Market Decisions Powered by AI
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Analyze market trends, discover trading opportunities, monitor risk, and make data-driven decisions from one intelligent platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">Start Free Analysis <ArrowRight aria-hidden="true" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/explorer">View Live Dashboard</Link>
              </Button>
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              Analytical information only. Market outcomes are uncertain and results are never guaranteed.
            </p>
          </div>
          <LandingDashboardPreview compact />
        </PageContainer>
      </section>

      <section aria-labelledby="trust-heading" className="border-b bg-muted/25">
        <PageContainer className="py-10">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">Platform scale</p>
              <h2 id="trust-heading" className="mt-2 text-xl font-semibold">Built for disciplined market research</h2>
            </div>
            <p className="text-xs text-muted-foreground">Illustrative demo metrics—not live customer or performance claims.</p>
          </div>
          <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
            {metrics.map(([value, label, detail]) => (
              <div key={label} className="bg-background p-5 sm:p-6">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-2 font-mono text-2xl font-semibold" data-financial-value="true">{value}</dd>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              </div>
            ))}
          </dl>
        </PageContainer>
      </section>

      <section id="features" aria-labelledby="features-heading" className="scroll-mt-20 py-20 sm:py-24">
        <PageContainer>
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">Research toolkit</p>
            <h2 id="features-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">One clear view of opportunity and risk</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Focused tools help analysts move from market context to a reviewable decision without hiding uncertainty.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([Icon, title, description]) => (
              <Card key={title} className="gap-0 py-0 shadow-none hover:border-primary/35 hover:shadow-card">
                <CardHeader className="p-5 pb-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon aria-hidden="true" className="size-4.5" /></span>
                  <CardTitle className="mt-4 text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-sm leading-6 text-muted-foreground">{description}</CardContent>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="ai-analysis" aria-labelledby="process-heading" className="scroll-mt-20 border-y bg-muted/25 py-20 sm:py-24">
        <PageContainer>
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">How Trade AI works</p>
            <h2 id="process-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From fragmented data to explainable insight</h2>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map(([Icon, title, description], index) => (
              <li key={title} className="relative rounded-xl border bg-background p-5">
                <div className="flex items-center justify-between">
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-sm font-semibold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </PageContainer>
      </section>

      <section aria-labelledby="preview-heading" className="py-20 sm:py-24">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">Product preview</p>
            <h2 id="preview-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A workspace designed for real analysis</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Review performance, signals, risk, confidence, activity, alerts, and the assets you follow in one coherent interface.</p>
          </div>
          <div className="mt-10"><LandingDashboardPreview /></div>
        </PageContainer>
      </section>

      <section id="security" aria-labelledby="security-heading" className="scroll-mt-20 border-y bg-muted/25 py-20 sm:py-24">
        <PageContainer className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
          <div className="max-w-xl">
            <Badge variant="outline" className="gap-2 border-success/30 bg-success-surface text-success"><ShieldCheck aria-hidden="true" className="size-3.5" />Security by design</Badge>
            <h2 id="security-heading" className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Trust comes from clear controls—not vague badges</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Trade AI describes the protections and analytical limits implemented in the product without claiming unverified certifications.</p>
            <Button variant="outline" asChild className="mt-7"><Link href="/methodology">Review Methodology <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {security.map(([Icon, title, description]) => (
              <div key={title} className="flex gap-4 rounded-xl border bg-background p-5">
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
                <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-20 py-20 sm:py-24">
        <PageContainer>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">Simple pricing</p>
            <h2 id="pricing-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Choose the right research depth</h2>
            <p className="mt-4 text-muted-foreground">Illustrative pricing for product planning. Final commercial terms may change before launch.</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-6xl gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.name} className={plan.featured ? "border-primary bg-primary/[0.035] shadow-elevated" : "shadow-none"}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {plan.featured && <Badge>Most capable</Badge>}
                  </div>
                  <CardDescription className="min-h-10 leading-5">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p><span className="font-mono text-3xl font-semibold">{plan.price}</span> <span className="text-xs text-muted-foreground">{plan.suffix}</span></p>
                  <ul className="my-7 space-y-3 text-sm">
                    {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />{feature}</li>)}
                  </ul>
                  <Button variant={plan.featured ? "default" : "outline"} asChild className="mt-auto">
                    <Link href={plan.name === "Institutional" ? "mailto:sales@trade-ai.example" : "/register"}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="about" aria-labelledby="cta-heading" className="scroll-mt-20 border-y bg-surface-sunken py-16 sm:py-20">
        <PageContainer className="text-center">
          <TrendingUp aria-hidden="true" className="mx-auto size-7 text-primary" />
          <h2 id="cta-heading" className="mx-auto mt-5 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Turn Market Data Into Clear Decisions</h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">Build a disciplined research workflow with explainable analysis and visible risk context.</p>
          <Button size="lg" asChild className="mt-8"><Link href="/register">Create Your Account <ArrowRight aria-hidden="true" /></Link></Button>
        </PageContainer>
      </section>

      <LandingFooter />
    </div>
  )
}
