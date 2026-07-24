"use client"

import { useQuery } from "@tanstack/react-query"
import { FormEvent, useMemo, useState } from "react"
import { BarChart3, Boxes, Globe2, TrendingUp } from "lucide-react"
import { EChart } from "@/components/echarts"
import { PageContainer } from "@/components/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { catalogApi, tradeApi, type TradeFilters } from "@/lib/api"
import { toTimeseriesOption } from "@/lib/chart-transform"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 })
const number = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

export function ExplorerDashboard() {
  const [draft, setDraft] = useState<TradeFilters>({ start_year: "2017", end_year: "2024" })
  const [filters, setFilters] = useState<TradeFilters>(draft)
  const countries = useQuery({ queryKey: ["countries", "explorer"], queryFn: () => catalogApi.countries("") })
  const overview = useQuery({ queryKey: ["trade-overview", filters], queryFn: () => tradeApi.overview(filters) })
  const timeseries = useQuery({ queryKey: ["trade-timeseries", filters], queryFn: () => tradeApi.timeseries(filters) })
  const partners = useQuery({ queryKey: ["trade-partners", filters], queryFn: () => tradeApi.partners(filters) })
  const products = useQuery({ queryKey: ["trade-top-products", filters], queryFn: () => tradeApi.topProducts(filters) })
  const chartOption = useMemo(() => toTimeseriesOption(timeseries.data?.data ?? []), [timeseries.data])
  const loading = overview.isLoading || timeseries.isLoading || partners.isLoading || products.isLoading
  const failed = overview.isError || timeseries.isError || partners.isError || products.isError

  function apply(event: FormEvent) {
    event.preventDefault()
    setFilters({ ...draft })
  }

  return <PageContainer className="py-10 md:py-14">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="font-mono text-xs uppercase tracking-widest text-primary">Synthetic sample · BACI-compatible</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Trade Explorer</h1><p className="mt-3 max-w-2xl text-muted-foreground">Follow eight years of normalized sample flows from source CSV to analytical API.</p></div>
      {overview.data?.meta.dataset_version && <p className="font-mono text-xs text-muted-foreground">Dataset {overview.data.meta.dataset_version} · through {overview.data.meta.source_period_end}</p>}
    </div>

    <form onSubmit={apply} className="mt-8 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-5">
      <Filter label="Importer"><Select value={draft.importer ?? ""} onChange={event => setDraft(value => ({ ...value, importer: event.target.value }))}><option value="">All importers</option>{countries.data?.results.map(country => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}</Select></Filter>
      <Filter label="Exporter"><Select value={draft.exporter ?? ""} onChange={event => setDraft(value => ({ ...value, exporter: event.target.value }))}><option value="">All exporters</option>{countries.data?.results.map(country => <option key={country.iso3} value={country.iso3}>{country.name}</option>)}</Select></Filter>
      <Filter label="HS2 product"><Input value={draft.product ?? ""} onChange={event => setDraft(value => ({ ...value, product: event.target.value.replace(/\D/g, "").slice(0, 2) }))} placeholder="e.g. 01" inputMode="numeric" /></Filter>
      <Filter label="Start year"><Input type="number" min="1900" max="2100" value={draft.start_year ?? ""} onChange={event => setDraft(value => ({ ...value, start_year: event.target.value }))} /></Filter>
      <Filter label="End year"><div className="flex gap-2"><Input type="number" min="1900" max="2100" value={draft.end_year ?? ""} onChange={event => setDraft(value => ({ ...value, end_year: event.target.value }))} /><Button className="shrink-0">Apply</Button></div></Filter>
    </form>

    {failed ? <div role="alert" className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">Explorer data is unavailable. Run <code className="font-mono">make import-sample</code> and confirm the API is online.</div> :
    loading ? <DashboardLoading /> : <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BarChart3} label="Trade value" value={money.format(overview.data?.data.total_trade_value_usd ?? 0)} />
        <Metric icon={Boxes} label="Quantity" value={`${number.format(overview.data?.data.total_quantity_tons ?? 0)} t`} />
        <Metric icon={Globe2} label="Trade relationships" value={String(overview.data?.data.partner_count ?? 0)} />
        <Metric icon={TrendingUp} label="Latest YoY change" value={overview.data?.data.yoy_change_percent == null ? "—" : `${overview.data.data.yoy_change_percent.toFixed(1)}%`} />
      </div>
      <section className="mt-6 rounded-xl border bg-card p-4 sm:p-6"><div className="mb-2"><h2 className="font-medium">Annual trade value</h2><p className="text-sm text-muted-foreground">USD, current filtered selection</p></div>{timeseries.data?.data.length ? <EChart option={chartOption} /> : <Empty />}</section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Ranking title="Top partners" columns={["Partner", "Trade value"]} rows={(partners.data?.data ?? []).map(row => ({ id: row.iso3, cells: [<span key={row.iso3}>{row.name} <span className="font-mono text-xs text-muted-foreground">{row.iso3}</span></span>, money.format(row.trade_value_usd ?? 0)] }))} />
        <Ranking title="Top products" columns={["HS6 product", "Trade value"]} rows={(products.data?.data ?? []).map(row => ({ id: row.code, cells: [<span key={row.code}><span className="font-mono">{row.code}</span> · {row.name}</span>, money.format(row.trade_value_usd ?? 0)] }))} />
      </div>
    </>}
  </PageContainer>
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <Label className="block space-y-2"><span className="block">{label}</span>{children}</Label> }
function Metric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) { return <div className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between text-muted-foreground"><span className="text-sm">{label}</span><Icon className="size-4" /></div><p className="mt-5 font-mono text-2xl font-semibold">{value}</p></div> }
function Ranking({ title, columns, rows }: { title: string; columns: string[]; rows: { id: string; cells: React.ReactNode[] }[] }) { return <section className="overflow-hidden rounded-xl border bg-card"><div className="p-5"><h2 className="font-medium">{title}</h2></div>{rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead className="bg-muted/60 text-left text-muted-foreground"><tr>{columns.map(column => <th key={column} className="px-5 py-3">{column}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} className="border-t"><td className="px-5 py-4">{row.cells[0]}</td><td className="px-5 py-4 text-right font-mono">{row.cells[1]}</td></tr>)}</tbody></table></div> : <Empty />}</section> }
function Empty() { return <div className="p-10 text-center text-sm text-muted-foreground">No data matches these filters.</div> }
function DashboardLoading() { return <div aria-label="Loading explorer" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(item => <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div> }
