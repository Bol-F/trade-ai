"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BarChart3, Boxes, Globe2, ShieldCheck } from "lucide-react"
import { DataFreshnessBadge, DatasetVersionBadge, ErrorState, KpiCard, LoadingSkeleton, PageHeader } from "@/components/design-system"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { catalogApi, datasetsApi } from "@/lib/api"
import { queryKeys } from "@/lib/query-options"

export function OverviewPage() {
  const countries = useQuery({ queryKey: queryKeys.countries(), queryFn: () => catalogApi.countries("") })
  const products = useQuery({ queryKey: queryKeys.products(), queryFn: () => catalogApi.products("") })
  const sources = useQuery({ queryKey: ["data-sources"], queryFn: datasetsApi.sources })
  const loading = countries.isLoading || products.isLoading || sources.isLoading
  const failed = countries.isError || products.isError || sources.isError
  const meta = sources.data?.meta
  const source = sources.data?.data[0]

  return <PageContainer className="py-10 sm:py-14">
    <PageHeader eyebrow="International trade analysis" title="Understand who trades what, with whom, and how that changes."
      description="TradeGraph AI turns country-to-country merchandise trade records into searchable flows, concentration measures, anomaly signals, forecasts, and explainable supplier comparisons."
      actions={<><Button asChild><Link href="/explorer">Open Explorer <ArrowRight /></Link></Button><Button variant="outline" asChild><Link href="/explorer?importer=UZB&product=10">Explore Uzbekistan’s wheat suppliers</Link></Button></>}
      metadata={<><DatasetVersionBadge version={meta?.dataset_version} /><DataFreshnessBadge year={meta?.source_period_end} /></>}
    />
    {loading ? <div className="mt-8"><LoadingSkeleton rows={3} /></div> : failed ? <div className="mt-8"><ErrorState description="The active data source and catalog counts could not be loaded. Check that the API is available." /></div> : <>
      <section aria-labelledby="coverage-title" className="mt-8"><div className="mb-4 flex items-end justify-between"><div><h2 id="coverage-title" className="text-lg font-semibold">Active data coverage</h2><p className="mt-1 text-sm text-muted-foreground">Live catalog and dataset metadata, not fabricated statistics.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Globe2} label="Countries and economies" value={(countries.data?.count ?? 0).toLocaleString()} />
          <KpiCard icon={Boxes} label="Product categories" value={(products.data?.count ?? 0).toLocaleString()} />
          <KpiCard icon={BarChart3} label="Coverage through" value={String(meta?.source_period_end ?? "—")} />
          <KpiCard icon={ShieldCheck} label="Active source" value={source?.code ?? "—"} detail={source?.name} />
        </div>
      </section>
      <section aria-labelledby="questions-title" className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="shadow-none"><CardHeader><CardTitle id="questions-title">Questions you can investigate</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
          {["How has a product’s trade changed over time?", "Which suppliers dominate an importer’s demand?", "Which flows departed from their historical pattern?", "Which alternative suppliers meet transparent ranking rules?"].map((question) => <div key={question} className="rounded-lg bg-muted/55 p-4 text-sm leading-6">{question}</div>)}
        </CardContent></Card>
        <Card className="border-primary/25 bg-primary/[0.035] shadow-none"><CardHeader><CardTitle>Decision support, not certainty</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>Forecasts are statistical estimates based on historical project data. Exposure scores summarize trade-supply structure; they are not complete political, logistics, security, or financial risk scores.</p><Link href="/methodology" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">Review methodology <ArrowRight className="size-4" /></Link></CardContent></Card>
      </section>
    </>}
  </PageContainer>
}
