"use client"

import { useQuery } from "@tanstack/react-query"
import type { EChartsOption } from "echarts"
import Link from "next/link"
import { EChart } from "@/components/echarts"
import { PageContainer } from "@/components/page-container"
import { analyticsApi, catalogApi } from "@/lib/api"

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 })
const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 })

function historyOption(points: { year: number; value: string | number | null }[]): EChartsOption {
  return {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: points.map((point) => point.year) },
    yAxis: { type: "value" },
    series: [{ type: "line", smooth: true, areaStyle: {}, data: points.map((point) => Number(point.value ?? 0)) }],
  }
}

function Ranking({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">{title}</h2>
    {rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No data available.</p> :
      <ol className="mt-4 space-y-3">{rows.map((row) => <li key={row.label} className="flex justify-between gap-4 border-b pb-2 text-sm last:border-0"><span>{row.label}</span><span className="font-mono">{row.value}</span></li>)}</ol>}
  </section>
}

export function CountryAnalyticsProfile({ iso3 }: { iso3: string }) {
  const profile = useQuery({ queryKey: ["country-profile", iso3], queryFn: () => analyticsApi.countryProfile(iso3) })
  const catalog = useQuery({ queryKey: ["country", iso3], queryFn: () => catalogApi.country(iso3) })
  if (profile.isLoading) return <ProfileLoading />
  if (!profile.data) return <ProfileError />
  const data = profile.data.data
  return <PageContainer className="py-10">
    <Link href="/countries" className="text-sm text-muted-foreground">← Countries</Link>
    <p className="mt-8 font-mono text-sm text-primary">{iso3.toUpperCase()}</p>
    <h1 className="mt-2 text-4xl font-semibold">{catalog.data?.name ?? "Country profile"}</h1>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Total imports" value={money.format(data.total_imports_usd)} />
      <Metric label="Total exports" value={money.format(data.total_exports_usd)} />
      <Metric label="Supplier HHI" value={data.concentration.hhi.toFixed(3)} />
      <Metric label="Exposure score" value={`${data.exposure.score.toFixed(1)} / 100`} />
    </div>
    <section className="mt-6 rounded-xl border bg-card p-5"><h2 className="font-semibold">Historical trade</h2><EChart option={historyOption(data.history)} /></section>
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Ranking title="Top products" rows={data.top_products.map((row) => ({ label: `HS ${row.code}`, value: money.format(row.trade_value_usd) }))} />
      <Ranking title="Top suppliers" rows={data.top_suppliers.map((row) => ({ label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd) }))} />
      <Ranking title="Top destinations" rows={data.top_destinations.map((row) => ({ label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd) }))} />
    </div>
    <p className="mt-6 text-xs text-muted-foreground">{data.exposure.methodology}</p>
  </PageContainer>
}

export function ProductAnalyticsProfile({ code }: { code: string }) {
  const hs2 = code.slice(0, 2)
  const profile = useQuery({ queryKey: ["product-profile", hs2], queryFn: () => analyticsApi.productProfile(hs2) })
  const catalog = useQuery({ queryKey: ["product", code], queryFn: () => catalogApi.product(code) })
  if (profile.isLoading) return <ProfileLoading />
  if (!profile.data) return <ProfileError />
  const data = profile.data.data
  return <PageContainer className="py-10">
    <Link href="/products" className="text-sm text-muted-foreground">← Products</Link>
    <p className="mt-8 font-mono text-sm text-primary">HS2 {hs2}</p>
    <h1 className="mt-2 text-3xl font-semibold">{catalog.data?.name ?? data.name ?? "Product profile"}</h1>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Metric label="Supplier HHI" value={data.concentration.hhi.toFixed(3)} />
      <Metric label="Active exporters" value={String(data.concentration.supplier_count)} />
      <Metric label="Flagged years" value={String(data.anomalies.filter((item) => item.severity !== "normal").length)} />
    </div>
    <section className="mt-6 rounded-xl border bg-card p-5"><h2 className="font-semibold">Global trade trend</h2><EChart option={historyOption(data.global_trend)} /></section>
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Ranking title="Top exporters" rows={data.top_exporters.map((row) => ({ label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd) }))} />
      <Ranking title="Top importers" rows={data.top_importers.map((row) => ({ label: `${row.name} (${row.iso3})`, value: money.format(row.trade_value_usd) }))} />
      <Ranking title="Fastest-growing exporters" rows={data.fastest_growing_countries.map((row) => ({ label: row.iso3, value: percent.format(row.cagr) }))} />
    </div>
  </PageContainer>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-5"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 font-mono text-2xl font-semibold">{value}</p></div>
}
function ProfileLoading() { return <PageContainer className="py-16"><div className="h-10 w-72 animate-pulse rounded bg-muted" /><div className="mt-8 h-80 animate-pulse rounded-xl bg-muted" /></PageContainer> }
function ProfileError() { return <PageContainer className="py-20"><h1 className="text-2xl font-semibold">Analytics unavailable</h1><p className="mt-3 text-muted-foreground">Import the sample dataset and try again.</p></PageContainer> }
