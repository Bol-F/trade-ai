"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { EmptyState, ErrorState, FilterBar, FilterSection, PageHeader } from "@/components/design-system"
import { PageContainer } from "@/components/page-container"
import { TradeMap } from "@/components/trade-map"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { tradeApi } from "@/lib/api"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact" })

export function MapDashboard() {
  const [year, setYear] = useState("2024")
  const [product, setProduct] = useState("")
  const [top, setTop] = useState("25")
  const filters = { start_year: year, end_year: year, product, top }
  const query = useQuery({ queryKey: ["trade-map", filters], queryFn: () => tradeApi.map(filters) })
  const flows = query.data?.data ?? []
  return <PageContainer className="py-10">
    <PageHeader eyebrow="Directional network" title="Global trade map" description="Inspect the highest-value aggregated country-to-country flows. Arrows run from exporter to importer; line weight represents reported trade value." breadcrumbs={[{ label: "Overview", href: "/" }, { label: "Map" }]} />
    <FilterBar><FilterSection className="sm:grid-cols-3 xl:grid-cols-3">
      <Label>Selected year<Input className="mt-2" inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} /></Label>
      <Label>HS2 product<Input className="mt-2" maxLength={2} placeholder="All products" value={product} onChange={(event) => setProduct(event.target.value.replace(/\D/g, ""))} /></Label>
      <Label>Visible flows<Select className="mt-2" value={top} onChange={(event) => setTop(event.target.value)}><option value="10">Top 10</option><option value="25">Top 25</option><option value="50">Top 50</option></Select></Label>
    </FilterSection></FilterBar>
    <section aria-label="Trade flow visualization" className="relative mt-6 overflow-hidden rounded-xl border bg-card">
      {query.isLoading && <div className="grid h-[560px] place-items-center bg-muted/30"><p className="text-sm text-muted-foreground">Loading aggregated map flows…</p></div>}
      {query.isError && <div className="p-6"><ErrorState description="The map data could not be loaded." /></div>}
      {!query.isLoading && !query.isError && flows.length === 0 && <div className="p-6"><EmptyState description="No country-level arcs match the selected year and product." /></div>}
      {flows.length > 0 && <TradeMap flows={flows} />}
      {flows.length > 0 && <div className="absolute bottom-3 left-3 rounded-md border bg-background/95 p-3 text-xs shadow-sm"><p className="font-medium">Flow legend</p><div className="mt-2 flex items-center gap-2"><span className="h-0.5 w-12 bg-primary" />Lower value</div><div className="mt-2 flex items-center gap-2"><span className="h-1.5 w-12 bg-primary" />Higher value</div><p className="mt-2 text-muted-foreground">Exporter → importer</p></div>}
    </section>
    {flows.length > 0 && <section className="mt-6 overflow-hidden rounded-xl border"><div className="p-4"><h2 className="font-semibold">Accessible flow table</h2><p className="mt-1 text-sm text-muted-foreground">The same top-N arcs shown on the map.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><caption className="sr-only">Trade flows for {year}</caption><thead className="bg-muted/50 text-left"><tr><th className="p-3">Exporter</th><th className="p-3">Importer</th><th className="p-3 text-right">Trade value</th></tr></thead><tbody>{flows.map((flow, index) => <tr className="border-t" key={`${flow.exporter.iso3}-${flow.importer.iso3}-${index}`}><td className="p-3">{flow.exporter.name} <span className="font-mono text-muted-foreground">{flow.exporter.iso3}</span></td><td className="p-3">{flow.importer.name} <span className="font-mono text-muted-foreground">{flow.importer.iso3}</span></td><td className="p-3 text-right font-mono">{money.format(flow.trade_value_usd ?? 0)}</td></tr>)}</tbody></table></div></section>}
  </PageContainer>
}
