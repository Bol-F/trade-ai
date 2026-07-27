"use client"

import Link from "next/link"
import { AlertCircle, CalendarRange, CheckCircle2, CircleAlert, Database, Info, LoaderCircle, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  metadata,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  metadata?: React.ReactNode
}) {
  return <header className="space-y-5 border-b pb-7">
    {breadcrumbs && <nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {breadcrumbs.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-2">
        {index > 0 && <span aria-hidden="true">/</span>}
        {item.href ? <Link href={item.href} className="hover:text-foreground hover:underline">{item.label}</Link> : <span aria-current="page">{item.label}</span>}
      </li>)}
    </ol></nav>}
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        {eyebrow && <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {metadata && <div className="flex flex-wrap gap-2">{metadata}</div>}
  </header>
}

export function FilterBar({ children, title = "Filters" }: { children: React.ReactNode; title?: string }) {
  return <section aria-labelledby="filter-heading" className="sticky top-[65px] z-20 mt-6 rounded-xl border bg-background/95 shadow-sm backdrop-blur">
    <div className="border-b px-4 py-3"><h2 id="filter-heading" className="text-sm font-medium">{title}</h2></div>
    <div className="p-4">{children}</div>
  </section>
}

export function FilterSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-5", className)}>{children}</div>
}

export function KpiCard({ label, value, detail, icon: Icon, trend }: { label: string; value: string; detail?: string; icon?: LucideIcon; trend?: { value: string; direction: "up" | "down" | "flat"; label: string } }) {
  return <Card className="gap-0 py-0 shadow-none"><CardContent className="p-5">
    <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground"><span>{label}</span>{Icon && <Icon aria-hidden="true" className="size-4" />}</div>
    <p className="mt-5 font-mono text-2xl font-semibold tracking-tight" data-financial-value="true">{value}</p>
    {trend && <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trend.direction === "up" ? "text-success" : trend.direction === "down" ? "text-destructive" : "text-muted-foreground")}>
      {trend.direction === "up" ? <TrendingUp aria-hidden="true" className="size-3.5" /> : trend.direction === "down" ? <TrendingDown aria-hidden="true" className="size-3.5" /> : null}
      <span>{trend.value}</span><span className="font-normal text-muted-foreground">{trend.label}</span>
    </p>}
    {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
  </CardContent></Card>
}

export const MetricCard = KpiCard

export function ChartCard({ title, description, summary, children }: { title: string; description?: string; summary: string; children: React.ReactNode }) {
  return <Card className="shadow-none"><CardHeader><CardTitle className="text-base">{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader>
    <CardContent><figure aria-label={title}>{children}<figcaption className="sr-only">{summary}</figcaption></figure></CardContent>
  </Card>
}

export const ChartContainer = ChartCard

export function EmptyState({ title = "No matching data", description, action }: { title?: string; description: string; action?: React.ReactNode }) {
  return <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
    <Database aria-hidden="true" className="size-6 text-muted-foreground" /><h3 className="mt-4 font-medium">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>{action && <div className="mt-4">{action}</div>}
  </div>
}

export function ErrorState({ title = "Data unavailable", description }: { title?: string; description: string }) {
  return <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
    <div className="flex items-start gap-3"><AlertCircle aria-hidden="true" className="mt-0.5 size-5 text-destructive" /><div><h3 className="font-medium">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div>
  </div>
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return <div aria-label="Loading content" aria-busy="true" className="space-y-3">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div>
}

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
  return <div role="status" aria-live="polite" className="flex min-h-32 items-center justify-center gap-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
    <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" /><span>{label}</span>
  </div>
}

export function DataFreshnessBadge({ year }: { year: number | string | null | undefined }) {
  return <Badge variant="outline" className="gap-1.5 font-normal"><CalendarRange aria-hidden="true" className="size-3.5" />Data through {year ?? "unknown"}</Badge>
}

export function DatasetVersionBadge({ version }: { version: string | null | undefined }) {
  return <Badge variant="secondary" className="gap-1.5 font-mono font-normal"><Database aria-hidden="true" className="size-3.5" />{version ?? "No active dataset"}</Badge>
}

export function MethodologyTooltip({ text }: { text: string }) {
  return <Tooltip><TooltipTrigger aria-label="Methodology explanation"><Info className="size-4 text-muted-foreground" /></TooltipTrigger><TooltipContent className="max-w-xs">{text}</TooltipContent></Tooltip>
}

export function RiskIndicator({ score }: { score: number }) {
  const label = score >= 70 ? "High" : score >= 40 ? "Moderate" : "Lower"
  const tone = score >= 70 ? "[&_[data-slot=progress-indicator]]:bg-destructive" : score >= 40 ? "[&_[data-slot=progress-indicator]]:bg-warning" : "[&_[data-slot=progress-indicator]]:bg-success"
  return <div aria-label={`${label} exposure, ${score.toFixed(1)} out of 100`}>
    <div className="flex justify-between text-xs"><span>{label} exposure</span><span className="font-mono">{score.toFixed(1)}/100</span></div>
    <Progress value={score} className={cn("mt-2", tone)} />
  </div>
}

export function ConfidenceIndicator({ value, label = "Model confidence" }: { value: number; label?: string }) {
  const bounded = Math.min(100, Math.max(0, value))
  const level = bounded >= 80 ? "High" : bounded >= 55 ? "Moderate" : "Low"
  const tone = bounded >= 80 ? "[&_[data-slot=progress-indicator]]:bg-success" : bounded >= 55 ? "[&_[data-slot=progress-indicator]]:bg-primary" : "[&_[data-slot=progress-indicator]]:bg-warning"
  return <div aria-label={`${label}: ${level}, ${bounded.toFixed(0)} percent`}>
    <div className="flex justify-between gap-4 text-xs"><span>{label} · {level}</span><span className="font-mono">{bounded.toFixed(0)}%</span></div>
    <Progress value={bounded} className={cn("mt-2", tone)} />
  </div>
}

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral"

export function StatusBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" || tone === "danger" ? CircleAlert : Info
  return <Badge variant="outline" className={cn(
    "gap-1.5",
    tone === "success" && "border-success/30 bg-success-surface text-success",
    tone === "warning" && "border-warning/30 bg-warning-surface text-warning",
    tone === "danger" && "border-destructive/30 bg-danger-surface text-destructive",
    tone === "info" && "border-info/30 bg-info-surface text-info",
    tone === "neutral" && "text-muted-foreground",
  )}><Icon aria-hidden="true" className="size-3.5" />{children}</Badge>
}

export function MetricExplanation({ term, children }: { term: string; children: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-3 border-b py-3 last:border-0"><dt className="text-sm text-muted-foreground">{term}</dt><dd className="text-right text-sm">{children}</dd></div>
}
