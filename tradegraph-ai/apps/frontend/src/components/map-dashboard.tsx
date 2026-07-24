"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PageContainer } from "@/components/page-container"
import { TradeMap } from "@/components/trade-map"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { tradeApi } from "@/lib/api"

export function MapDashboard() {
  const [year, setYear] = useState("2024")
  const [product, setProduct] = useState("")
  const [top, setTop] = useState("25")
  const filters = { start_year: year, end_year: year, product, top }
  const query = useQuery({ queryKey: ["trade-map", filters], queryFn: () => tradeApi.map(filters) })

  return <PageContainer className="py-10">
    <p className="font-mono text-sm text-primary">Aggregated network</p>
    <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Global trade map</h1>
    <p className="mt-3 text-muted-foreground">Directional top-N flows; line thickness represents trade value.</p>
    <div className="mt-8 grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
      <Label>Year<Input className="mt-2" inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} /></Label>
      <Label>HS2 product<Input className="mt-2" maxLength={2} placeholder="All products" value={product} onChange={(event) => setProduct(event.target.value)} /></Label>
      <Label>Top flows<Select className="mt-2" value={top} onChange={(event) => setTop(event.target.value)}><option value="10">Top 10</option><option value="25">Top 25</option><option value="50">Top 50</option></Select></Label>
    </div>
    <div className="mt-6 overflow-hidden rounded-xl border bg-card">
      {query.isLoading && <div className="h-[560px] animate-pulse bg-muted" />}
      {query.isError && <p className="p-8 text-destructive">The map data could not be loaded.</p>}
      {query.data && query.data.data.length === 0 && <p className="p-8 text-muted-foreground">No flows match these filters.</p>}
      {query.data && query.data.data.length > 0 && <TradeMap flows={query.data.data} />}
    </div>
    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-1 w-16 rounded bg-teal-600" /> Thin = lower value · Thick = higher value · Direction is exporter to importer</div>
  </PageContainer>
}
